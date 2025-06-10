# Heuristics Module – Design Constraints (MVP Scope)

## ✅ Purpose

This module is responsible for identifying likely hallucination-prone GPT responses using deterministic, interpretable, rule-based logic. It operates entirely client-side, requires no LLM inference, and must be designed for modular expansion in later tiers.

---

## 🧱 Responsibilities

- Apply flagging heuristics based on prompt and/or response structure
- Operate with no external model dependencies
- Allow clean separation of heuristic definitions and execution logic
- Generate machine-readable and user-facing outputs (e.g., tooltip strings, flag levels)

---

## 🟢 In-Scope Heuristics (Included in MVP)

### 1. Response Time / Chained Thinking
- Detect prolonged or delayed token-by-token generation using DOM `MutationObserver`
- Use idle threshold to infer end of generation
- Calculate and store response duration in ms

### 2. Response Format / Rote Language
- Use regex or pattern matching to flag over-templated phrases (e.g., "Certainly!", "In conclusion...")
- Detect generic structuring: excessive headings, repeated phrasing, stacked lists
- Do not attempt deep semantic parsing

### 3. Citation Validity
- Extract all URLs from response text
- Flag malformed or suspicious domains
- (Optional) Perform HEAD or lightweight GET requests to check for dead links
- Mark links as verified/unverified

### 4. Prompt Ambiguity / Structural Vagueness
- Analyze most recent prompt for:
  - Multi-step sequencing (e.g., "first... then...")
  - Ambiguous references (e.g., "it", "this")
  - Vague verbs or unclear task framing
- Flag as "ambiguous" if multiple ambiguity indicators are found

---

## 🔴 Out-of-Scope Heuristics (Deferred for Future Tiers)

### 5. Prompt Use Case / External Data Burden
- Requires semantic parsing to detect prompts that imply real-time data access or cross-source synthesis
- Implementation deferred to NLP-powered scoring engine

### 6. Knowledge Rarity / Concept Obscurity
- Requires a model-based or embedding-driven concept heatmap
- Will be introduced post-MVP using precomputed topic dispersion scoring (e.g., 6b concept)

---

## ⚠️ Additional Constraints

- All heuristics must execute within ~5ms per message to preserve UI responsiveness
- All outputs must be explainable and traceable to their rule trigger
- Module must support adding future scoring logic **without rewriting existing flag logic**
- Any networking logic (e.g., link validation) must fail gracefully and not block user interaction
- Avoid stateful logic across tabs; all heuristics must run per-instance, per-page

---

## 📎 Outputs

- For each flagged response:
  - `flagType`: one of [response_time, rote_format, bad_citation, prompt_ambiguity]
  - `confidence`: string (e.g., "high", "moderate")
  - `tooltipText`: localized, human-readable explanation
  - `source`: which rule(s) triggered the flag

- For all heuristics:
  - Provide per-heuristic toggle flag in development mode (not user-facing)

---

## 🧩 Interfaces & Dependencies

- This module expects to receive:
  - `promptText`: string
  - `responseText`: string
  - DOM node reference for the live GPT response block
- This module does **not**:
  - Render overlays
  - Score heuristics numerically
  - Persist logs (handled by the telemetry module)

---

## 📌 Summary

This module must provide lightweight, explainable hallucination risk flags using four defined rule-based heuristics. It must be prepared to support scoring enhancements in later releases, but remain fully functional and deterministic in the MVP.

