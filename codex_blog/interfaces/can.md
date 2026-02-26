# CAN Bus — The EV Communication Backbone

*Prerequisites: [Communication Interface →](./communication-interface.md)*

---

## The Wiring Harness Problem

Modern vehicles would need kilometers of copper if every signal had its own wire. CAN solves this by letting all ECUs share two wires and arbitrate access. It is the reason a BMS can talk to the motor controller, charger, and dashboard without a separate cable for each data point.

---

## Why CAN (Not UART or Ethernet)

- UART is point‑to‑point only and has no collision handling.
- Ethernet is fast but not deterministic at the link layer and is less tolerant of EMI without extra layers.
- CAN is multi‑master, priority‑based, and robust against noise by design.

CAN is optimized for harsh electrical environments and real‑time safety messaging.

---

## Physical Layer Basics

- Two wires: CAN_H and CAN_L.
- Differential signaling rejects common‑mode noise.
- 120 Ohm termination at each end of the bus.
- Linear topology with short stubs (not star).

Dominant = logic 0, recessive = logic 1. If two nodes transmit at once, dominant wins on the bus.

---

## Bit Encoding and Bit Stuffing

CAN uses NRZ encoding. If the same bit repeats 5 times, a stuff bit of opposite polarity is inserted to maintain synchronization. Receivers remove stuff bits automatically.

Implication: frame length is not fixed in raw bits even though the data payload is fixed.

---

## Arbitration (Why Priority Always Wins)

CAN uses non‑destructive arbitration. Nodes transmit simultaneously; the lowest ID wins without corrupting the frame. A node that loses stops and retries after the bus is idle.

This is why BMS fault frames (low ID) always get through even when the bus is busy with cell data.

---

## Frame Structure (Standard 11‑bit)

```
SOF | ID | RTR | IDE | DLC | DATA | CRC | ACK | EOF
```

- ID sets both message identity and priority.
- CRC and ACK provide robust error detection.
- Standard frames are 11‑bit ID; extended frames use 29‑bit IDs.

---

## Error Detection and Fault Confinement

CAN detects errors with multiple independent mechanisms:

- CRC check
- Bit monitoring (transmitter reads back its own bit)
- Bit stuffing checks
- Frame format checks
- ACK check

When an error is detected, a node sends an error frame. Nodes that misbehave too often enter Error‑Passive and eventually Bus‑Off, preventing a single faulty ECU from collapsing the bus.

---

## CAN FD

CAN FD extends payload and speed:

- Payload up to 64 bytes
- Data phase up to ~8 Mbps
- Arbitration stays at classic CAN speed

CAN FD is ideal for BMS cell voltage blocks or temperature arrays that would otherwise require many 8‑byte frames.

---

## BMS Message Design (Typical)

| ID | Name | Period | Content |
|---|---|---|---|
| 0x100 | BMS_Status | 10 ms | SOC, pack V, pack I, fault flags |
| 0x101 | BMS_Limits | 10 ms | Max charge/discharge current |
| 0x110 | BMS_Cell1 | 200 ms | Cell voltages 1–4 |
| 0x111 | BMS_Cell2 | 200 ms | Cell voltages 5–8 |
| 0x120 | BMS_Temp | 200 ms | Min/max temps |
| 0x1FF | BMS_Heartbeat | 10 ms | Alive counter |

Design goals:

- Safety frames low ID, high priority.
- Status and limits are periodic.
- Faults are event‑driven and repeated for reliability.
- Cell data is slower to reduce bus load.

---

## DBC Files — Decode the Bus

DBC defines signal bit positions, scaling, and units. This turns raw hex into engineering values.

Example signal entry:

```
SG_ SOC : 0|8@1+ (0.5,0) [0|100] "%" VCU
```

Meaning: SOC starts at bit 0, length 8, little‑endian, factor 0.5, offset 0, unit %.

---

## Bus Loading and Timing Budget

Healthy CAN networks avoid >50% utilization under normal operation. Fault storms can briefly spike traffic. A good design reserves headroom so safety messages still meet timing targets.

Rule of thumb: if you can’t fit all periodic messages into 50% bus load, increase the period of low‑priority data or move to CAN FD.

---

## Practical Pitfalls

- Missing termination causes reflections and intermittent errors.
- Long stubs create signal ringing at high speed.
- Mixed CAN and CAN FD nodes can create error storms if FD frames are present on a classic‑only bus.
- Bad DBC scaling leads to subtle errors that look like sensor faults.

---

## Takeaways

- CAN is noise‑immune and safety‑oriented by design.
- Arbitration guarantees fault messages win the bus.
- DBC design is as important as firmware.
- CAN FD reduces bandwidth pressure in data‑heavy BMS designs.

---

## Experiments

### Experiment 1: Two‑Node CAN Bus
**Materials**: 2x Arduino + MCP2515.

**Procedure**:
1. Send frames every 100 ms.
2. Remove termination and observe errors.

### Experiment 2: Arbitration Demo
**Materials**: Same setup + logic analyzer.

**Procedure**:
1. Transmit IDs 0x100 and 0x200 simultaneously.
2. Observe lower ID winning.

### Experiment 3: Decode with DBC
**Materials**: CANable + python‑can.

**Procedure**:
1. Log frames.
2. Decode using cantools.

---

## Literature Review

- Bosch CAN 2.0 specification
- ISO 11898‑1/2
- TI SLOA101 (CAN intro)
- CSS Electronics CAN tutorials
- SavvyCAN documentation
