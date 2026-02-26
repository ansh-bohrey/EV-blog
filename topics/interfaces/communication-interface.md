# Communication Interface — Blog Plan

## Goal
Explain the different communication interfaces used in a BMS — from internal cell-monitoring communication to the vehicle CAN bus — and why each protocol is chosen for its role.

## Audience Angles
- **Engineers / students**: CAN frame structure, SPI/I2C for AFE daisy chains, DBC files, UDS protocol overview
- **EV enthusiasts**: "What is CAN bus?", how your EV's BMS talks to the dashboard and charger, what OBD-II actually reads

---

## Subtopic Flow

### 1. Hook — A BMS That Doesn't Talk is a Brick
- A BMS that silently measures cells but never communicates is useless in a vehicle
- It must report SOC to the dashboard, send current limits to the motor controller, receive charge commands from the charger, and stream diagnostics to a laptop
- Each of these conversations uses a different protocol optimized for its role

### 2. The Communication Layers in a BMS
Visual: Show a block diagram — cells → AFE → BMS microcontroller → vehicle CAN bus → VCU / dashboard / charger
- **Layer 1 (Internal, chip-to-chip)**: AFE to BMS MCU — SPI or I2C
- **Layer 2 (Vehicle bus)**: BMS to other ECUs — CAN bus (dominant)
- **Layer 3 (Diagnostics)**: BMS to service tool — UDS over CAN, or UART/USB
- **Layer 4 (Charger communication)**: CAN, CHAdeMO, CCS PLC

### 3. SPI / I2C — Internal Communication (AFE to MCU)
- **Why SPI**: fast, full-duplex, simple — AFE chips like TI BQ76940 or Analog Devices LTC6804 use SPI
- **Why I2C**: fewer wires, addressable — some simpler AFE chips use I2C; easier for prototyping
- **Daisy-chain SPI** (e.g., LTC6804 isoSPI): allows many AFE chips on a single isolated bus; essential for high-voltage stacks where each module needs galvanic isolation
- Clock speeds: SPI at 1–4 MHz typical for AFE
- Message structure in AFE context: command byte → register address → data bytes → CRC
- Isolation: SPI signals must be galvanically isolated between HV modules and low-voltage MCU (optocouplers or digital isolators)

### 4. CAN Bus — The Vehicle Backbone
- **Why CAN**: designed for automotive environments — electrically robust (differential signaling), multi-master, error detection built-in
- Developed by Bosch 1986; now in virtually every vehicle including EVs, e-bikes, and energy storage
- Physical layer: two wires (CAN_H, CAN_L), 120Ω termination at each end, 1 Mbps max (classical CAN)
- Frame structure: arbitration ID (11-bit standard or 29-bit extended) + data (up to 8 bytes) + CRC
- Message arbitration: lower ID wins — critical messages (safety, faults) get low IDs
- Error detection: bit stuffing, CRC, ACK — CAN is inherently fault-tolerant to single-node failures
- Introduce CAN FD: up to 64 bytes payload, up to 8 Mbps — for data-heavy BMS messages

### 5. What the BMS Sends on CAN
Typical BMS CAN message set:
- **Status message** (10–100ms): SOC, SOH, pack voltage, pack current, temperatures, fault flags
- **Cell data message** (100–1000ms): individual cell voltages, min/max cell, delta voltage
- **Limits message** (10–100ms): max charge current, max discharge current, charge enable, discharge enable
- **Fault message** (event-driven): fault codes, severity, active fault bitmask
- **Heartbeat** (10ms): alive signal — if missing, other ECUs treat BMS as failed

Show a sample DBC snippet for the status message. Explain signal encoding (factor, offset, min, max, units).

### 6. DBC Files — Decoding CAN
- DBC (Database CAN) files define all messages and signals on a bus
- Enable any CAN analyzer (CANalyzer, SavvyCAN, Python-can) to decode raw hex into engineering values
- Explain the signal entry structure: start bit, length, byte order, factor, offset, unit
- Show a simple Python-can + cantools snippet to parse a BMS status message

### 7. UDS — Diagnostic Communication
- **Unified Diagnostic Services** (ISO 14229) — the protocol used by service tools to talk to ECUs
- Key services relevant to BMS: Read Data By Identifier (0x22) → read SOH, cell voltages, firmware version; Read DTC Information (0x19); Clear DTC (0x14); Control DTC Setting
- OBD-II Mode 06/09 vs proprietary UDS: OBD-II is standardized for emissions; UDS is proprietary per OEM
- Used by EV dealerships and third-party diagnostic tools (like Torque Pro + EVCAN plugins)

### 8. Charger Communication
- **J1772 pilot signal**: analog/PWM signal in the connector; tells BMS the EVSE's maximum current capability
- **CHAdeMO**: uses CAN to negotiate charge parameters between vehicle and DC fast charger
- **CCS (Combined Charging System)**: uses PLC (Power Line Communication, ISO 15118) for V2G and smart charging
- Brief mention of ISO 15118 — vehicle-to-grid, smart charging scheduling over Ethernet/PLC
- For BMS engineers: understand which standard your vehicle uses and what messages the BMS must send/receive

### 9. UART / USB for Development
- During development and debugging: UART serial for log output, UART bootloader for firmware flashing
- USB CDC (virtual serial port) common for laptop-connected BMS diagnostics
- Python scripts as lightweight test tools — log CAN frames, send commands, visualize cell voltages

### 10. Takeaways
- Different protocols for different purposes: SPI for speed and accuracy at the chip level; CAN for robustness at the vehicle level; UDS for diagnostics
- Understanding CAN bus opens up the ability to monitor, log, and even extend BMS functionality
- A well-designed communication architecture is as important as the estimation algorithms

---

## Experiment Ideas

### Experiment 1: Read an AFE Over SPI
**Materials**: Arduino Uno, BQ76920 or LTC6804 evaluation board (or breakout), test cells, oscilloscope (optional)
**Procedure**:
1. Wire AFE to Arduino over SPI (MOSI, MISO, SCK, CS)
2. Write Arduino code to send read cell voltage command, receive response
3. Parse and display individual cell voltages over serial
4. Verify accuracy against DMM

**What to observe**: SPI transaction structure on oscilloscope. AFE register map understanding. Cell voltage accuracy.

### Experiment 2: Transmit BMS Status on CAN Bus
**Materials**: Arduino + MCP2515 CAN shield, second Arduino + MCP2515 (or CAN analyzer / SavvyCAN on PC)
**Procedure**:
1. Node A (BMS sim): transmit a CAN frame at 100ms interval with fake SOC, pack voltage, fault bits
2. Decode with SavvyCAN or second Arduino using a simple DBC definition
3. Change a fake fault bit — observe it appear on the listener

**What to observe**: CAN arbitration, message timing, DBC-based signal decoding. Show raw hex vs decoded values.

### Experiment 3: Build a Simple DBC File and Use Python-CAN
**Materials**: PC with Python, python-can and cantools libraries, CAN adapter (CANable, Canable Pro, etc.)
**Procedure**:
1. Write a minimal DBC file defining one BMS status message
2. Log live CAN frames from Experiment 2 setup
3. Use cantools to decode logged frames against the DBC
4. Plot SOC and pack voltage over time using matplotlib

**What to observe**: The full stack from CAN frame to plotted engineering data — as done in professional BMS development.

---

## Literature Review

### Core Textbooks
- **Corrigan, D. & Bhatt, M.** — TI Application Report "Introduction to the Controller Area Network (CAN)" (SLOA101) — best accessible CAN primer
- **Zimmermann, W. & Schmidgall, R.** — *Bussysteme in der Fahrzeugtechnik* (German, but widely cited in automotive networking)
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* — communication chapter

### Key References / Standards
- **ISO 11898-1** — CAN data link layer specification
- **ISO 11898-2** — CAN physical layer specification
- **ISO 14229** — UDS (Unified Diagnostic Services)
- **SAE J1939** — Heavy vehicle CAN standard (relevant for electric trucks/buses)
- **CHAdeMO 1.2/2.0 specification** — CAN-based DC fast charge protocol
- **ISO 15118** — V2G and smart charging communication

### Online Resources
- CSS Electronics — "CAN Bus Explained: A Simple Introduction" — best free CAN tutorial with visuals
- SavvyCAN documentation — open-source CAN analyzer tool
- Python-can + cantools documentation — for scripted CAN analysis
- EVTV Motor Werks — CAN sniffer tutorials for DIY EV builders
- EV Hackers — open-source DBC files for popular EVs (Nissan Leaf, Chevy Volt BMS)

### Application Notes
- TI BQ76940 SPI communication application note
- Analog Devices LTC6804 — isoSPI daisy-chain application note (very detailed, includes timing diagrams)
- Microchip MCP2515 datasheet — SPI to CAN controller; standard in Arduino CAN projects
