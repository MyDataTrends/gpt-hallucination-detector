# Module: GPT Response Extractor

## Purpose
Extracts clean text for the latest user prompt and GPT response from the ChatGPT UI.

## Responsibilities
- Identify latest user message
- Capture associated GPT reply text (post-render)
- Normalize line breaks, remove markdown tags, etc.
- Pass prompt/response pair to heuristics engine

## Must Not
- Analyze text
- Inject or modify DOM
