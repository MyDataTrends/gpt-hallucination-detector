import { createElement } from '../utils/dom-utils';
import { logInfo } from '../utils/logging';

const FLAG_CLASS = 'gpt-hallucination-flag';

function buildFlagElement(flags) {
    const tooltipText = flags.map(f => f.tooltipText).join('\n');
    return createElement('div', {
        class: FLAG_CLASS,
        title: tooltipText
    }, [document.createTextNode('⚠️')]);
}

export function displayFlags(responseNode, flags) {
    if (!responseNode || !flags.length) return;
    const existing = responseNode.querySelector(`.${FLAG_CLASS}`);
    if (existing) existing.remove();

    const flagEl = buildFlagElement(flags);
    responseNode.style.position = 'relative';
    flagEl.style.position = 'absolute';
    flagEl.style.top = '0';
    flagEl.style.right = '0';
    responseNode.appendChild(flagEl);
    logInfo('Flags displayed', { count: flags.length });
}
