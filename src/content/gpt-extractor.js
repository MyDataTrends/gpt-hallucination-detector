import { logInfo } from '../utils/logging';

/**
 * Extracts the latest user prompt and GPT response from the DOM.
 * Returns { promptText, responseText, promptNode, responseNode }
 */
export function extractLatestExchange() {
    // ChatGPT renders user prompts within elements using the `request-text` class
    // while assistant responses use `result-streaming`. Older layouts fall back
    // to `.message.user` and `.message.assistant`.
    const userMessages = document.querySelectorAll('.request-text, .message.user');
    const assistantMessages = document.querySelectorAll('.result-streaming, .message.assistant');

    if (!userMessages.length || !assistantMessages.length) {
        logInfo('Could not locate latest exchange');
        return null;
    }

    const latestUser = userMessages[userMessages.length - 1];
    const latestAssistant = assistantMessages[assistantMessages.length - 1];

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
