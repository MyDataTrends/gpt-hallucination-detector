import { createElement } from '../utils/dom-utils';
import { logInfo } from '../utils/logging';

let enabled = true;
let toggleBtn;

export function initToggle() {
    toggleBtn = createElement('button', { class: 'gpt-toggle-btn' }, [document.createTextNode('Hallucination Monitor')]);
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.bottom = '10px';
    toggleBtn.style.right = '10px';
    toggleBtn.style.zIndex = '9999';
    toggleBtn.style.padding = '6px';
    toggleBtn.style.background = '#fff';
    toggleBtn.style.border = '1px solid #ccc';
    toggleBtn.addEventListener('click', () => {
        enabled = !enabled;
        toggleBtn.style.opacity = enabled ? '1' : '0.5';
        logInfo(`Extension ${enabled ? 'enabled' : 'disabled'}`);
    });
    document.body.appendChild(toggleBtn);
}

export function extensionEnabled() {
    return enabled;
}
