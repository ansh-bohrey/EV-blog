# ISO 26262 — Functional Safety for Road Vehicles

*Prerequisites: [BMS Fault Handling →](../bms_concepts/error-handling-fault-reporting.md)*

---

## Safety Is a Design Requirement

ISO 26262 is the functional safety standard for road vehicles. It forces safety to be engineered, verified, and proven — not assumed. For a BMS, this shapes how faults are detected, mitigated, and documented.

---

## The ISO 26262 Framework

- Safety lifecycle from concept to decommissioning.
- Hazard Analysis and Risk Assessment (HARA).
- ASIL levels (A–D) define required rigor.

---

## Safety Goals → Requirements

BMS safety goals typically include:

- Prevent cell overvoltage
- Prevent cell undervoltage
- Prevent unsafe overcurrent
- Ensure safe shutdown when insulation fails

These become **functional safety requirements** that must be traced into design and tests.

---

## Common Safety Mechanisms in a BMS

- Redundant sensing (cell voltage, current)
- Hardware OV/UV comparators
- Watchdogs and safe‑state logic
- Contactor diagnostics and HVIL
- Fault logging with freeze‑frame data

---

## Verification and Validation

ISO 26262 expects structured evidence:

- Unit, integration, and system tests
- SIL/HIL testing
- Fault injection to measure diagnostic coverage
- Traceability from requirement to test case

---

## Documentation Burden (Why It Feels Heavy)

- Safety plan
- Safety case
- FMEA / FTA
- Test evidence and traceability matrix

If you cannot prove it, it didn’t happen.

---

## Takeaways

- ISO 26262 is a process standard as much as a technical one.
- It drives redundancy, diagnostics, and test rigor in BMS design.
- Compliance is expensive to add late — it must be designed in early.

---

## Literature Review

### Core References
- ISO 26262‑1:2018 (framework)
- ISO 26262‑6:2018 (software)

### Related Standards
- IEC 61508 (generic functional safety)
