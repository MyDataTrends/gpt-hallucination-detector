import { logInfo } from '../utils/logging';

/**
 * Extracts the latest user prompt and GPT response from the DOM.
 * Returns { promptText, responseText, promptNode, responseNode }
 */
export function extractLatestExchange() {
    // ChatGPT messages can be identified via `data-message-author-role` in the
    // current UI. Fall back to older class based selectors if needed.
    const userSelector = '[data-message-author-role="user"], .request-text, .message.user';
    const assistantSelector = '[data-message-author-role="assistant"], .result-streaming, .message.assistant';

    const userMessages = document.querySelectorAll(userSelector);
    const assistantMessages = document.querySelectorAll(assistantSelector);

    if (!userMessages.length || !assistantMessages.length) {
        logInfo('Could not locate latest exchange');
        return null;
    }

    const latestAssistant = assistantMessages[assistantMessages.length - 1];

    // Attempt to locate the corresponding user prompt immediately preceding the
    // assistant message. Fall back to the last user message if not found.
    let latestUser = latestAssistant.previousElementSibling;
    while (latestUser && !latestUser.matches(userSelector)) {
        latestUser = latestUser.previousElementSibling;
    }
    if (!latestUser) {
        latestUser = userMessages[userMessages.length - 1];
    }

    if (!latestUser || !latestAssistant) {
        logInfo('Could not locate latest exchange');
        return null;
    }

    const promptText = latestUser.innerText || '';
    const responseText = latestAssistant.innerText || '';
    return {
        promptText,
        responseText,
        promptNode: latestUser,
        responseNode: latestAssistant
    };
}
