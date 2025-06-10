# GPT Hallucination Detector

This Chrome/Chromium extension flags potential hallucinations in ChatGPT responses using simple heuristics.

## Loading the Extension

1. Open Chromium-based browser (Chrome, Edge, etc.).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top right.
4. Click **Load unpacked** and select this repository's folder.

Before loading the extension for the first time, install dependencies and build
the bundled content script:

```bash
npm install
npm run build
```

The extension will run on both `https://chat.openai.com` and the redirected `https://chatgpt.com` domain once loaded.

When the page loads, a brief "Hallucination Monitor loaded" banner appears near the toggle button so you can confirm the extension is active.


## Build

Install dependencies and bundle the extension before loading it:

```bash
npm install
npm run build
```

The bundled files appear in the `dist/` directory. Use **Load unpacked** on that folder instead of the repository root. Loading the source folder after building is a common pitfall that prevents the compiled scripts from running.

## Observing Heuristic Flags

When ChatGPT produces a response that matches one of the built-in heuristics (slow response, rote phrasing, suspicious citation, or ambiguous prompt), a small `⚠️` icon will appear in the top-right corner of the response box. Hover to see a tooltip describing the reason.

## Disabling the Extension

A floating "Hallucination Monitor" button appears in the bottom-right corner of the page. Click it to toggle the extension on or off. The button becomes semi-transparent when disabled.

## Manual Testing

Evaluate behavior manually in the browser. Heuristic results are approximate and may produce false positives or miss some hallucinations. Use the toggle button to temporarily disable the extension if needed during manual experiments. You can also open the console and call `hallucinationMonitorTest()` to display a test banner confirming the script is active.

## Running Tests

Automated tests are provided using [Jest](https://jestjs.io/). Install dependencies and run the test suite with:

```bash
npm install
npm test
```


