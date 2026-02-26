# Error Handling / Fault Reporting — Blog Plan

## Goal
Explain what faults a BMS monitors for, how it detects and classifies them, what actions it takes, and how it communicates faults — from smoke-detector analogy to DTC logging and CAN fault messages.

## Audience Angles
- **Engineers / students**: Fault detection logic, debounce, severity levels, DTC structure, functional safety linkage
- **EV enthusiasts**: "What does this warning light mean?", why the BMS sometimes cuts power unexpectedly, how fault history affects resale

---

## Subtopic Flow

### 1. Hook — The BMS as a Safety Guardian
- A battery pack contains enough energy to start a fire, melt conductors, or generate toxic gas
- The BMS is continuously watching — hundreds of measurements per second — ready to intervene
- Contrast: a car engine has oil, coolant, exhaust sensors. A BMS has 10× as many potential fault conditions, on hardware with 100× more thermal energy.

### 2. What Can Go Wrong? — The Fault Taxonomy
**Measurement / Cell-level faults:**
- Overvoltage (OV) — cell exceeds V_max (e.g., >4.2V for NMC)
- Undervoltage (UV) — cell drops below V_min (e.g., <2.5V)
- Overcurrent discharge (OCD) — current exceeds rated discharge limit
- Overcurrent charge (OCC) — current exceeds rated charge limit
- Overtemperature (OT) — cell or module exceeds T_max
- Undertemperature charge (UTC) — attempting to charge below safe temperature (e.g., <0°C for most chemistries)

**System-level faults:**
- Communication fault — AFE not responding over SPI/I2C, missing CAN heartbeat
- Contactor fault — command sent, but voltage/current feedback says contactor didn't respond
- Current sensor fault — implausible reading, stuck value, sign mismatch
- Memory fault — CRC failure on stored calibration parameters

**Insulation / safety faults:**
- Insulation resistance fault (ground fault) — HV leaking to chassis, detectable via isolation monitoring
- HVIL (High Voltage Interlock Loop) break — HV connector physically unplugged or open

### 3. Fault Detection Logic
- **Threshold comparison**: if V_cell > 4.25V, set OV fault flag
- **Debounce / persistence**: require condition to persist for N consecutive samples or T milliseconds before latching
  - Example: OV only latches if cell > 4.25V for >100ms continuously
  - Prevents nuisance trips from sensor transients or glitches
- **Rate-of-change detection**: fast dV/dt or dT/dt flags a developing fault before static threshold is crossed
- **Plausibility checks**: current sensor = 0A while pack voltage is dropping → sensor fault
- **Cross-checks**: AFE voltage sum vs separate total pack voltage measurement — disagreement flags wiring or sensor failure

### 4. Fault Severity Levels
- **Warning (Level 1)**: condition approaching limit — inform driver, log event, no immediate action
  - Example: temperature approaching 45°C → reduce charge current 20%
- **Fault (Level 2)**: limit exceeded, restrict operation — hard current limit, charge lockout
  - Example: cell at 4.22V (over nominal limit) → stop charging, allow controlled discharge only
- **Critical / Shutdown (Level 3)**: immediate risk — open contactors, disable all HV
  - Example: cell at 4.30V, or temperature >60°C → open main contactors immediately

### 5. Fault Response Actions
- **Current limiting / derating** — first line of defense; keep operating but conservatively
- **Charger enable signal cutoff** — stop charge without opening main contactors (softer response)
- **Main contactor open** — disconnect pack from load/charger completely
- **Pre-charge contactor management** — correct sequence to prevent contact arc damage
- **Cooling system activation** — turn on thermal management before temperature fault escalates
- **CAN fault broadcast** — alert vehicle system; drive warning lights, dash messages

### 6. Diagnostic Trouble Codes (DTCs)
- DTCs are standardized fault identifiers stored in non-volatile memory (EEPROM/Flash)
- Structure: fault code ID, timestamp, severity, occurrence count, freeze-frame (all values at moment of fault)
- Read via: OBD-II (standardized) or proprietary UDS over CAN (ISO 14229)
- DTC states: **active** (fault currently present) vs **historical** (occurred, now cleared)
- Why this matters: service technicians diagnose recurring faults; warranty disputes; resale value inspection
- Show a simple DTC table: Code | Description | Severity | Clear Condition

### 7. Fault Communication over CAN
- BMS transmits fault status on CAN bus — typically every 10–100ms
- Common structure: fault bitmask in a CAN message — each bit = one fault condition
- Vehicle reads: Is BMS OK? Is charging allowed? Is discharging allowed? Are there warnings?
- Design choices: periodic heartbeat (absence = fault) vs event-driven messages vs combined
- Show simple DBC signal definition for a fault status byte

### 8. Functional Safety Linkage
- Fault detection + contactor cutoff = safety mechanism for goals like "prevent cell overvoltage"
- Diagnostic coverage (DC) — % of failure modes detectable — is a key metric in ISO 26262 FMEA
- ASIL decomposition: redundant voltage sensing, independent hardware OV comparators to back up software faults
- Brief mention only (full ISO 26262 treatment in its own post)

### 9. Takeaways
- Faults are the BMS fulfilling its core purpose, not just things going wrong
- Good design: layered thresholds, debounce, graceful derating before hard shutdown
- Engineers: the hard part is not detecting obvious faults — it is catching subtle ones early enough to prevent cascading failures

---

## Experiment Ideas

### Experiment 1: Simulate OV Fault with Debounce
**Materials**: Arduino, potentiometer (simulates cell voltage via voltage divider), LED + buzzer for fault output
**Procedure**:
1. Program Arduino to read voltage from potentiometer (0–5V scaled to 2.5–4.5V)
2. Implement OV detection with 200ms debounce timer
3. Slowly sweep pot past threshold — observe latched fault
4. Introduce fast transient (< 200ms) — observe it does NOT trigger fault

**What to observe**: Debounce effectiveness. Discuss why this matters for real sensor noise.

### Experiment 2: DTC Logger in EEPROM
**Materials**: Arduino Uno (EEPROM built in), serial monitor
**Procedure**:
1. Write simple DTC logger: on fault input pin triggered, store fault code + millis timestamp + count in EEPROM
2. Simulate OV, UV, OT faults via digital inputs
3. Add serial "READ DTCs" command
4. Power cycle — verify DTCs survive

**What to observe**: Non-volatile fault history, mimicking production BMS behavior.

### Experiment 3: CAN Fault Broadcast (with CAN hardware)
**Materials**: 2× Arduino + MCP2515 CAN shields, Logic analyzer or CAN analyzer
**Procedure**:
1. Node A (BMS sim): sends CAN frame with fault bitmask; updates bits on input triggers
2. Node B (VCU sim): receives and decodes frame, activates LED per fault bit
3. Log CAN traffic on analyzer

**What to observe**: Real-time fault communication, DBC signal decoding, latency between fault and vehicle response.

---

## Literature Review

### Core Textbooks
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* — fault management architecture
- **Plett, G.L.** — *BMS Vol. 2* — diagnostic coverage discussion

### Key References
- **ISO 26262** (already written) — link from this post; FMEA for BMS fault coverage
- **ISO 14229** (UDS) — Unified Diagnostic Services standard — DTC structure and read/clear service
- **SAE J2929** — EV battery safety standard — fault containment requirements

### Online Resources
- Orion BMS User Manual — real-world fault table with thresholds and responses (publicly available PDF)
- CSS Electronics — "OBD-II DTC Guide" — understanding DTC format
- Vector Informatik — CAN bus fault handling tutorials
- NHTSA EV Battery Safety Technical Reports — publicly available, real-world fault case studies

### Application Notes
- TI BQ76940 datasheet — hardware FAULT/ALERT pin behavior
- Analog Devices LTC6804 app note — fault detection in daisy-chain configurations
