import { logInfo } from '../utils/logging';
import config from '../config/heuristics-config';

function checkResponseTime(metadata) {
    const duration = metadata.endTime - metadata.startTime;
    if (duration > config.responseTimeThreshold) {
        return {
            flagType: 'response_time',
            confidence: 'moderate',
            tooltipText: `Long response time (${duration}ms)`,
            source: 'heuristic_response_time'
        };
    }
    return null;
}

function checkRoteLanguage(text) {
    const rotePatterns = /(Certainly!|In conclusion|As an AI language model)/i;
    if (rotePatterns.test(text)) {
        return {
            flagType: 'rote_format',
            confidence: 'moderate',
            tooltipText: 'Response uses templated phrasing',
            source: 'heuristic_rote'
        };
    }
    return null;
}

function checkBadCitation(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    const badUrls = urls.filter(u => /example\.com/.test(u));
    if (badUrls.length) {
        return {
            flagType: 'bad_citation',
            confidence: 'high',
            tooltipText: 'Unverified or malformed citation',
            source: 'heuristic_citation'
        };
    }
    return null;
}

function checkPromptAmbiguity(prompt) {
    const ambiguous = /(it|this|that)/i.test(prompt) && /\b(first|then)\b/i.test(prompt);
    if (ambiguous) {
        return {
            flagType: 'prompt_ambiguity',
            confidence: 'moderate',
            tooltipText: 'Prompt may be ambiguous',
            source: 'heuristic_prompt'
        };
    }
    return null;
}

export function runHeuristics({ promptText, responseText, metadata }) {
    const flags = [];
    const checkers = [
        () => checkResponseTime(metadata),
        () => checkRoteLanguage(responseText),
        () => checkBadCitation(responseText),
        () => checkPromptAmbiguity(promptText)
    ];

    checkers.forEach(check => {
        const result = check();
        if (result) flags.push(result);
    });

    logInfo('Heuristics executed', { flags });
    return flags;
}
