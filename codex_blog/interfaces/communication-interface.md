# Communication Interfaces in a BMS — From Chip SPI to Vehicle CAN

*Prerequisites: [AFE →](../bms_concepts/analog-front-end-afe.md)*

---

## A BMS That Doesn’t Talk Is a Brick

A BMS must report SOC to the dashboard, send current limits to the motor controller, accept charge commands, and expose diagnostics. Each conversation uses a protocol optimized for its role.

---

## The Communication Layers

1. **Internal chip‑to‑chip**: AFE → MCU (SPI/I2C)
2. **Vehicle bus**: BMS → VCU/MCU/Cluster (CAN)
3. **Diagnostics**: service tool → BMS (UDS over CAN, UART/USB)
4. **Charging**: EVSE/DC fast charger (pilot, CAN, PLC)

---

## SPI / I2C — Internal AFE Communication

- **SPI**: fast, full‑duplex, simple framing
- **I2C**: fewer wires, addressable, slower
- **Isolation**: isoSPI or digital isolators for high‑voltage stacks

Typical transaction:

```
CMD -> REG_ADDR -> DATA -> CRC/PEC
```

The CRC/PEC is essential in noisy environments. Bad reads become bad SOC and bad protection decisions.

---

## CAN — The Vehicle Backbone

- Differential, multi‑master, robust against EMI
- Arbitration gives priority to safety‑critical frames
- Classical CAN: 8‑byte payloads; CAN FD: 64 bytes

Typical BMS CAN set:

- Status (SOC, pack voltage, pack current)
- Limits (max charge/discharge current)
- Faults (bitmask, severity)
- Cell data (slower periodic)

---

## DBC Files — Decoding CAN

DBC defines signal positions, scaling, and units. Tools like SavvyCAN or python‑can + cantools turn raw hex into engineering values.

Example signal entry:

```
SG_ SOC : 0|8@1+ (0.5,0) [0|100] "%" VCU
```

---

## UDS — Diagnostic Communication

Service tools use UDS (ISO 14229) over CAN to read DTCs, freeze frames, and firmware versions. OBD‑II is limited; UDS is where real BMS diagnostics live.

---

## Charger Communication

- **AC (J1772/IEC 62196)**: pilot signal advertises current capability
- **CHAdeMO**: CAN‑based negotiation
- **CCS**: PLC (ISO 15118)

The BMS is always the authority on voltage and current limits.

---

## UART / USB for Development

UART is still the most common BMS debug interface. USB‑to‑UART adapters make this easy for lab work, bootloaders, and field diagnostics.

---

## Takeaways

- SPI/I2C moves raw measurements inside the BMS.
- CAN moves decisions across the vehicle.
- UDS is for service and diagnostics.
- Charger protocols enforce safety and compatibility.

---

## Experiments

### Experiment 1: Read an AFE over SPI
**Materials**: Arduino + AFE breakout.

**Procedure**:
1. Read cell voltages over SPI.
2. Verify with a DMM.

### Experiment 2: BMS Status on CAN
**Materials**: Arduino + MCP2515.

**Procedure**:
1. Broadcast SOC/voltage on CAN.
2. Decode with a simple DBC.

### Experiment 3: DBC Decode in Python
**Materials**: python‑can + cantools.

**Procedure**:
1. Log frames.
2. Decode with DBC and plot SOC.

---

## Literature Review

- TI SLOA101 — CAN introduction
- ISO 11898‑1/2 (CAN), ISO 14229 (UDS), ISO 15118 (CCS)
- Analog Devices LTC6804 isoSPI notes
