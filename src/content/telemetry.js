/**
 * Telemetry Module
 * Pure in-memory storage - no persistence, no external transmission
 * Data is purged when the tab/session ends
 */

import { logInfo, logDebug } from '../utils/logging';

// Configuration
const CONFIG = {
    maxWords: 500,           // Max words to keep in memory
    maxEvents: 50,           // Max events to keep in memory
};

// In-memory only storage - cleared on tab close
let eventBuffer = [];
let wordBuffer = '';

/**
 * Record telemetry event (in-memory only)
 * @param {object} data - Telemetry data
 */
export function sendTelemetry(data) {
    const event = {
        timestamp: Date.now(),
        ...data
    };

    // Add to buffer
    eventBuffer.push(event);

    // Keep only last N events
    while (eventBuffer.length > CONFIG.maxEvents) {
        eventBuffer.shift();
    }

    logDebug('Telemetry event recorded (in-memory)', { eventCount: eventBuffer.length });
}

/**
 * Store text sample (in-memory, limited to maxWords)
 * @param {string} text - Text to add to buffer
 */
export function addTextSample(text) {
    if (!text) return;

    // Add to buffer
    wordBuffer += ' ' + text;

    // Trim to max words
    const words = wordBuffer.trim().split(/\s+/);
    if (words.length > CONFIG.maxWords) {
        wordBuffer = words.slice(-CONFIG.maxWords).join(' ');
    }
}

/**
 * Get current text buffer
 * @returns {string}
 */
export function getTextBuffer() {
    return wordBuffer;
}

/**
 * Get all stored events (in-memory only)
 * @returns {object[]}
 */
export function getStoredEvents() {
    return [...eventBuffer];
}

/**
 * Clear all telemetry data (called on session end)
 */
export function clearTelemetry() {
    eventBuffer = [];
    wordBuffer = '';
    logInfo('Telemetry cleared');
}

/**
 * Get telemetry summary statistics
 * @returns {object}
 */
export function getTelemetrySummary() {
    if (eventBuffer.length === 0) {
        return { total: 0 };
    }

    // Count flag types
    const flagCounts = {};
    let totalFlags = 0;

    for (const event of eventBuffer) {
        if (event.flags) {
            for (const flag of event.flags) {
                const type = flag.flagType || 'unknown';
                flagCounts[type] = (flagCounts[type] || 0) + 1;
                totalFlags++;
            }
        }
    }

    return {
        total: eventBuffer.length,
        totalFlags,
        flagCounts,
        wordCount: wordBuffer.split(/\s+/).filter(w => w).length
    };
}

// Clear buffer when page unloads (session end)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        clearTelemetry();
    });

    // Expose debug functions for console access
    window.__hallucination_telemetry = {
        getEvents: getStoredEvents,
        getSummary: getTelemetrySummary,
        clear: clearTelemetry
    };
}
