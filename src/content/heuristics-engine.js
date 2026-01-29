/**
 * Heuristics Engine
 * Research-backed hallucination detection with 7 evidence-based heuristics
 */

import { logInfo, logError } from '../utils/logging';
import config from '../config/heuristics-config';
import {
    splitSentences,
    countPatternMatches,
    calculatePatternDensity,
    extractUrls,
    extractCitations,
    countSpecificityIndicators,
    hasCitations,
    detectContradictions,
    wordCount
} from '../utils/text-analysis';

/**
 * Main entry point - run all heuristics on a prompt/response pair
 * @param {object} params - { promptText, responseText, metadata }
 * @returns {object[]} - Array of flag objects
 */
export function runHeuristics({ promptText, responseText, metadata }) {
    const flags = [];

    try {
        // Run each heuristic
        const heuristics = [
            () => checkResponseTime(metadata),
            () => checkOverconfidence(responseText),
            () => checkExcessiveHedging(responseText),
            () => checkRoteLanguage(responseText),
            () => checkBadCitations(responseText),
            () => checkSpecificityWithoutSource(responseText),
            () => checkSelfContradiction(responseText),
            () => checkPromptAmbiguity(promptText)
        ];

        for (const heuristic of heuristics) {
            try {
                const result = heuristic();
                if (result) {
                    flags.push(result);
                }
            } catch (err) {
                logError('Heuristic failed', err);
            }
        }

        // Calculate combined severity
        if (flags.length > 0) {
            const combinedScore = calculateCombinedScore(flags);
            flags.forEach(f => {
                f.combinedScore = combinedScore;
                f.overallSeverity = getSeverityLevel(combinedScore);
            });
        }

        logInfo('Heuristics executed', {
            flagCount: flags.length,
            flags: flags.map(f => f.flagType)
        });

    } catch (err) {
        logError('Heuristics engine error', err);
    }

    return flags;
}

// =============================================================================
// HEURISTIC 1: Response Time
// Long generation times may indicate complex fabrication
// =============================================================================
function checkResponseTime(metadata) {
    if (metadata?.startTime == null || metadata?.endTime == null) return null;

    const duration = metadata.endTime - metadata.startTime;
    const { slowThresholdMs, verySlowThresholdMs } = config.responseTime;

    if (duration >= verySlowThresholdMs) {
        return createFlag({
            flagType: 'response_time',
            severity: 'high',
            confidence: 0.7,
            tooltipText: `Very long response time (${Math.round(duration / 1000)}s) - may indicate complex generation`,
            evidence: [`Duration: ${duration}ms`],
            source: 'heuristic_response_time'
        });
    }

    if (duration >= slowThresholdMs) {
        return createFlag({
            flagType: 'response_time',
            severity: 'moderate',
            confidence: 0.5,
            tooltipText: `Long response time (${Math.round(duration / 1000)}s)`,
            evidence: [`Duration: ${duration}ms`],
            source: 'heuristic_response_time'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 2: Overconfidence Detection
// Absolute language without hedging is a hallucination indicator
// LLMs overestimate correctness by 20-60%
// =============================================================================
function checkOverconfidence(text) {
    if (!text) return null;

    const { count, matches } = countPatternMatches(text, config.overconfidencePatterns);
    const hedging = countPatternMatches(text, config.hedgingPatterns);

    // Flag if overconfident AND low hedging
    if (count >= config.overconfidenceThreshold && hedging.count < 2) {
        const severity = count >= 5 ? 'high' : 'moderate';
        return createFlag({
            flagType: 'overconfidence',
            severity,
            confidence: Math.min(0.9, 0.5 + (count * 0.1)),
            tooltipText: `Response uses ${count} absolute certainty phrases without appropriate hedging`,
            evidence: matches.slice(0, 5),
            source: 'heuristic_overconfidence'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 3: Excessive Hedging
// High density of uncertainty markers suggests low-knowledge topic
// =============================================================================
function checkExcessiveHedging(text) {
    if (!text) return null;

    const density = calculatePatternDensity(text, config.hedgingPatterns);

    if (density > config.hedgingDensityThreshold) {
        const sentences = splitSentences(text);
        const hedgingSentences = Math.round(density * sentences.length);

        return createFlag({
            flagType: 'excessive_hedging',
            severity: density > 0.3 ? 'moderate' : 'low',
            confidence: Math.min(0.8, density * 2),
            tooltipText: `High uncertainty: ${hedgingSentences} of ${sentences.length} sentences contain hedging language`,
            evidence: [`Hedging density: ${(density * 100).toFixed(1)}%`],
            source: 'heuristic_hedging'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 4: Rote Language / ChatGPT Signatures
// Templated phrases often accompany lower-quality content
// =============================================================================
function checkRoteLanguage(text) {
    if (!text) return null;

    const { count, matches } = countPatternMatches(text, config.rotePhrases);

    if (count >= 2) {
        return createFlag({
            flagType: 'rote_language',
            severity: count >= 4 ? 'moderate' : 'low',
            confidence: Math.min(0.7, 0.3 + (count * 0.15)),
            tooltipText: `Response contains ${count} templated ChatGPT phrases`,
            evidence: matches.slice(0, 4),
            source: 'heuristic_rote'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 5: Bad Citations
// Fabricated URLs and academic references are a major hallucination type
// =============================================================================
function checkBadCitations(text) {
    if (!text) return null;

    const urls = extractUrls(text);
    const citations = extractCitations(text);
    const issues = [];

    // Check URLs against suspicious domains
    for (const url of urls) {
        const domain = extractDomain(url);
        if (config.citation.suspiciousDomains.some(d => domain.includes(d))) {
            issues.push(`Suspicious domain: ${domain}`);
        }

        // Check suspicious URL patterns
        for (const pattern of config.citation.suspiciousUrlPatterns) {
            if (pattern.test(url)) {
                issues.push(`Suspicious URL pattern: ${url.slice(0, 50)}...`);
                break;
            }
        }
    }

    // Check citation patterns
    for (const citation of citations) {
        for (const pattern of config.citation.suspiciousCitationPatterns) {
            if (pattern.test(citation)) {
                issues.push(`Suspicious citation: ${citation}`);
                break;
            }
        }
    }

    if (issues.length > 0) {
        return createFlag({
            flagType: 'bad_citation',
            severity: issues.length >= 2 ? 'high' : 'moderate',
            confidence: Math.min(0.9, 0.6 + (issues.length * 0.15)),
            tooltipText: `Found ${issues.length} potentially fabricated reference(s)`,
            evidence: issues.slice(0, 4),
            source: 'heuristic_citation'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 6: Specificity Without Source
// Precise claims without citations signal fabrication
// =============================================================================
function checkSpecificityWithoutSource(text) {
    if (!text) return null;

    const { count, details } = countSpecificityIndicators(text, config.specificityPatterns);
    const hasRefs = hasCitations(text);

    // Only flag if specific AND no citations
    if (count >= config.specificityThreshold && !hasRefs) {
        const exampleDetails = [];
        for (const [type, matches] of Object.entries(details)) {
            if (matches.length > 0) {
                exampleDetails.push(`${type}: ${matches[0]}`);
            }
        }

        return createFlag({
            flagType: 'specificity_without_source',
            severity: count >= 5 ? 'high' : 'moderate',
            confidence: Math.min(0.85, 0.5 + (count * 0.1)),
            tooltipText: `Response contains ${count} precise claims without citations`,
            evidence: exampleDetails.slice(0, 4),
            source: 'heuristic_specificity'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 7: Self-Contradiction
// Internal contradictions strongly signal fabrication
// =============================================================================
function checkSelfContradiction(text) {
    if (!text) return null;

    const { found, pairs } = detectContradictions(text, config.contradictionMarkers);

    if (found && pairs.length > 0) {
        return createFlag({
            flagType: 'self_contradiction',
            severity: pairs.length >= 2 ? 'high' : 'moderate',
            confidence: Math.min(0.8, 0.5 + (pairs.length * 0.2)),
            tooltipText: `Detected ${pairs.length} potential internal contradiction(s)`,
            evidence: pairs.slice(0, 2).map(p =>
                `"${p.sentence1.slice(0, 40)}..." vs "${p.sentence2.slice(0, 40)}..."`
            ),
            source: 'heuristic_contradiction'
        });
    }

    return null;
}

// =============================================================================
// HEURISTIC 8: Prompt Ambiguity
// Ambiguous prompts invite hallucination
// =============================================================================
function checkPromptAmbiguity(promptText) {
    if (!promptText) return null;

    const cfg = config.promptAmbiguity;
    let ambiguityScore = 0;
    const evidence = [];

    // Check vague pronouns
    const pronounMatches = promptText.match(cfg.vaguePronouns) || [];
    if (pronounMatches.length >= 2) {
        ambiguityScore += pronounMatches.length;
        evidence.push(`${pronounMatches.length} vague pronouns`);
    }

    // Check multi-step instructions
    const stepMatches = promptText.match(cfg.multiStepMarkers) || [];
    if (stepMatches.length >= 2) {
        ambiguityScore += stepMatches.length;
        evidence.push(`${stepMatches.length} sequential steps`);
    }

    // Check vague verbs
    const verbMatches = promptText.match(cfg.vagueVerbs) || [];
    if (verbMatches.length >= 1) {
        ambiguityScore += verbMatches.length;
        evidence.push(`${verbMatches.length} vague verbs`);
    }

    if (ambiguityScore >= cfg.threshold) {
        return createFlag({
            flagType: 'prompt_ambiguity',
            severity: ambiguityScore >= 6 ? 'moderate' : 'low',
            confidence: Math.min(0.7, 0.3 + (ambiguityScore * 0.1)),
            tooltipText: 'Your prompt may be ambiguous, which can increase hallucination risk',
            evidence,
            source: 'heuristic_prompt'
        });
    }

    return null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a standardized flag object
 */
function createFlag({ flagType, severity, confidence, tooltipText, evidence, source }) {
    return {
        flagType,
        severity,
        confidence,
        tooltipText,
        evidence: evidence || [],
        source,
        timestamp: Date.now()
    };
}

/**
 * Calculate combined score from all flags
 */
function calculateCombinedScore(flags) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const flag of flags) {
        const weight = config.weights[flag.flagType] || 0.1;
        totalWeight += weight;
        weightedSum += flag.confidence * weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Get severity level from combined score
 */
function getSeverityLevel(score) {
    if (score >= config.severity.high) return 'high';
    if (score >= config.severity.moderate) return 'moderate';
    if (score >= config.severity.low) return 'low';
    return 'none';
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        const match = url.match(/https?:\/\/([^\/]+)/);
        return match ? match[1].toLowerCase() : '';
    } catch {
        return '';
    }
}
