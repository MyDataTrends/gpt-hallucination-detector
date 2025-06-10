# Module: DOM Listener

## Purpose
Monitors the ChatGPT page for signs that a new assistant response is being rendered.

## Triggers
- DOM changes in response container area
- Mutation events in token-rendering blocks

## Responsibilities
- Detect when a new GPT response begins
- Start a response timer for Heuristic 1
- Notify `gpt-extractor` when response completes (or stalls)

## Must Not
- Parse or extract message content
- Run heuristics or apply flags
