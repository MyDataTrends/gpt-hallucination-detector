/**
 * Logging Utilities
 * Provides structured logging with debug levels and console grouping
 */

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Current log level (can be changed for debugging)
let currentLogLevel = LOG_LEVELS.INFO;

// Prefix for all log messages
const PREFIX = '[GPT-Hallucination-Detector]';

/**
 * Set the current log level
 * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} level
 */
export function setLogLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
        currentLogLevel = LOG_LEVELS[level];
    }
}

/**
 * Log debug message (only shown if log level is DEBUG)
 */
export function logDebug(message, data = {}) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.debug(`${PREFIX} [DEBUG] ${message}`, data);
    }
}

/**
 * Log info message
 */
export function logInfo(message, data = {}) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
        console.log(`${PREFIX} ${message}`, Object.keys(data).length ? data : '');
    }
}

/**
 * Log warning message
 */
export function logWarn(message, data = {}) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
        console.warn(`${PREFIX} [WARN] ${message}`, data);
    }
}

/**
 * Log error message
 */
export function logError(message, error) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
        console.error(`${PREFIX} [ERROR] ${message}`, error);
    }
}

/**
 * Create a grouped log section
 * @param {string} groupName - Name of the group
 * @param {Function} fn - Function to execute within the group
 */
export function logGroup(groupName, fn) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.group(`${PREFIX} ${groupName}`);
        try {
            fn();
        } finally {
            console.groupEnd();
        }
    } else {
        fn();
    }
}

/**
 * Log a table of data (useful for debugging heuristics results)
 */
export function logTable(message, data) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.log(`${PREFIX} ${message}`);
        console.table(data);
    }
}

/**
 * Time a function execution
 * @param {string} label - Label for the timing
 * @param {Function} fn - Function to time
 * @returns {*} - Result of the function
 */
export function logTime(label, fn) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.time(`${PREFIX} ${label}`);
        const result = fn();
        console.timeEnd(`${PREFIX} ${label}`);
        return result;
    }
    return fn();
}

// Expose log level setting for debugging
if (typeof window !== 'undefined') {
    window.__hallucination_detector_debug = () => {
        setLogLevel('DEBUG');
        logInfo('Debug mode enabled');
    };
}
