# AIS 004 — EMC Compliance for Automotive Electronics

*Prerequisites: [Communication Interface →](../interfaces/communication-interface.md)*

---

## The Invisible Failure Mode

Electronics can fail without any physical damage if electromagnetic interference (EMI) corrupts signals. In an EV, that can mean false faults, missed faults, or corrupted CAN data. **AIS‑004** exists to ensure automotive electronics survive real‑world EMI and do not emit noise that disrupts other systems.

---

## What AIS‑004 Covers (Scope)

AIS‑004 is India’s automotive EMC standard. It defines how electronic systems must be tested for:

- **Emissions**: how much noise the device *creates* (conducted and radiated)
- **Immunity**: how much external noise the device can *withstand*

It applies across vehicle electronics, including power electronics and BMS hardware.

---

## EMC Basics (Short Primer)

- **Conducted emissions**: noise that travels through cables and power lines.
- **Radiated emissions**: noise that leaves as RF energy (antennas, harnesses, enclosures).
- **Immunity**: ability to keep functioning during external RF, ESD, and transient events.

EVs are especially noisy because inverters, chargers, and DC‑DC converters switch high currents at high frequencies.

---

## Why It Matters for a BMS

A BMS is sensitive:

- **AFE measurements** can be corrupted by noise → wrong cell voltage readings.
- **CAN transceivers** can see error storms under EMI → lost messages.
- **Thermistor inputs** can pick up noise → false over‑temperature faults.

EMC compliance is a safety requirement, not a nice‑to‑have.

---

## Typical AIS‑004 Test Categories

AIS‑004 maps closely to CISPR/ISO families and typically includes:

- **Conducted emissions** on power lines
- **Radiated emissions** from the device and harness
- **ESD immunity** (electrostatic discharge)
- **Radiated RF immunity** (field exposure)
- **Bulk current injection** (noise injected onto harness)

The exact limits and setups are defined in the standard and required test methods.

---

## Design Implications (What Engineers Actually Do)

To pass AIS‑004, BMS hardware usually needs:

- **Filtering**: LC filters, common‑mode chokes, ferrites
- **Shielding**: enclosure design and cable shielding
- **Grounding strategy**: clean analog ground vs power ground segregation
- **PCB layout discipline**: short return paths, proper decoupling, controlled impedance for CAN
- **Isolation**: digital isolators for AFE or HV domains

EMC is cheap to design in and expensive to fix later.

---

## Compliance Flow (High Level)

1. Design with EMC in mind.
2. Pre‑compliance tests in‑house (near‑field probes, basic emissions scans).
3. Formal AIS‑004 tests at an approved lab.
4. Documentation and reports for type approval.

---

## Takeaways

- AIS‑004 ensures EV electronics won’t interfere with each other.
- EMC failures often appear as “software bugs” until you test properly.
- Good PCB layout and filtering save months of re‑testing.

---

## Literature Review

### Core References
- AIS‑004 official document (ARAI)
- CISPR 25 / ISO 11452 (related EMC standards)

### Application Notes
- TI / NXP / ADI EMC layout guides
- CAN transceiver EMI mitigation notes
