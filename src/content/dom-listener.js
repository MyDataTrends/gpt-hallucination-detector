/**
 * DOM Listener
 * Observes ChatGPT's DOM for response rendering events
 * Uses updated selectors matching current ChatGPT UI (2024+)
 */

import { debounce } from '../utils/timing-util';
import { logInfo, logError } from '../utils/logging';

// ChatGPT DOM selectors (updated for current UI)
const SELECTORS = {
    // Main conversation container
    conversationContainer: 'main',
    // Individual message elements - ChatGPT uses data attributes
    assistantMessage: '[data-message-author-role="assistant"]',
    userMessage: '[data-message-author-role="user"]',
    // Alternative selectors for older UI or edge cases
    messageContainer: '.markdown, .prose, .result-streaming',
    // Streaming indicator classes
    streamingIndicators: ['.result-streaming', '[data-is-streaming="true"]'],
};

// Configuration
const CONFIG = {
    debounceDelay: 800,     // Wait for streaming to stabilize
    maxRetryAttempts: 10,   // Retries for attaching observer
    retryDelayMs: 1000,     // Delay between retries
};

/**
 * Initialize DOM listener to detect GPT response completion
 * @param {Function} callback - Called with metadata when response completes
 * @returns {Function} - Cleanup function to disconnect observer
 */
export function initializeDomListener(callback) {
    // State tracking
    let renderingStartTime = null;
    let lastMutationTime = null;
    let currentResponseNode = null;
    let observer = null;
    let isStreaming = false;

    /**
     * Check if response is still streaming
     */
    function checkIsStreaming() {
        return SELECTORS.streamingIndicators.some(selector =>
            document.querySelector(selector) !== null
        );
    }

    /**
     * Handle rendering completion
     */
    const handleRenderingComplete = debounce(() => {
        // Double-check streaming has stopped
        if (checkIsStreaming()) {
            logInfo('Still streaming, waiting...');
            handleRenderingComplete(); // Re-debounce
            return;
        }

        const endTime = Date.now();

        if (renderingStartTime && currentResponseNode) {
            logInfo('Response rendering complete', {
                duration: endTime - renderingStartTime,
                node: currentResponseNode.className
            });

            callback({
                startTime: renderingStartTime,
                endTime: endTime,
                responseNode: currentResponseNode
            });
        }

        // Reset state
        renderingStartTime = null;
        currentResponseNode = null;
        isStreaming = false;
    }, CONFIG.debounceDelay);

    /**
     * Find the current/latest assistant message being rendered
     */
    function findLatestAssistantMessage() {
        const messages = document.querySelectorAll(SELECTORS.assistantMessage);
        if (messages.length > 0) {
            return messages[messages.length - 1];
        }

        // Fallback to message containers
        const containers = document.querySelectorAll(SELECTORS.messageContainer);
        return containers.length > 0 ? containers[containers.length - 1] : null;
    }

    /**
     * Handle DOM mutations
     */
    function handleMutations(mutationsList) {
        const now = Date.now();

        for (const mutation of mutationsList) {
            // Check for new nodes or content changes
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const target = mutation.target;

                // Ignore our own UI mutations to prevent re-triggering
                if (target.closest?.('.gpt-hallucination-flag') ||
                    target.classList?.contains('gpt-hallucination-flag')) {
                    continue;
                }

                // Check if mutation is in an assistant message area
                const assistantMsg = target.closest?.(SELECTORS.assistantMessage) ||
                    (target.matches?.(SELECTORS.assistantMessage) ? target : null);

                if (assistantMsg || isContentMutation(mutation)) {
                    // Start timing if not already started
                    if (!renderingStartTime) {
                        renderingStartTime = now;
                        isStreaming = true;
                        logInfo('Response rendering started');
                    }

                    // Track the response node
                    currentResponseNode = assistantMsg || findLatestAssistantMessage();
                    lastMutationTime = now;

                    // Trigger (or re-trigger) completion detection
                    handleRenderingComplete();
                }
            }
        }
    }

    /**
     * Check if a mutation represents content being added
     */
    function isContentMutation(mutation) {
        // Check added nodes
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Ignore our own flags
                if (node.classList?.contains('gpt-hallucination-flag') ||
                    node.closest?.('.gpt-hallucination-flag')) {
                    continue;
                }

                // Check if it's a message-related element
                if (node.matches?.(SELECTORS.messageContainer) ||
                    node.querySelector?.(SELECTORS.assistantMessage)) {
                    return true;
                }
            }
            // Text node additions (streaming text)
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Attach observer to the DOM
     */
    function attachObserver(attempt = 0) {
        const targetNode = document.querySelector(SELECTORS.conversationContainer) ||
            document.body;

        if (!targetNode) {
            if (attempt < CONFIG.maxRetryAttempts) {
                logInfo(`Target not found, retrying (${attempt + 1}/${CONFIG.maxRetryAttempts})...`);
                setTimeout(() => attachObserver(attempt + 1), CONFIG.retryDelayMs);
            } else {
                logError('Failed to attach observer after max retries');
            }
            return;
        }

        observer = new MutationObserver(handleMutations);

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: false
        });

        logInfo('DOM observer attached', { target: targetNode.tagName });
    }

    // Initialize
    attachObserver();

    // Return cleanup function
    return () => {
        if (observer) {
            observer.disconnect();
            logInfo('DOM observer disconnected');
        }
    };
}

/**
 * Check if ChatGPT page is loaded and ready
 */
export function isPageReady() {
    return document.querySelector(SELECTORS.conversationContainer) !== null ||
        document.querySelector(SELECTORS.assistantMessage) !== null;
}