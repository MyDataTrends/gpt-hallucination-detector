import { logInfo } from '../utils/logging';

/**
 * Extracts the latest user prompt and GPT response from the DOM.
 * Returns { promptText, responseText, responseNode }
 */
export function extractLatestExchange() {
    const userMessages = document.querySelectorAll('.request-:text, .message.user');
    const assistantMessages = document.querySelectorAll('.result-streaming, .message.assistant');

    const latestUser = userMessages[userMessages.length - 1];
    const latestAssistant = assistantMessages[assistantMessages.length - 1];

    if (!latestUser || !latestAssistant) {
        logInfo('Could not locate latest exchange');
        return null;
    }

    const promptText = latestUser.innerText || '';
    const responseText = latestAssistant.innerText || '';

    return { promptText, responseText, responseNode: latestAssistant };
}
