/**
 * Overlay UI
 * Displays hallucination detection flags with severity indicators
 * Supports expandable details and multiple severity levels
 */

import { createElement } from '../utils/dom-utils';
import { logInfo } from '../utils/logging';

// CSS class names
const CLASSES = {
    flag: 'gpt-hallucination-flag',
    flagIcon: 'gpt-hallucination-icon',
    flagPanel: 'gpt-hallucination-panel',
    flagItem: 'gpt-hallucination-item',
    expanded: 'expanded',
    severityHigh: 'severity-high',
    severityModerate: 'severity-moderate',
    severityLow: 'severity-low',
};

// Severity icons and colors
const SEVERITY_CONFIG = {
    high: { icon: '🔴', label: 'High Risk' },
    moderate: { icon: '🟡', label: 'Moderate Risk' },
    low: { icon: '🟢', label: 'Low Risk' },
    none: { icon: '⚪', label: 'Minimal Risk' }
};

/**
 * Display flags on a response element
 * @param {Element} responseNode - The response DOM element
 * @param {object[]} flags - Array of flag objects from heuristics engine
 */
/**
 * Display flags on a response element
 * @param {Element} responseNode - The response DOM element
 * @param {object[]} flags - Array of flag objects from heuristics engine
 */
export function displayFlags(responseNode, flags) {
    if (!responseNode || !flags || flags.length === 0) return;

    // Check existing container state
    const existingContainer = responseNode.querySelector(`.${CLASSES.flag}`);
    const isExpanded = existingContainer && existingContainer.classList.contains(CLASSES.expanded);

    // specific check: if user has the panel open, DO NOT update
    if (isExpanded) {
        logDebug('UI update blocked: Panel is currently expanded by user');
        return;
    }

    // Check if flags are identical to what's already there
    const newSignature = generateFlagSignature(flags);
    const currentSignature = responseNode.dataset.flagSignature;

    if (currentSignature === newSignature) {
        logDebug('UI update skipped: Signatures match', { signature: newSignature });
        return; // Nothing changed, skip DOM update
    }

    logInfo('Updating UI flags', {
        previousSignature: currentSignature,
        newSignature: newSignature,
        reason: currentSignature ? 'Signature mismatch' : 'New flags'
    });

    // Remove any existing flags on this element
    removeFlags(responseNode);

    // Save new signature
    responseNode.dataset.flagSignature = newSignature;

    // Determine overall severity
    const overallSeverity = flags[0]?.overallSeverity ||
        getHighestSeverity(flags.map(f => f.severity));

    // Create the flag container
    const flagContainer = buildFlagContainer(flags, overallSeverity);

    // Position and append
    ensurePositionable(responseNode);
    responseNode.appendChild(flagContainer);
}

/**
 * Generate a unique signature for the flags
 */
function generateFlagSignature(flags) {
    return flags.map(f => `${f.flagType}:${f.severity}`).sort().join('|');
}

/**
 * Remove existing flags from a response element
 * @param {Element} responseNode - The response DOM element
 */
export function removeFlags(responseNode) {
    if (!responseNode) return;
    delete responseNode.dataset.flagSignature;
    const existing = responseNode.querySelector(`.${CLASSES.flag}`);
    if (existing) existing.remove();
}

/**
 * Build the flag container with icon and expandable panel
 */
function buildFlagContainer(flags, severity) {
    const severityClass = `severity-${severity}`;
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.moderate;

    // Main container
    const container = createElement('div', {
        class: `${CLASSES.flag} ${severityClass}`,
        'data-severity': severity,
        'data-flag-count': flags.length
    });

    // Icon button (clickable to expand)
    const iconBtn = createElement('button', {
        class: CLASSES.flagIcon,
        title: `${config.label}: ${flags.length} issue(s) detected. Click for details.`,
        'aria-label': `${flags.length} potential hallucination indicators detected`
    }, [document.createTextNode(config.icon)]);

    // Badge with count
    if (flags.length > 1) {
        const badge = createElement('span', {
            class: 'flag-badge'
        }, [document.createTextNode(String(flags.length))]);
        iconBtn.appendChild(badge);
    }

    // Expandable details panel
    const panel = buildDetailsPanel(flags, severity);
    panel.style.display = 'none';

    // Toggle panel on click
    let isExpanded = false;
    iconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isExpanded = !isExpanded;
        panel.style.display = isExpanded ? 'block' : 'none';
        container.classList.toggle(CLASSES.expanded, isExpanded);
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (isExpanded && !container.contains(e.target)) {
            isExpanded = false;
            panel.style.display = 'none';
            container.classList.remove(CLASSES.expanded);
        }
    });

    container.appendChild(iconBtn);
    container.appendChild(panel);

    return container;
}

/**
 * Build the expandable details panel
 */
function buildDetailsPanel(flags, overallSeverity) {
    const panel = createElement('div', {
        class: CLASSES.flagPanel
    });

    // Header
    const config = SEVERITY_CONFIG[overallSeverity] || SEVERITY_CONFIG.moderate;
    const header = createElement('div', {
        class: 'panel-header'
    }, [document.createTextNode(`${config.icon} ${config.label}`)]);
    panel.appendChild(header);

    // Flag items
    const list = createElement('ul', { class: 'flag-list' });

    for (const flag of flags) {
        const item = buildFlagItem(flag);
        list.appendChild(item);
    }
    panel.appendChild(list);

    // Footer with advice
    const footer = createElement('div', {
        class: 'panel-footer'
    }, [document.createTextNode('Consider verifying important claims from this response.')]);
    panel.appendChild(footer);

    return panel;
}

/**
 * Build a single flag item for the details panel
 */
function buildFlagItem(flag) {
    const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.low;

    const item = createElement('li', {
        class: `${CLASSES.flagItem} severity-${flag.severity}`
    });

    // Flag type and severity
    const header = createElement('div', {
        class: 'item-header'
    }, [document.createTextNode(`${severityConfig.icon} ${formatFlagType(flag.flagType)}`)]);
    item.appendChild(header);

    // Tooltip text (main explanation)
    const description = createElement('p', {
        class: 'item-description'
    }, [document.createTextNode(flag.tooltipText)]);
    item.appendChild(description);

    // Evidence (if available)
    if (flag.evidence && flag.evidence.length > 0) {
        const evidenceList = createElement('ul', { class: 'item-evidence' });
        for (const ev of flag.evidence.slice(0, 3)) {
            const evItem = createElement('li', {}, [
                document.createTextNode(truncate(String(ev), 60))
            ]);
            evidenceList.appendChild(evItem);
        }
        item.appendChild(evidenceList);
    }

    // Confidence indicator
    if (flag.confidence) {
        const confidence = createElement('div', {
            class: 'item-confidence'
        }, [document.createTextNode(`Confidence: ${Math.round(flag.confidence * 100)}%`)]);
        item.appendChild(confidence);
    }

    return item;
}

/**
 * Format flag type for display
 */
function formatFlagType(flagType) {
    const labels = {
        'response_time': 'Response Time',
        'overconfidence': 'Overconfidence',
        'excessive_hedging': 'Excessive Hedging',
        'rote_language': 'Rote Language',
        'bad_citation': 'Suspicious Citation',
        'specificity_without_source': 'Unsourced Details',
        'self_contradiction': 'Self-Contradiction',
        'prompt_ambiguity': 'Ambiguous Prompt'
    };
    return labels[flagType] || flagType.replace(/_/g, ' ');
}

/**
 * Get the highest severity from an array
 */
function getHighestSeverity(severities) {
    const order = ['high', 'moderate', 'low', 'none'];
    for (const level of order) {
        if (severities.includes(level)) return level;
    }
    return 'none';
}

/**
 * Ensure element has position for absolute positioning of flags
 */
function ensurePositionable(element) {
    const position = window.getComputedStyle(element).position;
    if (position === 'static') {
        element.style.position = 'relative';
    }
}

/**
 * Truncate string with ellipsis
 */
function truncate(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
}
