import { createElement } from '../utils/dom-utils';
import { logInfo } from '../utils/logging';

export function showStatusBanner(text) {
    const banner = createElement('div', { class: 'gpt-status-banner' }, [document.createTextNode(text)]);
    banner.style.position = 'fixed';
    banner.style.bottom = '50px';
    banner.style.right = '10px';
    banner.style.padding = '4px 6px';
    banner.style.background = '#000';
    banner.style.color = '#fff';
    banner.style.fontSize = '12px';
    banner.style.zIndex = '9999';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
}

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
    showStatusBanner('Hallucination Monitor loaded');
}

export function extensionEnabled() {
    return enabled;
}
