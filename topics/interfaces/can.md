# CAN Bus — Blog Plan

## Goal
Explain CAN bus from the ground up — why it was invented, how it works electrically and logically, how its error detection makes it robust, and how it is used specifically in BMS and EV systems — from "why do cars need a network at all?" to decoding a real BMS CAN frame.

## Audience Angles
- **Engineers / students**: Differential signaling, bit stuffing, arbitration mechanism, error frames, CAN FD, DBC signal encoding, NRZ encoding
- **EV enthusiasts**: "What is the CAN bus I keep hearing about?", why your OBD-II reader can see live battery data, how all the car's computers talk to each other

---

## Subtopic Flow

### 1. Hook — The Wiring Harness Problem
- A 1980s car had maybe 20 electrical signals. A 2000s car has 2000+.
- Naive approach: run one wire per signal — a modern car would need kilometers of copper, weighing hundreds of kilograms
- The solution: a shared communication bus. All ECUs (Engine Control Unit, BMS, ABS, Airbag, etc.) share 2 wires and take turns talking.
- CAN (Controller Area Network) was invented by Bosch in 1983 precisely for this problem. It is now in virtually every vehicle on earth — including EVs.

### 2. A Brief History
- Developed by Bosch starting 1983, published 1986, first in-vehicle use: Mercedes W140 (1991)
- Standardized under ISO 11898 (data link layer) and ISO 11898-2 (physical layer)
- Adopted in aerospace (CANopen), medical devices, industrial automation — it escaped the car
- CAN FD (Flexible Data-rate) introduced 2012 by Bosch — larger payload, higher speed
- Now: every automotive ECU in a modern EV speaks CAN, often multiple CAN networks on one vehicle

### 3. Why Not Just Use UART or Ethernet?
- **UART**: point-to-point only, no multi-node bus, no collision detection
- **Ethernet**: high speed, but not designed for harsh electrical environments, no real-time determinism at the link layer, no native message priority
- **CAN**: multi-master bus, inherent message prioritization via arbitration, hardware error detection, designed for automotive EMI environments
- This section builds intuition for why CAN fits the automotive world specifically

### 4. Physical Layer — How the Signal Gets There
- **Two wires**: CAN_H (CAN High) and CAN_L (CAN Low)
- **Differential signaling**: the signal is the *difference* between CAN_H and CAN_L, not the absolute voltage
  - Dominant bit (logical 0): CAN_H ≈ 3.5V, CAN_L ≈ 1.5V → difference ≈ 2V
  - Recessive bit (logical 1): both at ≈ 2.5V → difference ≈ 0V
- **Why differential?** Noise couples equally to both wires → difference cancels noise → immune to EMI (motor drives, switching supplies in EVs generate lots of EMI)
- **Termination**: 120Ω resistors at both ends of the bus (matched to cable characteristic impedance)
  - Without termination: signal reflections degrade high-speed communication
  - Classic mistake in DIY CAN setups: missing termination → intermittent communication errors
- **Bus topology**: linear with stubs — not star, not ring
- **Speed**: Classical CAN up to 1 Mbps; typical automotive: 250 kbps or 500 kbps; high-speed internal: 1 Mbps

### 5. Bit Encoding — NRZ and Bit Stuffing
- **NRZ (Non-Return to Zero)**: the signal stays high or low for the duration of a bit — no mid-bit transition for clock recovery
- **Problem**: long sequence of same bit → receiver loses clock synchronization
- **Bit stuffing**: after 5 consecutive same-polarity bits, the transmitter automatically inserts 1 opposite-polarity "stuff bit"
  - Receiver recognizes and removes stuff bits
  - Ensures maximum 5 bits of same polarity → provides regular edges for clock resynchronization
  - Side effect: stuffed bits add overhead — maximum frame length is longer than nominal

### 6. CAN Frame Structure — Anatomy of a Message
Walk through the Standard (11-bit ID) CAN frame field by field:

```
SOF | Arbitration ID (11 bits) | RTR | IDE | r0 | DLC (4) | Data (0–64 bytes) | CRC (15) | ACK | EOF
```

- **SOF (Start of Frame)**: single dominant bit — all nodes synchronize here
- **Arbitration ID**: 11 bits (standard) or 29 bits (extended) — doubles as message priority
  - Lower ID number = higher priority (ID 0x001 beats 0x100)
- **RTR (Remote Transmission Request)**: 0 = data frame, 1 = request for data
- **IDE (Identifier Extension)**: 0 = standard frame, 1 = extended (29-bit)
- **DLC (Data Length Code)**: 4 bits, value 0–8 — number of data bytes
- **Data field**: 0–8 bytes of payload (0–64 bytes in CAN FD)
- **CRC (Cyclic Redundancy Check)**: 15-bit polynomial over all preceding bits — detects transmission errors
- **ACK slot**: transmitter sends recessive, *any receiving node* pulls dominant to acknowledge
  - If no node acknowledges: transmitter knows its frame was not received

### 7. Bus Arbitration — How Multiple Nodes Share the Bus
- **CSMA/CR (Carrier Sense Multiple Access / Collision Resolution)** — not CSMA/CD like Ethernet
- All nodes wanting to transmit start simultaneously
- Each node watches the bus while transmitting its arbitration ID
- If a node transmits recessive (1) but sees dominant (0) on the bus: it lost arbitration, stops transmitting, waits
- Dominant wins over recessive: the lowest-ID message wins without any bit being corrupted
- This is non-destructive arbitration — the winner's frame continues without corruption
- Critical for BMS: high-priority fault messages (low ID) always get through even if lower-priority cell voltage messages are competing

### 8. Error Detection and Fault Confinement
CAN has five independent error detection mechanisms:
1. **CRC check**: detects corrupted bits in data field
2. **Frame check**: validates fixed-format fields (SOF, EOF, ACK, delimiters)
3. **Bit monitoring**: transmitter reads back what it sent — mismatch = bit error
4. **Bit stuffing check**: detects stuffing rule violations
5. **ACK check**: no acknowledgment → transmission failure

**Error frames**: when a node detects an error, it transmits an Error Frame — 6 consecutive dominant bits (violates stuffing rule intentionally) — signals all nodes to discard the current frame

**Fault confinement states**:
- **Error Active**: normal operation; node can transmit Error Frames
- **Error Passive**: node has encountered many errors; sends passive (non-dominant) error frames
- **Bus Off**: too many errors; node disconnects from bus until reset
- This prevents a single faulty node from bringing down the entire bus

### 9. Message Design for BMS
Good CAN message design principles:
- **Assign IDs by priority**: BMS fault/shutdown messages → lowest IDs (highest priority); cell data → higher IDs
- **Periodic vs event-driven**:
  - Status/limits: periodic at 10–100ms (predictable bus load)
  - Faults: event-driven (instant, also repeated for reliability)
  - Cell data: periodic at 200–1000ms (lower priority, large data)
- **Heartbeat**: BMS sends an alive message every 10ms; missing heartbeat = vehicle controller assumes BMS failed → safe state
- **Signal packing**: fit multiple signals into one 8-byte frame efficiently using DBC-defined bit positions

Typical BMS CAN message set (show ID assignment example):
| ID | Name | Period | Content |
|---|---|---|---|
| 0x100 | BMS_Status | 10ms | SOC, pack voltage, current, fault flags |
| 0x101 | BMS_Limits | 10ms | Max charge current, max discharge current, charge enable |
| 0x110 | BMS_CellData1 | 200ms | Cell voltages 1–4 |
| 0x111 | BMS_CellData2 | 200ms | Cell voltages 5–8 |
| 0x120 | BMS_Temp | 200ms | Temperatures, min/max cell |
| 0x1FF | BMS_Heartbeat | 10ms | Alive counter |

### 10. DBC Files — The Rosetta Stone for CAN
- **DBC (Database CAN)**: text file format defining every message and signal on a CAN network
- Signal definition: start bit, length (bits), byte order (Intel/Motorola), value type (signed/unsigned), factor, offset, min, max, unit
- Decoded value = (raw_value × factor) + offset
- Show a simple DBC signal entry:
```
SG_ SOC : 0|8@1+ (0.5,0) [0|100] "%" VCU
```
Means: signal "SOC", starts at bit 0, 8 bits long, Intel byte order, unsigned, factor 0.5, offset 0, range 0–100, unit %, receiver is VCU

- Tools: CANalyzer (professional), SavvyCAN (free, open-source), cantools (Python library)

### 11. CAN FD — When 8 Bytes Isn't Enough
- CAN FD (Flexible Data-rate) — ISO 11898-1:2015
- Upgrades: payload up to 64 bytes (vs 8), data phase bit rate up to 8 Mbps (vs 1 Mbps)
- The arbitration phase still runs at classical CAN speed (up to 1 Mbps) for backward compatibility in bus arbitration
- Bit rate switching: after arbitration, node switches to faster rate for data — hence "flexible data-rate"
- Why BMS needs it: transmitting 15 cell voltages (2 bytes each = 30 bytes) in one frame instead of 4 classical CAN frames
- Backward compatibility: CAN FD nodes on the same bus as classical CAN nodes — OK as long as FD frames are not transmitted when classical nodes are present (they would error frame)

### 12. Takeaways
- CAN's differential physical layer makes it inherently noise-immune — perfect for EV environments
- Non-destructive arbitration means high-priority safety messages always win the bus
- Error detection is layered and hardware-enforced — a broken node cannot silently corrupt data
- DBC files are the universal language for CAN signal interpretation
- Engineers: spend time on message ID assignment and timing budget — bus loading at >50% becomes problematic

---

## Experiment Ideas

### Experiment 1: Build a Two-Node CAN Bus
**Materials**: 2× Arduino Uno, 2× MCP2515 CAN controller module (with TJA1050 transceiver), 2× 120Ω resistors, jumper wires
**Procedure**:
1. Wire both MCP2515 boards to respective Arduinos (SPI)
2. Connect CAN_H to CAN_H, CAN_L to CAN_L, 120Ω termination at each end
3. Node A: transmit a CAN frame (ID 0x100) with 8 bytes of fake data every 100ms
4. Node B: receive and print any frames to serial monitor
5. Vary the transmit interval and observe: does communication remain stable?

**What to observe**: Successful communication, frame structure in raw hex. Try removing a termination resistor — observe increased error rates or communication failure.

### Experiment 2: Arbitration in Action
**Materials**: Same 2-node setup + logic analyzer on CAN bus
**Procedure**:
1. Program both nodes to transmit simultaneously (synchronized via a shared trigger)
2. Node A sends ID 0x100, Node B sends ID 0x200
3. Capture CAN bus on logic analyzer during the arbitration window
4. Observe: ID 0x100 always wins (lower ID = dominant in arbitration)

**What to observe**: On the logic analyzer, see both nodes start transmitting, then Node B stops at the bit where ID diverges. Node A's frame completes. Node B's frame starts after Node A finishes.

### Experiment 3: Decode a BMS CAN Frame with Python + DBC
**Materials**: CANable USB-to-CAN adapter (or Canable Pro), PC with Python, python-can, cantools, the 2-node setup from Exp 1
**Procedure**:
1. Write a minimal DBC file for Node A's message (ID 0x100, define 3 signals: SOC 8-bit, Voltage 16-bit, Current 16-bit)
2. Node A: pack fake SOC (75), Voltage (3700 → 370.0V), Current (100 → 10.0A) into the frame bytes
3. Python script: log frames from CANable, decode with cantools using the DBC, print engineering values
4. Vary Node A's values — observe live decoded changes in Python

**What to observe**: Full stack: raw CAN hex → DBC signal definitions → engineering values. Understand factor/offset encoding.

---

## Literature Review

### Core Textbooks
- **Corrigan, D. (TI)** — "Introduction to the Controller Area Network (CAN)" — Application Report SLOA101 — best accessible technical primer (free PDF)
- **Etschberger, K.** — *Controller Area Network: Basics, Protocols, Chips and Applications* (2001, IXXAT) — comprehensive reference
- **Zimmermann, W. & Schmidgall, R.** — *Bussysteme in der Fahrzeugtechnik* — (German; widely cited, covers CAN in automotive context thoroughly)

### Key Papers / Standards
- **ISO 11898-1:2015** — CAN data link layer and physical signaling
- **ISO 11898-2:2016** — CAN high-speed physical medium attachment
- **Bosch CAN Specification 2.0** (1991, publicly available PDF) — the original defining document; still the clearest technical reference for frame structure
- **ISO 11898-1:2015** Annex on CAN FD

### Online Resources
- **CSS Electronics** — "CAN Bus Explained: A Simple Intro" — best free illustrated CAN tutorial; also "CAN FD Explained"
- **SavvyCAN** documentation — open-source CAN log/replay/decode tool; free
- **python-can** and **cantools** Python library documentation — for CAN logging and DBC decoding
- **Vector Informatik** — "CAN Bus Topology and How to Design It" application notes
- **PEAK-System** — Application Note: CAN bus topology and termination
- **EV Hackers** — open-source DBC files for Nissan Leaf, Chevy Volt BMS — real-world BMS message examples

### Application Notes
- **Microchip MCP2515 datasheet** — SPI-to-CAN controller; standard in Arduino CAN projects; full register description
- **NXP TJA1050/TJA1051 datasheet** — CAN transceiver; explains physical layer signaling in detail
- **TI TCAN1042 datasheet** — automotive-grade CAN transceiver with fault protection
- **Bosch C_CAN / M_CAN IP Core documentation** — for engineers implementing CAN in microcontrollers (STM32, etc.)
