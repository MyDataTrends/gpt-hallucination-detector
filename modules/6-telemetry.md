# Module: Telemetry Logger

## Purpose
Collects anonymous heuristic results and user feedback for later review and improvement.

## Responsibilities
- Post JSON payloads containing:
  - Flags triggered
  - False positive reports
  - (Optional) response metadata
- Fail gracefully on network issues
- Rotate logs or throttle if needed

## Must Not
- Send any PII
- Delay UI or block frontend rendering

## Configuration
The telemetry endpoint domain can be customized. Update the `ENDPOINT` constant
in `src/content/telemetry.js` to point at your own collection server.
