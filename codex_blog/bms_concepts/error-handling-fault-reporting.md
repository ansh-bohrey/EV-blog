# Error Handling and Fault Reporting — The BMS Safety Net

*Prerequisites: [AFE →](./analog-front-end-afe.md), [Ignition Handling →](./ignition-handling.md)*

---

## The BMS as a Safety Guardian

A battery pack can deliver enormous energy. The BMS watches hundreds of measurements per second and intervenes when anything drifts outside safe limits. Fault handling is the BMS doing its job, not just reacting to failures.

---

## Fault Taxonomy (What Can Go Wrong)

**Cell-level faults**
- Overvoltage (OV)
- Undervoltage (UV)
- Overtemperature (OT)
- Undertemperature for charge (UTC)
- Overcurrent charge/discharge (OCC/OCD)

**System-level faults**
- Sensor faults (stuck or implausible)
- AFE communication faults
- Contactor not responding
- CAN heartbeat missing

**Safety faults**
- Insulation resistance / ground fault
- HVIL break

---

## Detection Logic

- **Thresholds**: direct comparisons against limits
- **Debounce**: require persistence for N ms to avoid noise trips
- **Rate-of-change**: dV/dt or dT/dt for early warning
- **Plausibility checks**: current = 0 but voltage sagging
- **Cross-checks**: sum of cell voltages vs pack voltage

---

## Fault Severity Levels

- **Warning**: notify driver, reduce power
- **Fault**: limit charging/discharging
- **Critical**: open contactors immediately

Good design derates gracefully before full shutdown when possible.

---

## Fault Actions

- Limit current
- Disable charging
- Open contactors
- Activate cooling
- Broadcast fault over CAN

---

## DTCs (Diagnostic Trouble Codes)

Faults are logged in non-volatile memory with:

- Code ID
- Timestamp
- Severity
- Occurrence count
- Freeze-frame data

These are read via OBD/UDS for service and warranty decisions.

---

## Fault Communication on CAN

Most BMSs publish a fault bitmask every 10–100 ms. The vehicle controller uses it to decide if charging or driving is allowed.

---

## Takeaways

- Detection is more than thresholds; debounce and plausibility checks matter.
- Fault handling is layered: warn → derate → shutdown.
- Logging matters for diagnostics and warranty.

---

## Experiments

### Experiment 1: Debounced OV Fault
**Materials**: Arduino + potentiometer.

**Procedure**:
1. Implement OV threshold with 200 ms debounce.
2. Trigger quick transients and sustained faults.

**What to observe**: Debounce prevents nuisance trips.

### Experiment 2: Simple DTC Logger
**Materials**: Arduino EEPROM.

**Procedure**:
1. Log a fault code and timestamp.
2. Power cycle and verify persistence.

### Experiment 3: CAN Fault Broadcast
**Materials**: 2x MCP2515 boards.

**Procedure**:
1. Send fault bitmask from node A.
2. Decode on node B and trigger LEDs.

---

## Literature Review

### Core References
- Andrea — *Battery Management Systems for Large Li-ion Packs*
- Plett — *BMS Vol. 2*

### Standards / Notes
- ISO 26262, ISO 14229, SAE J2929
