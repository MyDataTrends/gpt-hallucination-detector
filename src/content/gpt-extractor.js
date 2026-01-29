/**
 * GPT Extractor
 * Extracts prompt/response pairs from ChatGPT's DOM
 * Handles multi-turn context and structured content extraction
 */

import { logInfo, logError } from '../utils/logging';

// ChatGPT DOM selectors
const SELECTORS = {
    userMessage: '[data-message-author-role="user"]',
    assistantMessage: '[data-message-author-role="assistant"]',
    // Content containers within messages
    messageContent: '.markdown, .prose, .whitespace-pre-wrap',
    // Alternative selectors for edge cases
    legacyUser: '.message.user, .request-text',
    legacyAssistant: '.message.assistant, .response-text',
};

/**
 * Extract the latest prompt/response exchange from the page
 * @returns {object|null} - { promptText, responseText, promptNode, responseNode, context }
 */
export function extractLatestExchange() {
    try {
        // Get all message elements
        const userMessages = document.querySelectorAll(
            `${SELECTORS.userMessage}, ${SELECTORS.legacyUser}`
        );
        const assistantMessages = document.querySelectorAll(
            `${SELECTORS.assistantMessage}, ${SELECTORS.legacyAssistant}`
        );

        if (!userMessages.length || !assistantMessages.length) {
            logInfo('Could not locate message elements');
            return null;
        }

        // Get the latest assistant response
        const latestAssistant = assistantMessages[assistantMessages.length - 1];

        // Find the corresponding user prompt
        const latestUser = findCorrespondingPrompt(latestAssistant, userMessages);

        if (!latestUser || !latestAssistant) {
            logInfo('Could not pair prompt with response');
            return null;
        }

        // Extract text content
        const promptText = extractTextContent(latestUser);
        const responseText = extractTextContent(latestAssistant);

        // Extract previous exchanges for context (last 2 turns)
        const context = extractConversationContext(userMessages, assistantMessages, 2);

        logInfo('Exchange extracted', {
            promptLength: promptText.length,
            responseLength: responseText.length,
            contextTurns: context.length
        });

        return {
            promptText,
            responseText,
            promptNode: latestUser,
            responseNode: latestAssistant,
            context
        };

    } catch (err) {
        logError('Failed to extract exchange', err);
        return null;
    }
}

/**
 * Find the user prompt that corresponds to an assistant response
 * @param {Element} assistantNode - The assistant message element
 * @param {NodeList} userMessages - All user message elements
 * @returns {Element|null}
 */
function findCorrespondingPrompt(assistantNode, userMessages) {
    // Method 1: Look for sibling/previous element relationship
    let current = assistantNode.previousElementSibling;
    while (current) {
        if (current.matches?.(SELECTORS.userMessage) ||
            current.matches?.(SELECTORS.legacyUser)) {
            return current;
        }
        // Also check if it contains a user message
        const nested = current.querySelector?.(SELECTORS.userMessage);
        if (nested) return nested;

        current = current.previousElementSibling;
    }

    // Method 2: Find parent conversation container and look there
    const container = assistantNode.closest('[data-testid*="conversation"]') ||
        assistantNode.closest('main');
    if (container) {
        const allMessages = container.querySelectorAll(
            `${SELECTORS.userMessage}, ${SELECTORS.assistantMessage}`
        );
        const msgArray = Array.from(allMessages);
        const assistantIndex = msgArray.indexOf(assistantNode);

        // Find the user message just before this assistant message
        for (let i = assistantIndex - 1; i >= 0; i--) {
            if (msgArray[i].matches(SELECTORS.userMessage)) {
                return msgArray[i];
            }
        }
    }

    // Fallback: return the last user message
    return userMessages[userMessages.length - 1];
}

/**
 * Extract clean text content from a message element
 * Handles markdown, code blocks, and formatting
 * @param {Element} element - Message element
 * @returns {string}
 */
function extractTextContent(element) {
    if (!element) return '';

    // First, try to find the content container
    const contentEl = element.querySelector(SELECTORS.messageContent) || element;

    // Clone to avoid modifying the original
    const clone = contentEl.cloneNode(true);

    // Process code blocks - preserve them but mark clearly
    const codeBlocks = clone.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
        // Keep code blocks but add markers
        if (block.tagName === 'PRE') {
            block.textContent = `[CODE]\n${block.textContent}\n[/CODE]`;
        }
    });

    // Get the text content
    let text = clone.innerText || clone.textContent || '';

    // Clean up whitespace
    text = text
        .replace(/\n{3,}/g, '\n\n')  // Reduce excessive newlines
        .replace(/[ \t]+/g, ' ')      // Normalize horizontal whitespace
        .trim();

    return text;
}

/**
 * Extract previous conversation turns for context
 * @param {NodeList} userMessages - All user messages
 * @param {NodeList} assistantMessages - All assistant messages
 * @param {number} maxTurns - Maximum number of previous turns
 * @returns {object[]} - Array of { prompt, response } objects
 */
function extractConversationContext(userMessages, assistantMessages, maxTurns) {
    const context = [];
    const userArray = Array.from(userMessages);
    const assistantArray = Array.from(assistantMessages);

    // Skip the latest exchange (we're extracting that separately)
    const startFrom = Math.max(0, assistantArray.length - 1 - maxTurns);
    const endAt = assistantArray.length - 1;

    for (let i = startFrom; i < endAt; i++) {
        const assistantMsg = assistantArray[i];
        const userMsg = findCorrespondingPrompt(assistantMsg, userMessages);

        if (userMsg && assistantMsg) {
            context.push({
                prompt: extractTextContent(userMsg).slice(0, 500), // Limit length
                response: extractTextContent(assistantMsg).slice(0, 500)
            });
        }
    }

    return context;
}

/**
 * Check if a response is still being generated
 * @param {Element} responseNode - The response element
 * @returns {boolean}
 */
export function isResponseStreaming(responseNode) {
    if (!responseNode) return false;

    // Check for streaming indicators
    const streamingIndicators = [
        '.result-streaming',
        '[data-is-streaming="true"]',
        '.animate-pulse'
    ];

    for (const selector of streamingIndicators) {
        if (responseNode.matches(selector) || responseNode.querySelector(selector)) {
            return true;
        }
    }

    return false;
}

/**
 * Get all exchanges on the page
 * @returns {object[]} - Array of exchanges
 */
export function getAllExchanges() {
    const exchanges = [];
    const userMessages = document.querySelectorAll(SELECTORS.userMessage);
    const assistantMessages = document.querySelectorAll(SELECTORS.assistantMessage);

    // Pair up messages
    const minLength = Math.min(userMessages.length, assistantMessages.length);
    for (let i = 0; i < minLength; i++) {
        exchanges.push({
            promptText: extractTextContent(userMessages[i]),
            responseText: extractTextContent(assistantMessages[i]),
            promptNode: userMessages[i],
            responseNode: assistantMessages[i]
        });
    }

    return exchanges;
}
