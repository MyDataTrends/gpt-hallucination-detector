---
applyTo: "src/content/dom-listener.js"
---

This module listens for new GPT responses being generated on the ChatGPT web interface. Its primary responsibility is to detect when a new assistant message begins rendering and when it has likely finished rendering.

Design this module with the following constraints:

## Responsibilities
- Observe the DOM using a `MutationObserver` or similar approach.
- Detect when a new response block begins rendering (e.g., token stream starts).
- Track when rendering has completed using a debounce or inactivity timer.
- Notify downstream consumers (e.g., `gpt-extractor.js`) that a complete response is available.

## Design Requirements
- Do **not** parse or analyze content. Only detect structure/state changes.
- The observer should be narrowly scoped to GPT-generated message containers.
- Use descriptive function and variable names. Include inline comments explaining logic.
- Ensure performance: avoid polling; use efficient observers.
- Support reattachment if ChatGPT rerenders or changes state (e.g., new session).
- Use modular design: export listener initialization function and callbacks separately.
- Avoid global variables or deeply nested logic.

## Outputs
- Dispatch a custom event or invoke a callback when a response block completes rendering.
- Include timestamps for response start and end.
- Ensure downstream consumers can cleanly consume this signal.

## Do Not
- Do not run any heuristics.
- Do not alter the DOM.
- Do not send telemetry or network requests.
- Do not include any extension-specific logic (e.g., UI overlays, scoring).
