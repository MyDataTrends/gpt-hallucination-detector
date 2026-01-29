/**
 * Text Analysis Utilities
 * NLP-lite functions for analyzing response text
 */

/**
 * Split text into sentences
 * Handles common abbreviations and edge cases
 */
export function splitSentences(text) {
    if (!text || typeof text !== 'string') return [];

    // Protect common abbreviations from splitting
    const protectedText = text
        .replace(/\bDr\./g, 'Dr\u0000')
        .replace(/\bMr\./g, 'Mr\u0000')
        .replace(/\bMs\./g, 'Ms\u0000')
        .replace(/\bMrs\./g, 'Mrs\u0000')
        .replace(/\bProf\./g, 'Prof\u0000')
        .replace(/\be\.g\./g, 'e\u0000g\u0000')
        .replace(/\bi\.e\./g, 'i\u0000e\u0000')
        .replace(/\betc\./g, 'etc\u0000')
        .replace(/\bvs\./g, 'vs\u0000');

    // Split on sentence boundaries
    const sentences = protectedText
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map(s => s.replace(/\u0000/g, '.').trim())
        .filter(s => s.length > 0);

    return sentences;
}

/**
 * Count pattern matches in text
 * @param {string} text - Text to analyze
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {object} - { count, matches }
 */
export function countPatternMatches(text, patterns) {
    if (!text || !patterns) return { count: 0, matches: [] };

    const matches = [];
    let count = 0;

    for (const pattern of patterns) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        const patternMatches = text.match(pattern) || [];
        count += patternMatches.length;
        matches.push(...patternMatches);
    }

    return { count, matches };
}

/**
 * Calculate pattern density (matches per sentence)
 * @param {string} text - Text to analyze
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {number} - Density ratio (0-1)
 */
export function calculatePatternDensity(text, patterns) {
    const sentences = splitSentences(text);
    if (sentences.length === 0) return 0;

    let sentencesWithMatches = 0;

    for (const sentence of sentences) {
        const { count } = countPatternMatches(sentence, patterns);
        if (count > 0) sentencesWithMatches++;
    }

    return sentencesWithMatches / sentences.length;
}

/**
 * Extract all URLs from text
 * @param {string} text - Text to analyze
 * @returns {string[]} - Array of URLs
 */
export function extractUrls(text) {
    if (!text) return [];
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    return text.match(urlRegex) || [];
}

/**
 * Extract potential citations (academic-style references)
 * @param {string} text - Text to analyze
 * @returns {string[]} - Array of citation-like strings
 */
export function extractCitations(text) {
    if (!text) return [];

    const citations = [];

    // Parenthetical citations: (Author, Year), (Author et al., Year), (Author and Author, Year)
    const parenthetical = text.match(/\([A-Z][a-z]+(?:\s+et\s+al\.?|\s+(?:and|&)\s+[A-Z][a-z]+)?,?\s*\d{4}\)/g);
    if (parenthetical) citations.push(...parenthetical);

    // Inline citations: Author (Year) - author name outside parentheses
    const inline = text.match(/[A-Z][a-z]+\s+\(\d{4}\)/g);
    if (inline) citations.push(...inline);

    // Numbered references: [1], [2,3], etc.
    const numbered = text.match(/\[\d+(?:,\s*\d+)*\]/g);
    if (numbered) citations.push(...numbered);

    // DOI references
    const dois = text.match(/doi:\s*10\.\d{4,}\/[^\s]+/gi);
    if (dois) citations.push(...dois);

    return citations;
}

/**
 * Count specificity indicators (precise facts that may be fabricated)
 * @param {string} text - Text to analyze
 * @param {object} patterns - Specificity pattern config
 * @returns {object} - { count, details }
 */
export function countSpecificityIndicators(text, patterns) {
    if (!text || !patterns) return { count: 0, details: {} };

    const details = {};
    let count = 0;

    for (const [key, pattern] of Object.entries(patterns)) {
        if (pattern instanceof RegExp) {
            pattern.lastIndex = 0;
            const matches = text.match(pattern) || [];
            details[key] = matches;
            count += matches.length;
        }
    }

    return { count, details };
}

/**
 * Check if text has citations supporting its claims
 * @param {string} text - Text to analyze  
 * @returns {boolean} - True if citations are present
 */
export function hasCitations(text) {
    const citations = extractCitations(text);
    const urls = extractUrls(text);
    return citations.length > 0 || urls.length > 0;
}

/**
 * Detect potential contradictions within text
 * Looks for sentences that negate each other on the same topic
 * @param {string} text - Text to analyze
 * @param {object} markers - Contradiction marker config
 * @returns {object} - { found, pairs }
 */
export function detectContradictions(text, markers) {
    const sentences = splitSentences(text);
    if (sentences.length < 2) return { found: false, pairs: [] };

    const pairs = [];
    const { negations, contrastWords } = markers;

    // Create regex for negation words
    const negationRegex = new RegExp(`\\b(${negations.join('|')})\\b`, 'i');

    // Look for sentences that might contradict each other
    for (let i = 0; i < sentences.length; i++) {
        for (let j = i + 1; j < Math.min(i + 4, sentences.length); j++) {
            const s1 = sentences[i].toLowerCase();
            const s2 = sentences[j].toLowerCase();

            // Check if second sentence starts with contrast word
            const hasContrast = contrastWords.some(w =>
                s2.startsWith(w.toLowerCase()) ||
                s2.includes(`, ${w.toLowerCase()}`)
            );

            // Check if one has negation of similar content
            const s1HasNegation = negationRegex.test(s1);
            const s2HasNegation = negationRegex.test(s2);

            // Simple heuristic: contrast + negation change suggests contradiction
            if (hasContrast && (s1HasNegation !== s2HasNegation)) {
                // Extract key nouns/verbs to check similarity (simplified)
                const s1Words = new Set(s1.split(/\s+/).filter(w => w.length > 4));
                const s2Words = new Set(s2.split(/\s+/).filter(w => w.length > 4));

                // Count overlapping words
                let overlap = 0;
                for (const word of s1Words) {
                    if (s2Words.has(word)) overlap++;
                }

                // Significant overlap with contrast/negation suggests contradiction
                if (overlap >= 2) {
                    pairs.push({
                        sentence1: sentences[i],
                        sentence2: sentences[j],
                        overlap
                    });
                }
            }
        }
    }

    return { found: pairs.length > 0, pairs };
}

/**
 * Calculate word count
 * @param {string} text - Text to analyze
 * @returns {number} - Word count
 */
export function wordCount(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Normalize text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
export function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
