# GPT Hallucination Detector

This Chrome/Chromium extension flags potential hallucinations in ChatGPT responses using simple heuristics.

## Loading the Extension

1. Open Chromium-based browser (Chrome, Edge, etc.).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top right.
4. Click **Load unpacked** and select this repository's folder.

The extension will run on `https://chat.openai.com` once loaded.

## Observing Heuristic Flags

When ChatGPT produces a response that matches one of the built-in heuristics (slow response, rote phrasing, suspicious citation, or ambiguous prompt), a small `⚠️` icon will appear in the top-right corner of the response box. Hover to see a tooltip describing the reason.

## Disabling the Extension

A floating "Hallucination Monitor" button appears in the bottom-right corner of the page. Click it to toggle the extension on or off. The button becomes semi-transparent when disabled.

## Manual Testing

This repository contains no automated tests. Evaluate behavior manually in the browser. Note that heuristic results are approximate and may produce false positives or miss some hallucinations.
