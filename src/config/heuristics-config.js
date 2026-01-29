/**
 * Heuristics Configuration
 * Research-backed patterns and thresholds for hallucination detection
 */

export default {
    // =========================================================================
    // RESPONSE TIMING
    // Long generation times may indicate the model is "struggling" or generating
    // complex fabrications
    // =========================================================================
    responseTime: {
        slowThresholdMs: 15000,       // Moderate flag
        verySlowThresholdMs: 30000    // High confidence flag
    },

    // =========================================================================
    // OVERCONFIDENCE DETECTION
    // LLMs overestimate correctness by 20-60%. Absolute language without
    // hedging is a strong hallucination indicator.
    // =========================================================================
    overconfidencePatterns: [
        // Absolute certainty markers
        /\b(definitely|certainly|absolutely|undoubtedly|unquestionably)\b/gi,
        /\b(always|never|impossible|guaranteed|proven fact)\b/gi,
        /\b(100%|completely certain|no doubt|without question)\b/gi,
        /\b(it is (a |)fact that|the truth is|in reality)\b/gi,
        // Authoritative assertions
        /\b(everyone knows|it's well known|as we all know)\b/gi,
        /\b(studies show|research proves|science confirms)\b/gi,  // Without citation
    ],
    overconfidenceThreshold: 3,  // Number of matches to trigger flag

    // =========================================================================
    // HEDGING / UNCERTAINTY MARKERS
    // High density of hedging may indicate the model is unsure.
    // Some hedging is normal; excessive hedging is suspicious.
    // =========================================================================
    hedgingPatterns: [
        /\b(may|might|could|possibly|perhaps|probably)\b/gi,
        /\b(it seems|appears to|likely|unlikely|potentially)\b/gi,
        /\b(I think|I believe|in my opinion|I'm not sure)\b/gi,
        /\b(generally|typically|often|sometimes|usually)\b/gi,
        /\b(to some extent|more or less|kind of|sort of)\b/gi,
        /\b(as far as I know|to my knowledge|if I recall)\b/gi,
    ],
    hedgingDensityThreshold: 0.15,  // If > 15% of sentences contain hedging

    // =========================================================================
    // ROTE LANGUAGE / CHATGPT SIGNATURE PHRASES
    // Templated responses often accompany lower-quality or fabricated content
    // =========================================================================
    rotePhrases: [
        // Classic ChatGPT openers
        /^(Certainly!|Of course!|Absolutely!|Great question!)/i,
        /^(Sure!|Happy to help!|I'd be happy to)/i,
        // Self-referential disclaimers
        /\bAs an AI( language model)?/i,
        /\bAs a large language model/i,
        /\bI don't have (personal |)opinions/i,
        /\bI cannot provide (medical|legal|financial) advice/i,
        /\bI don't have access to real-time/i,
        /\bMy training data (only goes|cuts off)/i,
        // Filler conclusions
        /\bIn conclusion,?\s/i,
        /\bIn summary,?\s/i,
        /\bTo summarize,?\s/i,
        /\bI hope (this|that) helps/i,
        /\bLet me know if you (have|need|want)/i,
        /\bFeel free to ask/i,
        // Evasive patterns
        /\bIt's (important|worth) (to note|noting) that/i,
        /\bIt (depends|varies) (on|based on)/i,
        /\bThere are (many|several|various) factors/i,
    ],

    // =========================================================================
    // CITATION / URL VALIDATION
    // Fabricated citations are a major hallucination type
    // =========================================================================
    citation: {
        // Domains that are definitely fake/placeholder
        suspiciousDomains: [
            'example.com', 'example.org', 'example.net',
            'test.com', 'placeholder.com', 'fake.com',
            'yoursite.com', 'website.com', 'domain.com'
        ],
        // Patterns suggesting fabricated academic citations
        suspiciousCitationPatterns: [
            // Fake DOIs (too short, wrong format)
            /doi:\s*10\.\d{4}\/[a-z]{2,5}\d{2,4}/i,
            // Suspicious journal patterns
            /Journal of (Advanced|Modern|International|Global) [A-Z]/i,
            // Years that seem off (future or very round)
            /\(\s*(2025|2026|2027|2030|2000)\s*\)/,
        ],
        // URL patterns that suggest placeholders
        suspiciousUrlPatterns: [
            /https?:\/\/www\.[a-z]+\.com\/article\/\d+$/i,
            /https?:\/\/[a-z]+\.org\/paper\/[a-z]+$/i,
        ],
        enableLivenessCheck: false,  // HEAD request to verify URL exists
        checkTimeoutMs: 3000
    },

    // =========================================================================
    // SPECIFICITY WITHOUT SOURCE
    // Precise claims (dates, numbers, names) without citations signal fabrication
    // =========================================================================
    specificityPatterns: {
        // Exact dates
        dates: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
        // Specific times
        times: /\b\d{1,2}:\d{2}\s*(AM|PM|a\.m\.|p\.m\.)?\b/gi,
        // Precise numbers/statistics
        preciseNumbers: /\b\d+(\.\d+)?%\b/g,
        largeNumbers: /\b\d{1,3}(,\d{3})+\b/g,
        // Dollar amounts
        currency: /\$\d+(\.\d{2})?([\s,]*(million|billion|trillion))?/gi,
        // Proper nouns that could be fabricated (names with titles)
        namedEntities: /\b(Dr\.|Prof\.|Professor)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    },
    specificityThreshold: 3,  // Multiple precise claims without sources

    // =========================================================================
    // SELF-CONTRADICTION DETECTION
    // Internal contradictions strongly signal fabrication
    // =========================================================================
    contradictionMarkers: {
        // Negation pairs to look for
        negations: ['not', 'never', 'no', 'none', 'neither', 'nobody', 'nothing'],
        // Contrast indicators
        contrastWords: ['however', 'but', 'although', 'whereas', 'contrary', 'opposite'],
    },

    // =========================================================================
    // PROMPT AMBIGUITY ANALYSIS
    // Ambiguous prompts invite hallucination
    // =========================================================================
    promptAmbiguity: {
        // Vague pronouns without clear antecedents
        vaguePronouns: /\b(it|this|that|they|them|these|those)\b/gi,
        // Multi-step instructions
        multiStepMarkers: /\b(first|then|next|after that|finally|lastly)\b/gi,
        // Vague verbs
        vagueVerbs: /\b(do|make|get|fix|handle|deal with|figure out)\b/gi,
        // Threshold: needs multiple ambiguity markers
        threshold: 4
    },

    // =========================================================================
    // SCORING WEIGHTS
    // Relative importance of each heuristic
    // =========================================================================
    weights: {
        responseTime: 0.10,
        overconfidence: 0.20,
        excessiveHedging: 0.10,
        roteLanguage: 0.15,
        badCitation: 0.25,
        specificityWithoutSource: 0.20,
        selfContradiction: 0.25,
        promptAmbiguity: 0.10
    },

    // =========================================================================
    // SEVERITY THRESHOLDS
    // Combined score thresholds for severity levels
    // =========================================================================
    severity: {
        high: 0.7,      // Score >= 0.7 = high risk
        moderate: 0.4,  // Score >= 0.4 = moderate risk
        low: 0.2        // Score >= 0.2 = low risk
    }
};
