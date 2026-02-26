# ISO 26262 — Blog Plan

## Goal
Explain ISO 26262 functional safety for road vehicles in practical terms, and how it shapes BMS design, testing, and documentation.

## Audience Angles
- **Engineers / students**: ASIL levels, safety goals, FMEA/FTA, safety mechanisms, verification/validation.
- **EV enthusiasts**: Why safety standards exist and how they reduce catastrophic failures.

---

## Subtopic Flow

### 1. Hook — Safety Is a Design Requirement, Not a Feature
- EV batteries store enormous energy.
- ISO 26262 ensures safety is engineered, not hoped for.

### 2. The ISO 26262 Framework
- Lifecycle approach: concept → design → implementation → validation.
- Hazard Analysis and Risk Assessment (HARA).
- ASIL levels (A–D) and what they mean.

### 3. Safety Goals and Functional Safety Requirements
- Define safety goals for BMS (e.g., prevent cell overvoltage).
- Translate to functional safety requirements.

### 4. Safety Mechanisms in a BMS
- Redundant voltage sensing.
- Hardware OV/UV comparators.
- Watchdogs and safe state logic.
- Contactor diagnostics and HVIL.

### 5. Verification and Validation
- Unit tests, integration tests, HIL/SIL.
- Fault injection and coverage.
- Safety case documentation.

### 6. Documentation and Audit Trail
- Safety plan, safety case, test evidence.
- Traceability from safety goals to test cases.

### 7. Practical Pitfalls
- Over‑reliance on software checks.
- Missing diagnostic coverage for single‑point failures.
- Incomplete safety case evidence.

### 8. Takeaways
- ISO 26262 is a process standard; it shapes how you build and prove safety.
- BMS design must include safety mechanisms, not just algorithms.

---

## Literature Review

### Core References
- ISO 26262‑1:2018 (framework)
- ISO 26262‑6:2018 (software)

### Related Standards
- IEC 61508 (generic functional safety)
