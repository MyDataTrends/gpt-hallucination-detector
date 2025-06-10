import { logError, logInfo } from '../utils/logging';

const ENDPOINT = 'https://example.com/telemetry';

export async function sendTelemetry(data) {
    try {
        await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        logInfo('Telemetry sent');
    } catch (err) {
        logError('Telemetry failed', err);
    }
}
