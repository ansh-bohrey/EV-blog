# Error Handling & Fault Reporting — How the BMS Knows Something Is Wrong

*Prerequisites: [Analog Front End (AFE) →](./analog-front-end-afe.md), [HV Safety Architecture →](./hv-safety-architecture.md)*
*Next: [Post-PDU Paralleling →](./post-pdu-paralleling.md)*

---

## A System That Cannot Fail Quietly

A petrol engine has maybe ten sensors: MAP, MAF, coolant temp, O2, knock, crank position, cam position, throttle, fuel pressure, oil pressure. Most of them are there to optimise combustion. If the O2 sensor fails, the engine management light comes on and fuelling goes open-loop. Annoying, but you drive home.

A BMS monitors a system with 100× more stored energy than a petrol tank and 10× more fault conditions than an engine ECU. A 90S4P pack has 360 individual cells. Every one of them can fail high, fail low, fail hot, or fail cold. The pack has current paths that can carry thousands of amps if a contactor welds shut. The HV bus floats at 400–800 V relative to chassis. The electrolyte inside each cell is flammable.

In this environment, a BMS that fails quietly — that misses a fault, logs it incorrectly, or reports an ambiguous status — is not a minor annoyance. It is a fire risk. The entire architecture of fault detection, classification, and response is engineered around one principle: every failure mode must either be detected and acted on, or be provably safe if it goes undetected.

This post explains how that works.

---

## Fault Taxonomy

Not all faults are equal. A BMS that treats every deviation the same way — always opening contactors at the first sign of trouble — would strand drivers constantly and damage contactors through unnecessary cycling. A BMS that is too conservative about when to act would let dangerous conditions develop. The solution is a structured taxonomy.

![Fault taxonomy tree — cell-level faults (OV, UV, OCD, OCC, OT, UTC), system-level faults (comm, contactor, sensor, memory), safety faults (insulation, HVIL)](../assets/claude_assetsplan/bms-concepts/fault-taxonomy-tree.svg)

### Cell-Level Faults

These are detected by per-cell measurement from the AFE and are the core of what BMS protection does.

| Fault code | Full name | Trigger condition | Typical threshold |
|---|---|---|---|
| OV | Overvoltage | Cell voltage > V_max | 4.20–4.25 V (NMC) |
| UV | Undervoltage | Cell voltage < V_min | 2.80–3.00 V (NMC) |
| OCD | Overcurrent discharge | Discharge current > I_max_disch | Chemistry and pack dependent |
| OCC | Overcurrent charge | Charge current > I_max_charge | Chemistry and C-rate dependent |
| OT | Overtemperature | Cell/module temp > T_max | 55–60°C (charge and discharge limits differ) |
| UTC | Under-temperature charge | Charging below T_min_charge | 0–5°C — lithium plating risk |

**OV** is the fault the BMS must never miss. An overcharged NMC cell above 4.30 V begins cathode decomposition and lithium plating. The AFE's hardware OV comparator — which operates independently of the MCU software — is the backstop protection here. See the [AFE post](./analog-front-end-afe.md) for details on hardware-speed protection.

**UTC** deserves special mention because it is not about the cell being in danger right now — it is about what charging below 0–5°C does to the anode over time. At low temperatures, lithium ions cannot intercalate into graphite fast enough. They plate as metallic lithium on the anode surface instead. Lithium plating causes irreversible capacity loss and, if severe enough, creates dendrites — the same internal short circuit risk as deep discharge. A properly designed BMS refuses to allow any charge current when temperature is below the safe threshold, regardless of what the charger requests.

### System-Level Faults

These are faults in the BMS's own hardware and communication infrastructure — not in the cells themselves, but in the system's ability to monitor and control them.

**Communication fault**: the AFE communicates to the MCU via SPI (or isoSPI in a daisy-chain). If SPI transactions return persistent CRC errors, or if an AFE chip in the chain stops responding to broadcasts, the BMS cannot trust cell voltage data from that module. This is a fault in the monitoring system itself, and a dangerous one — the BMS is now blind to part of the pack.

Similarly, on the vehicle side, the BMS expects a periodic **CAN heartbeat** from the Vehicle Control Unit (VCU). If the VCU goes silent — power loss, crash, severe EMI — the BMS must assume the worst and enter a safe state rather than continuing to operate without coordination.

**Contactor fault**: when the BMS commands a contactor to close, it expects a confirmation signal back within a defined window. If the feedback signal indicates the contactor did not close when commanded, or — more dangerously — indicates it stayed open when the BMS thought it was closed, the BMS has lost control of HV isolation. Contactor feedback monitoring is a critical safety check.

**Current sensor fault**: a current sensor reading of exactly 0 A while the BMS-estimated SOC is dropping rapidly is a plausibility check failure. A sensor stuck at 0 A, stuck at a rail value, or reversing sign unexpectedly (negative current during commanded discharge) indicates sensor hardware failure. If the BMS cannot trust its current measurement, Coulomb counting for SOC becomes unreliable and overcurrent protection is compromised.

**Memory fault**: calibration data, SOC estimates, fault logs, and configuration parameters are stored in non-volatile memory (NVM). A CRC or ECC failure on read-back indicates data corruption — potentially from write failures, radiation, or power loss during a write cycle. A BMS that boots with corrupted calibration data will make wrong decisions. Firmware should detect and flag this at startup.

### Safety Faults

**Insulation resistance fault**: the HV bus must be galvanically isolated from the chassis. A healthy pack has insulation resistance > 500 kΩ between positive or negative HV rail and chassis ground (ISO 6469 requires > 100 Ω/V, so > 40 kΩ for a 400 V system). An insulation fault — from a damaged cable, coolant leak onto HV components, or a damaged connector — creates a path that can deliver lethal current to chassis-grounded metal. The BMS measures insulation resistance using a dedicated **IMD (Insulation Monitoring Device)**. If R_insulation drops below the threshold, the fault must be flagged immediately, regardless of pack state.

**HVIL (High Voltage Interlock Loop)** is a low-voltage sense circuit that runs through every HV connector, service disconnect, and cover in the system. If any connector is unplugged, any cover is opened, or any cable is severed, the HVIL loop breaks and the BMS opens all contactors. It is a hardware-level assertion that HV connectors are physically mated before high voltage is present. An HVIL break during operation is an immediate critical fault.

---

## Fault Detection Logic

Declaring a fault from a single sensor sample would produce constant nuisance trips. Sensor noise, transient current spikes during motor switching, and brief voltage glitches from regenerative braking would all trigger false alarms. Production BMS firmware applies several layers before latching a fault.

**Threshold comparison**: the primary check — if V_cell > 4.25 V, raise the OV candidate flag. This is necessary but not sufficient.

**Debounce / persistence**: require the threshold violation to persist for N consecutive samples or T milliseconds before the fault is latched. A 50 ms debounce at 100 ms sample rate requires 5 consecutive threshold violations. This eliminates most transient noise-induced trips. The correct debounce window is short enough to catch real faults before damage occurs, but long enough to reject sensor noise — typically 20–200 ms depending on fault type.

**Rate-of-change detection**: a cell temperature rising at 5°C per minute during normal operation is unremarkable. The same cell rising at 5°C per *second* is a pre-runaway indicator even if the absolute temperature has not yet hit the fault threshold. dT/dt and dV/dt checks catch developing faults before they become severe.

**Plausibility checks**: cross-validate measurements that should agree. If the pack current sensor reads 0 A but the BMS is seeing cell voltages drop at a rate consistent with 50 A discharge, the current sensor is faulty. If the AFE's sum of individual cell voltages disagrees with the pack-level voltage sensor by more than 2 V, there is either a wiring fault, a measurement fault, or a cell bypass condition. These cross-checks catch sensor failures that a threshold-only approach would completely miss.

---

## Severity Classification and Response

Every detected fault is classified into a severity level that determines the BMS's response. The mapping is not arbitrary — it is designed to keep the pack operating as long as safety permits while escalating forcefully when it does not.

![Fault severity flowchart — fault detected, severity classification, response actions (derate / stop charge / open contactors)](../assets/claude_assetsplan/bms-concepts/fault-severity-flowchart.svg)

**Level 1 — Warning**: approaching a limit but not there yet. The BMS informs the driver and vehicle, logs the event, and may derate slightly, but does not interrupt operation. Example: cell temperature at 43°C approaching the 45°C charge derate threshold — the BMS reduces charge current by 20% and logs the event. The vehicle continues driving and charging, just with reduced performance.

**Level 2 — Fault**: a limit has been exceeded but the risk does not require immediate full shutdown. Operation is restricted. Example: a cell voltage hits 4.22 V during charging — the BMS stops charging (opens the charge contactor or signals the charger to stop) but leaves the discharge path open so the vehicle can still drive the pack down to a safer voltage. The driver gets a dashboard warning.

**Level 3 — Critical/Shutdown**: immediate risk to safety. The BMS opens all contactors immediately, isolating the HV pack from all loads and chargers. No delay, no waiting for confirmation from the VCU. The decision is made in firmware, executed in hardware. Example: any cell exceeds 4.30 V, any cell or module exceeds 60°C, insulation resistance below minimum, HVIL break detected. The BMS broadcasts the fault over CAN, logs a detailed freeze-frame, and remains in lockout until a qualified inspection clears the condition.

### Response Actions

The BMS has several tools it can apply in escalating order of intervention:

1. **Current limiting / derating**: the most conservative response. The BMS adjusts the SOP (State of Power) limits it publishes on CAN, effectively asking the VCU to command less current. The pack keeps operating but within a reduced envelope. This is the first response to temperature warnings, approaching voltage limits, or elevated impedance. See the [State of Power (SOP) post](./state-of-power-sop.md) for how SOP limits are calculated and communicated.

2. **Charger enable cutoff**: the BMS de-asserts the "charge enable" signal it provides to the onboard charger or DCFC station interface. This stops charge current without touching the main contactors. Less mechanical wear than a contactor cycle; appropriate for Level 2 overvoltage and temperature faults during charging.

3. **Main contactor open**: full HV isolation. The BMS opens the main positive and negative contactors, disconnecting the pack from the HV bus. This is the correct response to any Level 3 fault. Contactors have a limited cycle life (typically 10,000–100,000 cycles depending on type) so unnecessary cycling is avoided — but when safety requires it, the contactor opens regardless.

4. **Cooling activation**: when a temperature fault is approaching, the BMS can command the thermal management system to maximum cooling before the hard cutoff is reached. This may resolve the thermal fault and allow continued operation, avoiding a Level 3 event. Proactive rather than reactive.

5. **CAN fault broadcast**: the BMS transmits its fault status frame to the vehicle's CAN bus. The VCU reads the fault type, severity, and any relevant freeze-frame data, and decides how to present the situation to the driver — warning light, dashboard message, reduced power mode, limp home mode.

---

## Diagnostic Trouble Codes (DTCs)

**Diagnostic Trouble Codes** are standardised, persistent fault identifiers stored in the BMS's non-volatile memory. Every fault event generates a DTC record containing:

- Fault code ID (unique numeric identifier for the fault type)
- Timestamp (from a real-time clock or odometer/runtime counter)
- Severity level at time of occurrence
- Occurrence count (how many times this fault has triggered)
- Freeze-frame data: a snapshot of every relevant sensor value — all cell voltages, all temperatures, pack current, SOC, SOH estimate, contactor states — captured at the instant the fault was latched

DTCs remain stored even after the fault clears, even after ignition cycles, and even after battery resets. They are readable via OBD-II diagnostic port or UDS (Unified Diagnostic Services, ISO 14229) over CAN using a scan tool or factory diagnostic software.

**Active DTCs** are faults currently present. **Historical (stored) DTCs** are faults that occurred and subsequently cleared. The distinction matters: a cell that triggered an OV fault during a charging session and then recovered is not currently dangerous, but the historical DTC tells a technician, warranty analyst, or resale inspector that the fault happened, when it happened, and what the pack state was at the time.

For warranty claims, DTCs are the evidence. For field diagnostics, freeze-frame data is the difference between a technician who can diagnose the root cause in an hour and one who replaces components blindly. For resale or second-life assessment, the DTC history of a used pack is its medical record.

---

## CAN Fault Communication

The BMS transmits a **fault status frame** on the vehicle CAN bus at a periodic rate — typically every 10–100 ms for the summary status, with event-driven transmission of detailed fault frames when a new fault occurs.

The summary status frame is compact and binary: a bitmask where each bit corresponds to one fault condition. The VCU decodes: Is BMS healthy? Is charging allowed? Is discharging allowed? Is there an active warning? Is there an active fault? Is there a critical shutdown condition? Bit 0 being set means the pack is in a normal state. Any other bit set triggers the corresponding VCU response.

Most production systems combine periodic heartbeat transmission with event-driven fault frames. The periodic heartbeat serves a second purpose: **absence is a fault**. If the VCU stops receiving BMS heartbeat frames for longer than a configurable timeout (typically 100–500 ms), the VCU treats the silence as a communication fault and enters a safe state. A BMS that crashes silently — MCU lockup, power loss, CAN controller fault — is detected by the VCU through the absence of its heartbeat. This is a critical design principle: **the BMS must fail noisily**, not silently.

See the [CAN Communication post](../interfaces/can.md) for CAN bus framing, arbitration, and how BMS messages are structured within a vehicle CAN network.

---

## Functional Safety Linkage

The combination of fault detection and contactor cutoff implements an **ISO 26262 safety mechanism**. ISO 26262 requires that the safety goal — "the HV pack shall not deliver uncontrolled energy that could cause injury" — be achieved by safety mechanisms whose effectiveness can be quantified.

**Diagnostic coverage (DC%)** is the percentage of failure modes that the detection logic can identify. For a cell OV fault, the hardware OV comparator in the AFE combined with the software threshold check in the MCU achieves high diagnostic coverage — most ways a cell can fail into overvoltage are detected. A failure mode that leaves the cell overvoltaged but produces no detectable signal is a gap in coverage.

The FMEA (Failure Mode and Effects Analysis) for a BMS lists every component failure mode, estimates the rate of occurrence, assesses severity, and identifies which safety mechanisms detect or prevent each failure. Closing gaps in diagnostic coverage — ensuring that hardware and software failures in the monitoring chain itself are detected — is why production BMS designs include redundant voltage sensing paths, independent hardware OV comparators in the AFE that act without MCU involvement, and watchdog timers that reset the MCU if firmware locks up.

The functional safety post ([HV Safety Architecture →](./hv-safety-architecture.md)) covers ISO 26262 ASIL ratings and the system-level safety architecture in more depth.

---

## Experiments

### Experiment 1: Simulate Fault Detection with an Arduino + INA219

**Materials**: Arduino Uno, INA219 current/voltage sensor module, 18650 NMC cell, 10 Ω resistive load, jumper wires, Arduino serial monitor.

**Procedure**:
1. Wire the INA219 to the Arduino over I2C. Connect the cell in series with the shunt resistor and the 10 Ω load through the INA219's sense path.
2. Write a firmware loop that reads voltage and current at 100 ms intervals. Implement three fault checks: UV (if V < 3.0 V), OT placeholder (always false for now), and OCC (if current > a threshold you set).
3. Implement a 3-sample debounce: only flag the fault after 3 consecutive threshold violations. Print the debounce counter to serial on each sample.
4. Intentionally discharge the cell below 3.0 V (briefly connect a larger load) and observe the debounce counter counting up, then the fault latching.

**What to observe**: The debounce counter in the serial output — watch it increment with each violation and reset if the voltage recovers above threshold between samples. This makes concrete why a single-sample threshold check produces false trips and why persistence is required. Measure the actual voltage with a DMM at the moment the fault latches and compare it to the raw INA219 reading to assess the measurement error in the sensor chain.

---

### Experiment 2: CAN Fault Frame Logging with MCP2515

**Materials**: Arduino Uno, MCP2515 CAN shield, a second Arduino + MCP2515 as CAN listener, INA219 as the "BMS sensor", 18650 cell.

**Procedure**:
1. Programme the first Arduino as the "BMS node": reads INA219 voltage and current at 100 ms, builds a 4-byte CAN frame (bytes 0–1: voltage in mV as uint16, bytes 2–3: current in mA as int16), and transmits it on CAN ID 0x300.
2. Add fault logic: if voltage < 3.0 V or current > limit, set a fault bitmask byte and transmit a fault frame on CAN ID 0x301 with the bitmask.
3. Programme the second Arduino as the "VCU listener": receive and parse both frames, print decoded values to serial.
4. Also implement heartbeat timeout on the listener: if no frame received from 0x300 within 500 ms, print "BMS HEARTBEAT LOST — COMM FAULT".

**What to observe**: The latency from fault condition on the INA219 to decoded fault on the listener's serial output — this is the end-to-end fault communication latency. Intentionally disconnect the "BMS node" Arduino's power: the listener should detect heartbeat loss within 500 ms and print the comm fault. This demonstrates why absence-of-heartbeat is as important as explicit fault frame transmission.

---

### Experiment 3: Plausibility Check — Voltage vs Current Cross-Validation

**Materials**: Arduino Uno, INA219, 18650 cell, DMM, a second voltage divider circuit to simulate an "AFE cell voltage reading".

**Procedure**:
1. Set up the INA219 to measure pack current accurately. Separately, use a voltage divider from the cell to simulate an "AFE reported voltage" to an Arduino analog input (scale so that 0–4.2 V maps to 0–1023 ADC counts).
2. Write firmware that computes: expected_delta_V = I_measured × R_estimated (use a hardcoded R_internal of 100 mΩ). Compare actual_delta_V (change in reported cell voltage over the last second) to expected_delta_V.
3. If the discrepancy exceeds a threshold (e.g., actual voltage change is 5× larger than expected from current alone), flag a plausibility fault.
4. Introduce a mismatch: leave the current sensor disconnected (reads 0 A) while the cell is under load. Watch the plausibility fault trigger.

**What to observe**: The plausibility check detects the current sensor failure by noticing that voltage is changing without a corresponding current explanation. This is a cross-check that a simple single-sensor threshold comparison completely misses — and it illustrates why production BMS firmware includes inter-sensor consistency checks as a separate layer from threshold comparisons.

---

## Further Reading

- **Plett, G.L.** — *Battery Management Systems, Vol. 1* (Artech House, 2015) — Ch. 3 covers protection system design including threshold setting, debounce logic, and the relationship between protection parameters and cell lifetime.
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* (2010) — Ch. 6 is the most practical available treatment of BMS fault detection architecture, including current sensor plausibility checks and contactor feedback monitoring.
- **ISO 26262:2018** — *Road Vehicles — Functional Safety* — Part 4 (System-level requirements) and Part 6 (Software requirements) directly apply to BMS fault detection and response firmware. The diagnostic coverage metric (DC%) is defined in Part 5, Annex D.
- **ISO 14229 (UDS)** — *Unified Diagnostic Services* — defines the DTC structure, freeze-frame format, and the $19 ReadDTCInformation service used by scan tools to retrieve fault history from the BMS.
- **AIS-004** — Indian standard for lithium-ion battery safety, includes mandated fault detection and response requirements for EV battery packs in the Indian regulatory context.
- **AIS-156** — CMVR Type Approval for Electric Power Train — fault reporting requirements are part of the BMS type approval criteria.
- **TI Application Report SLUA929** — "Battery Management System Fault Detection Methods" — covers hardware and software approaches to fault detection in TI AFE-based designs.
- **Orion BMS User Manual** — Fault table, DTC structure, and CAN fault frame format — practical real-world reference for how a production BMS implements exactly the architecture described in this post.
- [Analog Front End (AFE) →](./analog-front-end-afe.md) — hardware-level OV/UV comparators and ALERT pin that implement the hardware protection layer.
- [HV Safety Architecture →](./hv-safety-architecture.md) — ISO 26262 ASIL requirements and system-level safety architecture.
- [Thermal Runaway Detection & Handling →](./thermal-runaway-detection-handling.md) — what happens when temperature faults escalate beyond what the BMS can manage electrically.
- [Deep Discharge Protection →](./deep-discharge-protection.md) — UV fault detection and the recovery charging protocol in detail.
- [Ignition Handling →](./ignition-handling.md) — how fault state is preserved across key-off/key-on cycles and how the BMS boots into a known fault state.
