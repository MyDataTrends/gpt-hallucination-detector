/**
 * Heuristics Engine Tests
 * Comprehensive test suite for hallucination detection heuristics
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the logging module
jest.unstable_mockModule('../src/utils/logging', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn()
}));

// Import after mocking
const { runHeuristics } = await import('../src/content/heuristics-engine.js');
const textAnalysis = await import('../src/utils/text-analysis.js');

describe('Heuristics Engine', () => {

    describe('runHeuristics', () => {
        it('returns empty array for empty input', () => {
            const result = runHeuristics({
                promptText: '',
                responseText: '',
                metadata: {}
            });
            expect(result).toEqual([]);
        });

        it('returns empty array for normal response', () => {
            const result = runHeuristics({
                promptText: 'What is 2 + 2?',
                responseText: 'The answer is 4. This is a basic arithmetic operation.',
                metadata: { startTime: 1000, endTime: 2000 }
            });
            expect(result).toEqual([]);
        });
    });

    describe('Overconfidence Detection', () => {
        it('flags highly confident language without hedging', () => {
            const result = runHeuristics({
                promptText: 'Tell me about X',
                responseText: `
                    This is definitely true. It is absolutely certain.
                    Everyone knows this is undoubtedly a fact.
                    It's 100% guaranteed to be correct.
                `,
                metadata: {}
            });

            const overconfidenceFlag = result.find(f => f.flagType === 'overconfidence');
            expect(overconfidenceFlag).toBeDefined();
            expect(overconfidenceFlag.severity).toMatch(/high|moderate/);
        });

        it('does not flag confident language balanced with hedging', () => {
            const result = runHeuristics({
                promptText: 'Tell me about X',
                responseText: `
                    This is likely true, though it may vary.
                    It seems to be the case in most situations.
                    Generally speaking, this is probably correct.
                `,
                metadata: {}
            });

            const overconfidenceFlag = result.find(f => f.flagType === 'overconfidence');
            expect(overconfidenceFlag).toBeUndefined();
        });
    });

    describe('Excessive Hedging Detection', () => {
        it('flags extremely hedged responses', () => {
            const result = runHeuristics({
                promptText: 'What is X?',
                responseText: `
                    It might possibly be one thing. Perhaps it could be another.
                    I think it may be this. It seems like it might be that.
                    Possibly this is true. Maybe that is also true.
                    It appears to potentially be correct. I believe it could work.
                `,
                metadata: {}
            });

            const hedgingFlag = result.find(f => f.flagType === 'excessive_hedging');
            expect(hedgingFlag).toBeDefined();
        });
    });

    describe('Rote Language Detection', () => {
        it('flags ChatGPT signature phrases', () => {
            const result = runHeuristics({
                promptText: 'Help me with X',
                responseText: `
                    Certainly! I'd be happy to help!
                    As an AI language model, I don't have personal opinions.
                    In conclusion, I hope this helps!
                    Let me know if you have any other questions.
                `,
                metadata: {}
            });

            const roteFlag = result.find(f => f.flagType === 'rote_language');
            expect(roteFlag).toBeDefined();
            expect(roteFlag.evidence.length).toBeGreaterThan(0);
        });

        it('does not flag natural conversational text', () => {
            const result = runHeuristics({
                promptText: 'What is the capital of France?',
                responseText: 'The capital of France is Paris. It is located in the north-central part of the country.',
                metadata: {}
            });

            const roteFlag = result.find(f => f.flagType === 'rote_language');
            expect(roteFlag).toBeUndefined();
        });
    });

    describe('Bad Citation Detection', () => {
        it('flags suspicious domains', () => {
            const result = runHeuristics({
                promptText: 'Give me sources',
                responseText: `
                    You can find more information at https://example.com/article/123
                    and also at https://test.com/research/paper.
                `,
                metadata: {}
            });

            const citationFlag = result.find(f => f.flagType === 'bad_citation');
            expect(citationFlag).toBeDefined();
            expect(citationFlag.severity).toMatch(/high|moderate/);
        });

        it('accepts legitimate domains', () => {
            const result = runHeuristics({
                promptText: 'Give me sources',
                responseText: `
                    According to Wikipedia (https://en.wikipedia.org/wiki/Paris),
                    Paris is the capital of France.
                `,
                metadata: {}
            });

            const citationFlag = result.find(f => f.flagType === 'bad_citation');
            expect(citationFlag).toBeUndefined();
        });
    });

    describe('Specificity Without Source Detection', () => {
        it('flags precise claims without citations', () => {
            const result = runHeuristics({
                promptText: 'Tell me about the event',
                responseText: `
                    On January 15, 2019 at 3:45 PM, Dr. John Smith announced
                    that the project achieved 94.7% accuracy with a budget of
                    $2.5 million. The team of 47 researchers worked for 3 years.
                `,
                metadata: {}
            });

            const specificityFlag = result.find(f => f.flagType === 'specificity_without_source');
            expect(specificityFlag).toBeDefined();
        });

        it('does not flag specific claims with citations', () => {
            const result = runHeuristics({
                promptText: 'Tell me about the event',
                responseText: `
                    According to Smith et al. (2019), on January 15, 2019, 
                    the project achieved 94.7% accuracy.
                `,
                metadata: {}
            });

            const specificityFlag = result.find(f => f.flagType === 'specificity_without_source');
            expect(specificityFlag).toBeUndefined();
        });
    });

    describe('Prompt Ambiguity Detection', () => {
        it('flags ambiguous multi-step prompts', () => {
            const result = runHeuristics({
                promptText: 'First do this thing with it, then handle that, and finally fix the other one.',
                responseText: 'Here is the response.',
                metadata: {}
            });

            const ambiguityFlag = result.find(f => f.flagType === 'prompt_ambiguity');
            expect(ambiguityFlag).toBeDefined();
        });

        it('does not flag clear direct prompts', () => {
            const result = runHeuristics({
                promptText: 'What is the capital of France?',
                responseText: 'Paris is the capital of France.',
                metadata: {}
            });

            const ambiguityFlag = result.find(f => f.flagType === 'prompt_ambiguity');
            expect(ambiguityFlag).toBeUndefined();
        });
    });

    describe('Response Time Detection', () => {
        it('flags very slow responses', () => {
            const result = runHeuristics({
                promptText: 'Generate something',
                responseText: 'Here is the response.',
                metadata: {
                    startTime: 0,
                    endTime: 35000  // 35 seconds
                }
            });

            const timeFlag = result.find(f => f.flagType === 'response_time');
            expect(timeFlag).toBeDefined();
            expect(timeFlag.severity).toBe('high');
        });

        it('does not flag fast responses', () => {
            const result = runHeuristics({
                promptText: 'Quick question',
                responseText: 'Quick answer.',
                metadata: {
                    startTime: 0,
                    endTime: 3000  // 3 seconds
                }
            });

            const timeFlag = result.find(f => f.flagType === 'response_time');
            expect(timeFlag).toBeUndefined();
        });
    });

    describe('Combined Scoring', () => {
        it('calculates overall severity correctly', () => {
            const result = runHeuristics({
                promptText: 'First do it, then fix that thing with this.',
                responseText: `
                    Certainly! As an AI language model, I'm happy to help!
                    This is definitely true and everyone knows it's absolutely correct.
                    According to https://example.com/fake/article, the answer is yes.
                    In conclusion, I hope this helps! Let me know if you need anything else.
                `,
                metadata: { startTime: 0, endTime: 40000 }
            });

            expect(result.length).toBeGreaterThan(2);

            // All flags should have combined score
            for (const flag of result) {
                expect(flag.combinedScore).toBeDefined();
                expect(flag.overallSeverity).toBeDefined();
            }
        });
    });
});

describe('Text Analysis Utilities', () => {

    describe('splitSentences', () => {
        it('splits basic sentences', () => {
            const text = 'First sentence. Second sentence. Third sentence.';
            const sentences = textAnalysis.splitSentences(text);
            expect(sentences.length).toBe(3);
        });

        it('handles abbreviations', () => {
            const text = 'Dr. Smith went to the store. He bought milk.';
            const sentences = textAnalysis.splitSentences(text);
            expect(sentences.length).toBe(2);
        });

        it('handles empty input', () => {
            expect(textAnalysis.splitSentences('')).toEqual([]);
            expect(textAnalysis.splitSentences(null)).toEqual([]);
        });
    });

    describe('extractUrls', () => {
        it('extracts URLs from text', () => {
            const text = 'Visit https://example.com or http://test.org for more.';
            const urls = textAnalysis.extractUrls(text);
            expect(urls.length).toBe(2);
            expect(urls).toContain('https://example.com');
            expect(urls).toContain('http://test.org');
        });
    });

    describe('extractCitations', () => {
        it('extracts parenthetical citations', () => {
            const text = 'According to research (Smith, 2020) and (Jones et al., 2019)...';
            const citations = textAnalysis.extractCitations(text);
            expect(citations.length).toBe(2);
        });

        it('extracts numbered citations', () => {
            const text = 'This is supported by evidence [1] and further studies [2,3].';
            const citations = textAnalysis.extractCitations(text);
            expect(citations.length).toBe(2);
        });
    });

    describe('countPatternMatches', () => {
        it('counts matches correctly', () => {
            const text = 'definitely true and absolutely certain, definitely yes';
            const patterns = [/definitely/gi, /absolutely/gi];
            const result = textAnalysis.countPatternMatches(text, patterns);
            expect(result.count).toBe(3);
        });
    });

    describe('hasCitations', () => {
        it('returns true for text with citations', () => {
            expect(textAnalysis.hasCitations('According to Smith (2020)...')).toBe(true);
            expect(textAnalysis.hasCitations('See https://example.com')).toBe(true);
        });

        it('returns false for text without citations', () => {
            expect(textAnalysis.hasCitations('Just plain text here.')).toBe(false);
        });
    });
});
