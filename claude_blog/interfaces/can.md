# CAN Bus — From Invention to BMS Implementation

*Prerequisites: [Communication Interface Overview](./communication-interface.md)*
*Next: [RS-485 / RS-232](./rs-485-232.md)*

---

## 1. The Wiring Harness Problem

Picture the electrical system of a 1980s car. The headlights need a wire. The horn needs a wire. The fuel gauge needs a wire. Maybe 20 signals total — a manageable tangle behind the dashboard.

Now picture a modern EV. The battery management system needs to report 96 individual cell voltages, 24 temperature readings, pack current, contactor states, fault conditions, and estimated SOC — just from one subsystem. The motor controller needs torque requests, speed feedback, and thermal limits. The charger, the HVAC, the instrument cluster, the vehicle control unit: each node is hungry for data, producing data, and making real-time decisions based on what other nodes tell it.

A modern EV carries upward of 2,000 distinct electrical signals. The naive approach — one copper wire per signal — produces a wiring harness that weighs hundreds of kilograms and costs more than the rest of the powertrain to manufacture. Engineers in the 1980s hit this wall first in conventional ICE vehicles. The solution: a shared communication bus. All electronic control units (ECUs) share two wires and take turns transmitting. One wire pair replaces hundreds of dedicated lines.

The Controller Area Network (CAN) was invented by Bosch in 1983 precisely for this problem. It now sits inside virtually every vehicle on the road, including every commercial EV. Your BMS uses it. Your motor controller uses it. Your charger uses it. Understanding CAN from the physical layer up is not optional for anyone designing, debugging, or integrating EV power electronics.

---

## 2. A Brief History

Bosch engineers began developing CAN in 1983. The specification was published and presented to the industry at the Society of Automotive Engineers conference in 1986. The first production vehicle to use CAN was the Mercedes-Benz W140 S-Class in 1991, where it connected the engine ECU and transmission controller. (Timeline sourced from Bosch Semiconductors CAN history page: bosch-semiconductors.com.)

The SAE and ISO quickly recognized the standard. ISO 11898 was published in 1993 covering the data link layer and physical signaling. ISO 11898-2 followed, specifying the high-speed physical medium attachment — the electrical layer that defines the cable, termination, and transceiver behavior most automotive engineers encounter daily.

Adoption spread rapidly beyond automotive. The CANopen application layer brought CAN into industrial automation, robotics, and medical devices. The protocol's simplicity and robustness made it attractive anywhere you needed multi-node communication in an electrically noisy environment.

In 2012, Bosch introduced CAN FD (Flexible Data-rate), ratified as ISO 11898-1:2015. CAN FD extends the payload from 8 bytes to 64 bytes and raises the data-phase bit rate to 8 Mbps while remaining compatible with the arbitration mechanism of classical CAN. Modern EVs increasingly use CAN FD for the high-bandwidth links between BMS and vehicle controller, where cell data density demands it.

---

## 3. Why Not Just Use UART or Ethernet?

This question comes up in every university embedded-systems course. The answer is not "CAN is better" — it is that CAN was designed for a specific set of constraints that UART and Ethernet do not address.

**UART** is a point-to-point protocol. You get two nodes, one transmit wire, one receive wire. If you have ten ECUs and each needs to talk to each other, you need a full mesh of UART links — at ten nodes that is 45 separate connections. There is no concept of a shared bus, no arbitration, no native error detection beyond optional parity. You cannot add an ECU by plugging into an existing bus.

**Ethernet** solves the multi-node problem but introduces others. Standard Ethernet (IEEE 802.3) was designed for office LANs where timing jitter of milliseconds is acceptable and the electrical environment is a shielded rack. An EV powertrain contains multi-kW motor drives switching at tens of kilohertz, DC-DC converters, and high-voltage contactors — all generating severe common-mode noise and electromagnetic interference. Standard Ethernet transceivers are not rated for this. More fundamentally, classic Ethernet uses CSMA/CD (Collision Detection): when two nodes transmit simultaneously, a collision is detected and both back off for a random interval. That random backoff means you cannot guarantee when a message will get through — unacceptable for a BMS sending a fault shutdown command.

**CAN** was designed for exactly this environment: multi-node bus, deterministic message priority, hardware error detection, designed-in immunity to automotive EMI, and operation across temperature and voltage ranges that UART and Ethernet transceivers never see. Every design choice in CAN — differential signaling, dominant/recessive logic, non-destructive arbitration — follows directly from the automotive operating environment.

Automotive Ethernet (BroadR-Reach, IEEE 100BASE-T1) is growing in EVs for camera and high-bandwidth sensor data, but CAN remains the backbone for real-time control messaging. The two protocols complement each other rather than compete.

---

## 4. Physical Layer — How the Signal Gets There

A CAN bus consists of exactly two wires: CAN_H (CAN High) and CAN_L (CAN Low). Every node on the bus connects to these same two wires. This is the entire physical bus.

The signal encoding is **differential**. What the receiver measures is not the absolute voltage on CAN_H or CAN_L but the difference between them, CAN_H minus CAN_L.

There are two logic states on a CAN bus:

- **Dominant (logic 0):** The transmitting node drives CAN_H to approximately 3.5 V and CAN_L to approximately 1.5 V. The differential voltage is approximately +2 V. Dominant is asserted by actively driving the bus.
- **Recessive (logic 1):** The transmitting node releases the bus. Both lines float to approximately 2.5 V through the termination resistors. The differential voltage is approximately 0 V. Recessive is the passive state.

The key insight for arbitration — covered in detail later — is that dominant overrides recessive on a wired-AND bus. If one node drives dominant and another simultaneously drives recessive, the bus reads dominant. This is intentional and forms the foundation of non-destructive arbitration.

**Why differential?** Electrical noise — from motor drive switching, ignition systems, or external RF — couples as a common-mode disturbance: it raises or lowers both CAN_H and CAN_L by the same amount simultaneously. When the receiver subtracts CAN_L from CAN_H, the common-mode noise cancels out. A 2 V noise spike on both wires leaves the differential signal unchanged. In an EV with a 400 V or 800 V high-voltage bus, high-current switching transients, and a motor generating substantial EMI, differential signaling is not optional — it is why CAN works where single-ended signals would fail.

**Termination** is 120 Ω placed at each physical end of the bus — not at each node, but at the two endpoints of the linear bus. The termination matches the characteristic impedance of the twisted-pair cable (~120 Ω), preventing signal reflections at the ends of the line.

Without termination, transmitted signals reflect off the unterminated ends and return down the bus out of phase. At 500 kbps these reflections arrive within a bit period and corrupt the signal — manifesting as intermittent communication errors that are difficult to trace without an oscilloscope. The single most common CAN wiring mistake in student projects and prototype systems is missing or misplaced termination resistors.

**Bus topology** must be linear — a daisy-chain from one end to the other, with short stubs branching off to individual nodes. Star topology (all nodes running long wires back to a central point) produces multiple reflection points and is not permitted under ISO 11898-2. Each stub should be kept as short as possible; ISO 11898-2 physical-layer guidance and common design practice cite a limit of approximately 0.3 m per stub at 1 Mbps.

**Bit rate** is fixed for a given network segment. Classical CAN supports up to 1 Mbps. Typical automotive choices are 250 kbps (body/comfort networks), 500 kbps (powertrain), and 1 Mbps (high-speed internal networks). The maximum bit rate decreases as bus length increases — as a commonly used design rule of thumb, practical bus length is approximately 40 m at 1 Mbps and approximately 500 m at 125 kbps; exact limits depend on cable characteristics and transceiver specifications.

---

## 5. Bit Encoding — NRZ and Bit Stuffing

CAN uses **NRZ (Non-Return-to-Zero)** encoding: the signal holds its level for the full duration of each bit without returning to a neutral state between bits. This is efficient — one bit period per bit, no extra transitions — but introduces a synchronization problem.

A receiver's clock must stay synchronized with the transmitter's clock to sample each bit at the right instant. NRZ provides a clock recovery edge only when the data changes state. A long run of identical bits — say, 8 consecutive dominant bits — gives the receiver no edges from which to resynchronize, and clock drift causes missampling.

**Bit stuffing** solves this. The CAN specification requires that after five consecutive bits of the same polarity, the transmitter automatically inserts one bit of the opposite polarity — a "stuff bit." The receiver knows this rule, detects the stuff bit, and discards it, reconstructing the original data transparently. The stuff bit also provides a clock recovery edge, resetting the receiver's synchronization.

This is guaranteed: you never see more than five consecutive same-polarity bits in normal CAN traffic (outside of CRC delimiter, ACK, and EOF fields which are excluded from stuffing). Any violation of this rule is itself used as an error signal — the bit stuffing error detection mechanism.

Bit stuffing adds overhead. In the worst case, the data portion of an 8-byte frame could accumulate additional stuff bits. This is why the maximum number of bits in a classical CAN frame is not simply the sum of fixed fields plus 64 data bits; it is longer when stuff bits are counted.

---

## 6. CAN Frame Structure — Anatomy of a Message

Every piece of data on a CAN bus is carried in a frame. The standard (11-bit ID) CAN data frame has this structure:

```
| SOF | Arbitration ID (11b) | RTR | IDE | r0 | DLC (4b) | Data (0-64 bytes) | CRC (15b) | ACK | EOF |
```

Walk through each field:

**SOF (Start of Frame):** A single dominant bit. All nodes on the bus use this edge to synchronize their bit timing. It is the clock recovery reference for the entire frame.

**Arbitration ID:** 11 bits in the standard frame format (CAN 2.0A), or 29 bits in the extended frame format (CAN 2.0B). This field carries two roles simultaneously: it identifies the message content (what signal this is), and it determines message priority. Lower numerical ID = higher priority on the bus. ID 0x001 will always beat ID 0x100 in arbitration. BMS designers exploit this directly: fault and shutdown messages get the lowest IDs.

**RTR (Remote Transmission Request):** When dominant (0), this is a data frame carrying payload bytes. When recessive (1), this is a remote frame — a node requesting that another node transmit a specific ID. Remote frames are rarely used in modern systems.

**IDE (Identifier Extension):** Dominant (0) signals a standard 11-bit frame. Recessive (1) signals an extended 29-bit frame. A standard frame controller that sees an extended frame ignores it gracefully.

**DLC (Data Length Code):** 4 bits encoding the number of data bytes that follow. Valid values are 0 through 8 for classical CAN. A DLC of 0 is legal — a zero-byte frame can carry meaning just through its ID, used as a heartbeat or event trigger.

**Data Field:** 0 to 8 bytes. This is the payload. The application layer determines how signals are packed into these bytes — the DBC file (covered below) is the definition of that packing.

**CRC (Cyclic Redundancy Check):** A 15-bit CRC computed over all preceding bits in the frame (from SOF through the last data byte). The generator polynomial is x^15 + x^14 + x^10 + x^8 + x^7 + x^4 + x^3 + 1. Any receiver that computes a different CRC than the one transmitted declares a CRC error. This single mechanism catches the vast majority of single and burst transmission errors.

**ACK Slot:** The transmitting node sends a recessive bit here. Any node that has successfully received the frame pulls this bit dominant. If the transmitter sees a dominant ACK slot, it knows at least one other node received the frame correctly. If no node acknowledges — the ACK slot stays recessive — the transmitter records a transmission failure and will attempt to retransmit.

**EOF (End of Frame):** Seven recessive bits mark the end of the frame. A dominant bit during EOF is a framing error.

---

## 7. Bus Arbitration — How Multiple Nodes Share the Bus

CAN uses **CSMA/CR (Carrier Sense Multiple Access with Collision Resolution)**, in contrast to Ethernet's CSMA/CD (Collision Detection). The difference is fundamental.

In Ethernet, if two nodes transmit simultaneously, their signals combine into electrical garbage — a collision is detected, both nodes abort, and both wait a random time before retrying. The collision destroys both frames. There is no guarantee of delivery within any bounded time, which is why Ethernet is non-deterministic.

In CAN, if two nodes transmit simultaneously, the arbitration mechanism resolves which one wins — and the winner's frame is never corrupted. Here is how:

Every node that wants to transmit waits for the bus to be idle (11 or more recessive bits), then begins transmitting its frame starting with SOF and then the arbitration ID. While transmitting, each node continuously reads the bus and compares what it transmitted to what it observes.

Recall that dominant (0) overrides recessive (1) on the bus. If Node A transmits a recessive bit during the arbitration ID but the bus reads dominant, it means another node simultaneously transmitted dominant at that bit position. Node A has lost arbitration. It immediately stops transmitting and transitions to receiver mode. It will retry when the bus is idle again.

The node that transmitted the lower-valued ID will have driven dominant bits at positions where other nodes drove recessive, winning bit by bit through the arbitration field. The winner never experiences any interruption — it simply transmits its frame to completion as though the bus were idle.

This is **non-destructive arbitration**: the winning frame is transmitted perfectly, no bits are wasted, and latency is bounded by the number of competing nodes and their IDs.

For BMS design, this is critical. Consider a scenario where the BMS is mid-transmission of a routine cell voltage report (ID 0x110) and simultaneously detects a cell overvoltage fault. The fault message (ID 0x100) will win arbitration against anything with a higher ID. Design your ID allocation table with this in mind — fault and safety messages at the lowest IDs, periodic diagnostic data at high IDs.

---

## 8. Error Detection and Fault Confinement

CAN implements five independent error detection mechanisms in hardware. A CAN controller does not require software to detect most errors — the controller silicon handles it.

**1. CRC Error:** The receiver recomputes the CRC over the received bits and compares against the transmitted CRC field. A mismatch flags a CRC error. This catches corrupted data bits with very high probability (undetected error probability less than 4.7 × 10^-11 for typical automotive error rates per the CAN specification).

**2. Frame Check:** Certain fields in the CAN frame have fixed, known values — the EOF sequence, the CRC delimiter, the ACK delimiter. If any of these fixed-format fields contains an unexpected value, the receiver flags a form error.

**3. Bit Monitoring:** Every transmitting node reads the bus while transmitting. If it transmits a recessive bit and reads back a dominant bit (outside the arbitration phase, where this is expected), it detects a bit error. This catches short circuits, hardware failures, and certain interference conditions.

**4. Bit Stuffing Check:** The receiver verifies the stuffing rule continuously. If more than five consecutive same-polarity bits appear in the stuffed portion of a frame, the receiver flags a stuffing error.

**5. ACK Check:** If the transmitter does not detect a dominant ACK bit in the ACK slot, it knows no receiving node acknowledged. This indicates either that all other nodes detected an error and chose not to acknowledge, or that no other nodes are present.

When any node detects an error, it transmits an **Error Frame**: six consecutive dominant bits, which deliberately violates the stuffing rule (more than five consecutive dominant bits). This destroys the frame in progress and signals all nodes on the bus to discard whatever they were receiving. All nodes increment their error counters.

**Fault confinement** prevents a single malfunctioning node from blocking the entire bus. Every CAN node maintains a Transmit Error Counter (TEC) and Receive Error Counter (REC). Each error increments the relevant counter; successful transmission or reception decrements it.

- **Error Active:** TEC and REC both below 128. Normal operation; the node may transmit Active Error Frames (6 dominant bits).
- **Error Passive:** TEC or REC exceeds 127. The node can still communicate but transmits Passive Error Frames (6 recessive bits, which are invisible to other nodes and do not disrupt the bus). It must also wait longer before retransmitting after a lost arbitration.
- **Bus Off:** TEC exceeds 255. The node disconnects itself from the bus entirely. It cannot transmit or receive until explicitly reset (after observing 128 × 11 recessive bits as required by the standard).

A BMS that enters Bus Off due to a fault in its CAN hardware will stop sending heartbeats. A well-designed vehicle controller interprets a missing BMS heartbeat as a critical failure and transitions to a safe state — a design pattern covered in the [Error Handling and Fault Reporting](../bms_concepts/error-handling-fault-reporting.md) post.

---

## 9. Message Design for BMS

Implementing CAN in a BMS is not just a firmware exercise — it is a systems design exercise. How you assign IDs and design message content determines whether the vehicle behaves correctly under fault conditions.

**ID allocation by priority.** Reserve the lowest IDs for the most critical messages. A typical BMS CAN message table:

| ID    | Name           | Period        | Content                                          |
|-------|----------------|---------------|--------------------------------------------------|
| 0x100 | BMS_Status     | 10 ms         | SOC, pack voltage, pack current, fault flags     |
| 0x101 | BMS_Limits     | 10 ms         | Max charge current, max discharge current, charge enable |
| 0x110 | BMS_CellData1  | 200 ms        | Cell voltages 1-4                                |
| 0x111 | BMS_CellData2  | 200 ms        | Cell voltages 5-8                                |
| 0x120 | BMS_Temp       | 200 ms        | Min/max cell temperature, average temperature    |
| 0x1FF | BMS_Heartbeat  | 10 ms         | Alive counter (increments each cycle)            |

The vehicle control unit (VCU) depends on BMS_Limits to know how much current it may command from the motor or push into the pack during regenerative braking. If the VCU misses this message, it must assume zero — a conservative fallback that prevents overcurrent events.

**Periodic vs event-driven transmission.** Status and limits transmit periodically regardless of changes. Fault messages should transmit event-driven the instant they are asserted, and then continue transmitting periodically (typically every 10 ms) until cleared — do not rely on the VCU receiving a single fault frame.

**Heartbeat.** The BMS_Heartbeat message carries a counter that increments every cycle. The VCU watches this counter: if it stops incrementing or the message disappears for more than a configurable timeout (typically 100 ms), the VCU declares BMS communication lost and initiates a controlled shutdown. This pattern — not a keepalive ping but an incrementing counter — is more robust than a simple alive bit because it detects a stuck firmware loop that sends the same value repeatedly.

**Signal packing.** Eight bytes is 64 bits. A 16-bit cell voltage with 1 mV resolution covers 0–65.535 V — more than adequate for lithium cells. Pack current at 0.1 A resolution in a 16-bit signed integer covers ±3276.7 A — enough for any EV. SOC at 0.5% resolution fits in 8 bits covering 0–127.5%. Thoughtful packing lets you fit four cell voltages and two temperatures into a single 8-byte frame.

For an overview of how CAN fits into the broader communication architecture of an EV — alongside LIN, FlexRay, and Automotive Ethernet — see the [Communication Interface Overview](./communication-interface.md) post. For the CAN nodes specific to EV systems and how each ECU role maps to bus traffic, see the [EV Nodes](../ev/ev-nodes.md) reference.

---

## 10. DBC Files — The Rosetta Stone for CAN

A raw CAN frame is a sequence of hex bytes. Without context, 0x4B 0x0E 0x00 0x00 0x00 0x00 0x00 0x00 is meaningless. The **DBC file (Database CAN)** is the definition layer that maps those bytes to engineering values.

A DBC file is a plain text file, typically with the extension .dbc, that defines every message and every signal on a CAN network. A CAN analysis tool loads the DBC and automatically decodes frames into labeled engineering values with correct units and scaling.

A signal definition specifies six things: start bit position within the frame, bit length, byte order (Intel little-endian or Motorola big-endian), whether the value is signed or unsigned, a scale factor, and an offset. The decoded engineering value is:

```
engineering_value = (raw_value × factor) + offset
```

A real signal definition from a BMS DBC file:

```
SG_ SOC : 0|8@1+ (0.5,0) [0|100] "%" VCU
```

Parsing this field by field:
- `SG_` — this is a signal definition
- `SOC` — signal name
- `0` — start bit: the signal begins at bit 0 of the data field
- `8` — bit length: the signal is 8 bits wide
- `@1` — byte order: Intel (little-endian), where bit 0 is LSB
- `+` — value type: unsigned
- `(0.5,0)` — factor 0.5, offset 0: raw value 150 decodes to 150 × 0.5 + 0 = 75.0%
- `[0|100]` — valid range: 0 to 100 (in engineering units, percent)
- `"%"` — unit string
- `VCU` — receiver node name: the Vehicle Control Unit is the intended consumer

So if the BMS transmits 0x96 (decimal 150) in the SOC byte, the VCU's CAN stack decodes it as 75.0% SOC.

A 16-bit cell voltage signal might look like:

```
SG_ Cell1_V : 8|16@1+ (0.001,0) [2.000|4.500] "V" BMS_Logger
```

Raw value 3700 (0x0E74) decodes to 3700 × 0.001 + 0 = 3.700 V. The 1 mV resolution and 2.000–4.500 V range cleanly represent any lithium cell.

**Tooling.** The professional standard is Vector CANalyzer, widely used in OEM development. For open-source work, SavvyCAN (cross-platform, Qt-based) provides a full CAN logging and DBC decoding environment at no cost. For Python scripting and automated analysis, the cantools library parses DBC files and decodes messages with a clean API. The python-can library handles the hardware interface layer (including CANable, PCAN, and SocketCAN adapters). Between these two Python libraries you have a complete CAN analysis stack running on a laptop with a $30 USB adapter.

---

## 11. CAN FD — When 8 Bytes Is Not Enough

The 8-byte payload limit of classical CAN was established in 1986 when the heaviest CAN traffic in a vehicle was a handful of engine sensor values. A modern EV BMS managing a 96-series pack needs to transmit 96 cell voltages, 24 temperatures, and pack-level data — at 8 bytes per frame, that is at least a dozen frames per refresh cycle, consuming significant bus bandwidth.

**CAN FD (Flexible Data-rate)**, ratified in ISO 11898-1:2015, addresses this. Two key changes from classical CAN:

First, the payload expands from 8 bytes to up to 64 bytes. Transmitting all 96 cell voltages in two or three CAN FD frames instead of 24 classical frames reduces bus loading substantially.

Second, the bit rate in the data phase can increase to 8 Mbps. The arbitration phase still runs at the classical CAN rate (typically 500 kbps or 1 Mbps) for backward compatibility with the arbitration mechanism, which requires all nodes to see the same bits simultaneously. After arbitration resolves and the winner begins its data phase, it switches to the higher bit rate. This is the "flexible data-rate" — the rate is not fixed for the entire frame.

The frame format adds a BRS (Bit Rate Switch) bit after the IDE field signaling the rate change, and an ESI (Error State Indicator) bit reflecting the transmitting node's error state. The CRC is also extended — CAN FD uses a 17-bit CRC for frames with 0–16 bytes of data and a 21-bit CRC for larger frames.

**Backward compatibility** is the primary integration concern. CAN FD frames and classical CAN nodes cannot coexist freely on the same physical bus segment: if a CAN FD node transmits a frame with the bit-rate-switch active, a classical-only node will misinterpret the BRS bit and flag a frame error, disrupting the bus. For CAN FD to work correctly, all nodes on a given segment must be CAN FD capable. In practice, EV powertrain networks are migrating entirely to CAN FD, keeping legacy classical CAN segments on isolated body network domains behind gateways.

---

## Experiments

### Experiment 1: Build a Two-Node CAN Bus

**Materials**
- 2x Arduino Uno or Nano
- 2x MCP2515 CAN controller module with TJA1050 transceiver (widely available as breakout boards)
- 2x 120 Ω resistors (1/4 W)
- Jumper wires and breadboard

**Procedure**
1. Wire each MCP2515 module to its Arduino over SPI: CS to pin 10, MOSI to pin 11, MISO to pin 12, SCK to pin 13, INT to pin 2. Connect 5 V and GND.
2. Connect the CAN_H pin of Node A's MCP2515 to the CAN_H pin of Node B's MCP2515. Repeat for CAN_L. This is your two-wire CAN bus.
3. Place a 120 Ω resistor between CAN_H and CAN_L at Node A's module. Place a second 120 Ω resistor at Node B's module. These are your bus terminations.
4. Using the MCP_CAN or arduino-CAN library, program Node A to transmit a CAN frame with ID 0x100, DLC 8, and eight bytes of arbitrary data (e.g., 0x01 through 0x08) every 100 ms.
5. Program Node B to listen for any incoming frames and print the ID, DLC, and data bytes to the serial monitor in hex.
6. Upload both sketches, open serial monitors on both ports, and verify Node B prints a new frame every 100 ms matching what Node A transmits.
7. Remove one of the 120 Ω termination resistors. Reduce the transmit interval to 1 ms and observe whether communication becomes intermittent or fails entirely.

**What to observe**
With both terminations in place at 100 ms interval, communication should be perfectly stable. At 1 ms interval without termination, you will likely see ACK errors (Node A's error LED on the MCP2515 may flash) or Node B will begin missing frames. This directly demonstrates how termination impedance matching prevents reflections at higher frame rates. If you have an oscilloscope, probe CAN_H and CAN_L with and without termination — the signal edges with missing termination show visible ringing after each transition.

---

### Experiment 2: Arbitration in Action

**Materials**
- Same two-node hardware setup from Experiment 1
- Logic analyzer with CAN decoding support (Saleae Logic or similar; a cheap 8-channel USB analyzer works at 500 kbps)

**Procedure**
1. Connect the logic analyzer's channel 0 to CAN_H and channel 1 to CAN_L. Connect logic analyzer ground to the CAN bus ground reference.
2. Configure the logic analyzer's CAN decoder for 500 kbps.
3. Modify Node A's firmware to transmit ID 0x100 continuously with minimal inter-frame gap. Modify Node B to transmit ID 0x200 with the same timing.
4. To force simultaneous transmission attempts, configure both nodes to start transmitting on a shared digital trigger line: connect a GPIO output on Node A to a GPIO input on both Arduinos, toggle it high, and have both sketches start transmission on the rising edge.
5. Capture 20–30 frames on the logic analyzer.
6. Examine the captured data: look for frames where both nodes attempted to transmit, identified by the alternating decoded IDs.

**What to observe**
In the logic analyzer capture, every successfully decoded frame should have ID 0x100 or ID 0x200, never a corrupted hybrid. You will observe that 0x100 frames appear more frequently than 0x200 frames during contention periods. If you zoom into the arbitration field at the bit level, you can see where the CAN_H/CAN_L differential voltage transitions from the combined transmissions to a clean single-transmitter signal — this is where Node B lost arbitration and stopped driving the bus. Node B's frames appear only after 0x100 frames complete, confirming non-destructive arbitration: Node A's frame was never disrupted.

---

### Experiment 3: Decode a BMS CAN Frame with Python and a DBC File

**Materials**
- CANable USB-to-CAN adapter (open-source hardware, approximately $20) or any SocketCAN-compatible adapter
- PC running Linux, macOS, or Windows with Python 3.8+
- python-can and cantools libraries (pip install python-can cantools)
- Node A Arduino from Experiment 1

**Procedure**
1. Create a minimal DBC file named bms_demo.dbc with the following content:

```
VERSION ""
NS_ :
BS_:
BU_: BMS VCU

BO_ 256 BMS_Status: 8 BMS
 SG_ SOC : 0|8@1+ (0.5,0) [0|100] "%" VCU
 SG_ PackVoltage : 8|16@1+ (0.1,0) [0|6500] "V" VCU
 SG_ PackCurrent : 24|16@1+ (0.1,-3276.8) [−3276.8|3276.7] "A" VCU
```

2. Modify Node A's firmware to pack specific values into the frame: SOC = 150 (raw, decodes to 75.0%), PackVoltage = 3700 (raw, decodes to 370.0 V), PackCurrent = 33068 (raw, decodes to 33068 × 0.1 − 3276.8 = 30.0 A). Transmit on ID 0x100 (256 decimal) every 500 ms.
3. Connect the CANable adapter to the CAN bus (CAN_H, CAN_L, GND). On Linux, bring up the SocketCAN interface: `sudo ip link set can0 up type can bitrate 500000`.
4. Write a Python script:

```python
import can
import cantools

db = cantools.database.load_file("bms_demo.dbc")
bus = can.interface.Bus(channel="can0", bustype="socketcan")

for msg in bus:
    try:
        decoded = db.decode_message(msg.arbitration_id, msg.data)
        print(f"ID 0x{msg.arbitration_id:03X} | Raw: {msg.data.hex()} | Decoded: {decoded}")
    except KeyError:
        pass
```

5. Run the script while Node A transmits. Observe the decoded output.
6. Change Node A's packed SOC value to 200 (raw = 100.0%). Observe the live change in the Python output without modifying the DBC or the Python script.

**What to observe**
You see the complete decoding pipeline: raw CAN hex bytes are transparently mapped to named engineering signals with correct units and scaling through the DBC definition. The same DBC file used in the Python script is the contract between BMS firmware, vehicle controller firmware, and any analysis tooling — change the DBC and all tools update simultaneously. Varying the raw values from Node A and watching the decoded outputs change confirms your understanding of the factor and offset encoding.

---

## Further Reading

Corrigan, S. (2008). Introduction to the Controller Area Network (CAN). Texas Instruments Application Report SLOA101B. Available from ti.com. The clearest short-form technical introduction to CAN from a hardware-oriented perspective.

Etschberger, K. (2001). Controller Area Network: Basics, Protocols, Chips and Applications. IXXAT Automation. The most complete single-volume treatment of CAN from physical layer through application profiles, written by one of the protocol's developers.

ISO 11898-1:2015. Road vehicles — Controller area network (CAN) — Part 1: Data link layer and physical signalling. International Organization for Standardization. The normative reference for the CAN protocol including CAN FD.

ISO 11898-2:2016. Road vehicles — Controller area network (CAN) — Part 2: High-speed medium access unit. International Organization for Standardization. Defines the electrical characteristics of the ISO 11898-2 physical layer, transceiver requirements, and cable specifications.

Robert Bosch GmbH (1991). CAN Specification Version 2.0. Bosch. Publicly available as a PDF. The original defining document covering both Part A (11-bit ID) and Part B (29-bit ID) frame formats.

CSS Electronics (2023). CAN Bus Explained: A Simple Intro. Available at csselectronics.com. The most accessible illustrated introduction to CAN available online; useful for rapidly building intuition before engaging with the ISO standard.

Microchip Technology (2010). MCP2515 Stand-Alone CAN Controller with SPI Interface Datasheet. DS20001801H. Available from microchip.com. Complete register-level reference for the most common hobbyist CAN controller; includes timing, filter, and mask configuration.

NXP Semiconductors (2019). TJA1050 High Speed CAN Transceiver Datasheet. Rev 5. Available from nxp.com. Defines the electrical characteristics of the transceiver layer: dominant/recessive voltage levels, slew rate control, and EMC performance data.

python-can Development Team (2024). python-can documentation. Available at python-can.readthedocs.io. Reference for the Python CAN hardware interface library supporting SocketCAN, PCAN, CANable, and other adapters.

cantools Development Team (2024). cantools documentation. Available at cantools.readthedocs.io. Reference for the Python DBC/KCD/SYM parsing and message decoding library.
