# Module: Heuristics Engine

## Purpose
Applies deterministic, rule-based heuristics to assess hallucination risk in GPT responses.

## Input
- `promptText`
- `responseText`
- (Optional) response timing metadata

## Responsibilities
- Run 4 MVP heuristics
- Output: array of flag objects `{ flagType, confidence, tooltipText, source }`

## Must Not
- Alter or display UI
- Store data persistently
- Score or rank heuristics
