# Module: Toggle & State Control

## Purpose
Allows users to enable/disable the extension on the current page, and mark false positives.

## Responsibilities
- Add floating toggle widget or toolbar integration
- Track current page/session state
- Allow one-click feedback on overlays
- Pass toggle events to other modules

## Must Not
- Control heuristic execution logic
- Persist global state across pages (session-only toggle OK)
