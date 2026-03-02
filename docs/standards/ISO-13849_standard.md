# ISO 13849 — Safety of Machinery Control Systems

*Prerequisites: [BMS Fault Handling →](../bms_concepts/error-handling-fault-reporting.md)*

---

## Why Another Safety Standard?

ISO 26262 is for road vehicles. **ISO 13849** is for safety‑related control systems in machinery. Battery systems often cross into industrial and stationary storage contexts, where ISO 13849 can be the governing framework.

---

## Scope and Applicability

- Applies to machinery and industrial systems.
- Relevant for battery racks, energy storage systems, and charging infrastructure.
- Less common for road vehicles, but important for non‑automotive deployments.

---

## Key Concepts

- **Performance Level (PL a–e)** instead of ASIL.
- **Categories (B, 1, 2, 3, 4)** define architecture and diagnostic requirements.
- **MTTFd** (mean time to dangerous failure) and **Diagnostic Coverage** determine PL.

---

## ISO 13849 vs ISO 26262

- ISO 13849 emphasizes quantitative reliability and architecture categories.
- ISO 26262 emphasizes automotive lifecycle process and ASIL risk analysis.
- Different language, similar goal: prevent unsafe failures.

---

## Mapping to BMS Functions

Examples of safety‑related functions:

- Safe shutdown loop (contactor open on fault)
- HV interlock monitoring
- Overcurrent protection path

These must be mapped to PL requirements if ISO 13849 applies.

---

## Takeaways

- ISO 13849 is relevant outside road vehicles.
- It provides a structured method to quantify safety performance.
- Engineers must choose the correct safety framework for the application.

---

## Literature Review

### Core References
- ISO 13849‑1:2023
- ISO 13849‑2 (validation)

### Related Standards
- ISO 26262
- IEC 62061
