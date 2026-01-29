# Module: UI Overlay Layer

## Purpose
Visualizes hallucination risk flags by injecting overlays, highlights, and tooltips.

## Responsibilities
- Receive flags from heuristics engine
- Apply non-intrusive highlights in GPT response block
- Attach hover/click tooltips
- Indicate severity via visual styling

## Must Not
- Evaluate heuristics
- Log or report user behavior
