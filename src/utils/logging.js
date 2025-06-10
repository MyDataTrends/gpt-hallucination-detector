export function logInfo(message, data = {}) {
    console.log(`[GPT-Extension] ${message}`, data);
}

export function logError(message, error) {
    console.error(`[GPT-Extension] ${message}`, error);
}
