# AIS 004 — Blog Plan

## Goal
Explain what AIS‑004 covers (EMC/EMI requirements for automotive electronics in India), why it matters for EVs and BMS hardware, and how compliance testing is performed.

## Audience Angles
- **Engineers / students**: EMC test types, design implications (filtering, shielding, grounding), validation planning.
- **EV enthusiasts**: Why electronic noise matters and how standards prevent vehicle malfunctions.

---

## Subtopic Flow

### 1. Hook — The Invisible Failure Mode
- An EV can fail without a broken part if EMI corrupts sensors or CAN traffic.
- AIS‑004 ensures electronics survive noisy environments.

### 2. What AIS‑004 Covers (Scope)
- Applicability to vehicle electronics and sub‑systems.
- Relationship to CISPR/ISO EMC families.

### 3. EMC Basics (Quick Primer)
- Conducted vs radiated emissions.
- Conducted vs radiated immunity.
- Why switching inverters and chargers are major EMI sources.

### 4. BMS‑Specific EMC Risks
- AFE measurement noise.
- CAN bus error storms due to EMI.
- False faults from noisy thermistor signals.

### 5. Test Matrix Overview
- Emissions tests (conducted/radiated).
- Immunity tests (ESD, RF fields, bulk current injection).
- Pass/fail criteria and limits.

### 6. Design Implications
- Filtering (LC, common‑mode chokes).
- Shielding and cable routing.
- Grounding strategy and isolation.
- PCB layout considerations for AFEs and CAN transceivers.

### 7. Documentation and Compliance Flow
- Test reports and traceability.
- OEM supplier EMC validation process.

### 8. Takeaways
- AIS‑004 compliance is as important as functional performance.
- EMC design is cheaper than EMC re‑testing failures.

---

## Literature Review

### Core References
- AIS‑004 official document (ARAI)
- CISPR 25 / ISO 11452 (related EMC standards)

### Application Notes
- TI / NXP / ADI EMC layout guides
- CAN transceiver EMI mitigation notes
