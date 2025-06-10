import { initializeDomListener } from './dom-listener';
import { extractLatestExchange } from './gpt-extractor';
import { runHeuristics } from './heuristics-engine';
import { displayFlags } from './overlay-ui';
import { initToggle, extensionEnabled } from './toggles';
import { sendTelemetry } from './telemetry';

initToggle();

initializeDomListener(metadata => {
    if (!extensionEnabled()) return;

    const exchange = extractLatestExchange();
    if (!exchange) return;

    const flags = runHeuristics({
        promptText: exchange.promptText,
        responseText: exchange.responseText,
        metadata
    });

    displayFlags(exchange.responseNode, flags);

    if (flags.length) {
        sendTelemetry({ flags, prompt: exchange.promptText });
    }
});
