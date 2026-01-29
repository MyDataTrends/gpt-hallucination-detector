# 🕵️‍♂️ GPT Hallucination Detector

A research-backed browser extension that helps you trust (or doubt) ChatGPT responses by flagging potential hallucinations.

## 🚀 How to Install

This is a developer extension (unpacked). It works on **Chrome, Edge, Brave,** and other Chromium browsers.

### 1. Enable Developer Mode

1. Open your browser and go to **Extensions**:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. Toggle **Developer mode** (usually in the top-right or bottom-left corner).

### 2. Load the Extension

1. Click the **Load unpacked** button.
2. Select the `browser-extension` folder from this project.
3. You're done! 🎉

---

## 📖 User Guide

### How It Works

When you chat with ChatGPT, this extension quietly analyzes the response in real-time. If it detects patterns associated with AI fabrication (hallucination), it displays a flag in the top-right corner of the message.

### Risk Levels

| Icon | Level | Meaning |
|------|-------|---------|
| 🔴 | **High Risk** | Multiple strong indicators found. Verify this info carefully! |
| 🟡 | **Moderate Risk** | Some suspicious patterns detected. Worth checking. |
| 🟢 | **Low Risk** | Minor issues, but generally looks okay. |

### 🔍 Detection Indicators

Click the flag icon to see exactly what triggered the warning.

- **Overconfidence** 🎯  
  The AI is using absolute language ("definitely", "undoubtedly") without nuance. Research shows LLMs act overconfident when they are wrong.

- **Excessive Hedging** 🤷  
  The AI is using too many "might", "maybe", "could be" phrases. This often signals it doesn't actually know the answer.

- **Bad Citations** 🔗  
  Checks for URLs that look fake or references that follow common hallucination patterns.

- **Specificity Without Source** 📊  
  The AI provided very specific data (dates, numbers, exact names) but didn't cite a source. This is a common way AI "lies convincingly."

- **Rote Language** 🤖  
  Phrases like *"As an AI language model..."* or *"Certainly!"* can indicate scripted/lazy generation.

- **Self-Contradiction** ⚔️  
  The extension detected sentences that seem to argue against each other.

---

## 🛠️ Troubleshooting

**"The popup closes automatically!"**  
This was a bug we fixed. Please click the **Reload** (🔄) icon on the extension card in `chrome://extensions` and refresh ChatGPT.

**"I don't see any flags."**  
That's good! It means the response passed our checks. Try asking something impossible (e.g., *"What is the population of Mars in 1850?"*) to see it in action.

**"Can I turn it off?"**  
Yes. Click the **"Hallucination Monitor"** button (bottom-right of screen) to toggle the extension on/off.

---

## 👨‍💻 For Developers

**Build from source:**

```bash
npm install
npm run build
```

**Run tests:**

```bash
npm test
```
