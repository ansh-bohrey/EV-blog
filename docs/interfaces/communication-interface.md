# Communication Interface: How a BMS Talks to the Rest of the Vehicle

*Prerequisites: [CAN Bus Deep Dive →](./can.md), [Analog Front-End (AFE) →](../bms_concepts/analog-front-end-afe.md)*
*Next: [CAN Bus Deep Dive →](./can.md)*

---

## A BMS That Does Not Talk is a Brick

Imagine a BMS that measures every cell voltage to the nearest millivolt, tracks temperature across eight zones, and runs a tight Kalman filter for SOC — but never tells anyone. The dashboard shows nothing. The motor controller has no current limit to respect. The charger keeps pushing current with no idea whether the pack is full or overheating. That BMS is worse than useless; it is a liability.

A functional BMS is a networked device. Every 100 milliseconds it is broadcasting state-of-charge to the instrument cluster, sending discharge current limits to the inverter, receiving charge-enable commands from the onboard charger, and fielding diagnostic queries from a service laptop. Each of those conversations happens over a different protocol, chosen because it is the best fit for that particular role — bandwidth, noise immunity, physical distance, number of nodes, and legacy compatibility all vary by task.

This post maps every communication layer in a typical BMS stack, from the SPI bus that connects a cell-monitoring IC to its host microcontroller, all the way to the PLC-based protocol that enables vehicle-to-grid charging. Understanding this stack is what turns a component-level BMS understanding into the ability to actually deploy, debug, and extend a real system.

---

## Communication Layers in a BMS

Think of BMS communication as four concentric shells, each with different requirements.

**Layer 1 — Internal chip-to-chip (AFE to BMS MCU):** This is the innermost shell. The Analog Front-End IC — a device like the TI BQ76940 or Analog Devices LTC6804 — sits directly on or near the battery module. It measures cell voltages and temperatures, then ships those readings to the BMS microcontroller over SPI or I2C. The distances are centimeters to tens of centimeters. Speed and noise immunity matter; the HV-to-LV isolation boundary sits right here.

**Layer 2 — Vehicle bus (BMS MCU to other ECUs):** The BMS MCU presents itself to the vehicle as just another node on the CAN bus. The Vehicle Control Unit (VCU), motor controller, onboard charger, instrument cluster, and thermal management controller all share this bus. CAN dominates here because automotive engineers have trusted it since the 1990s: it handles multi-master arbitration, detects errors aggressively, and works reliably in the EMI environment of an EV drivetrain.

**Layer 3 — Diagnostic communication (BMS to service tool):** When a technician plugs in a scan tool or an engineer connects a laptop, the BMS exposes diagnostic services over UDS (Unified Diagnostic Services, ISO 14229). This typically rides on top of CAN using a dedicated diagnostic CAN ID, though some systems use UART or USB directly on the BMS module.

**Layer 4 — Charger communication:** This layer varies by charging standard. A J1772 AC charger uses a simple PWM signal on a single wire to declare its current capability. CHAdeMO DC fast charging uses its own CAN channel. CCS (Combined Charging System) uses Power Line Communication (PLC, ISO 15118) for high-level negotiation including V2G and smart charging scheduling.

```
Cells
  |
  v
[AFE] ---SPI/isoSPI---> [BMS MCU]
                              |
                    ----------+-----------
                    |         |          |
                  [CAN]    [UART/USB]  [CCS PLC]
                    |         |
              Vehicle bus   Laptop /
              VCU, Motor,   Service tool
              Charger, Dash
```

Each layer is addressed in turn below. The AFE hardware is covered in [Analog Front-End (AFE) →](../bms_concepts/analog-front-end-afe.md). This post focuses on the system-level picture and the interfaces you need to understand to work with any BMS. The RS-485 and Modbus interfaces used in rack-level BMS and industrial chargers are covered in [RS-485 / RS-232 →](./rs-485-232.md).

---

## SPI and I2C — Internal Communication (AFE to MCU)

### Why SPI

SPI (Serial Peripheral Interface) is the dominant choice for AFE-to-MCU communication in many high-performance designs because it is fast, full-duplex, and architecturally simple. A standard SPI transaction uses four signals: SCLK (clock from master), MOSI (master out, slave in), MISO (master in, slave out), and CS (chip select, active low). The master drives the clock; both sides transfer bits simultaneously on every clock edge. There is no addressing overhead — the chip select line selects the target device. AFEs like the Analog Devices LTC6804 and LTC6811 use SPI (or the isolated isoSPI variant) for this reason.

### Why I2C

I2C (Inter-Integrated Circuit) uses only two wires — SDA (data) and SCL (clock) — with a 7-bit addressing scheme that allows multiple devices on the same bus. The **TI BQ76920 and BQ76940** both use **I2C**, not SPI. This is a common source of confusion because SPI is more widely used in the AFE space, but the BQ769x0 family is explicitly I2C-based (confirmed on the TI product pages for both devices). The tradeoff vs SPI: lower pin count and simpler routing, but lower speed (standard 100 kHz, fast 400 kHz) and open-drain signaling that requires pull-up resistors on SDA and SCL.

A typical I2C read transaction to retrieve a cell voltage register from the BQ76920 (default I2C address 0x08):

```
Master → [0x08 + W] [register_address]   ← set register pointer
Master → [0x08 + R]                       ← repeated start, switch to read
Slave  → [data_hi] [data_lo]              ← two bytes returned, MSB first
```

In Arduino code using the Wire library:
```cpp
Wire.beginTransmission(0x08);   // BQ76920 I2C address
Wire.write(0x0C);               // VC1_HI register
Wire.endTransmission(false);    // repeated start
Wire.requestFrom(0x08, 2);
uint8_t hi = Wire.read();
uint8_t lo = Wire.read();
// Assemble 14-bit result, multiply by 382 µV/LSB to get cell voltage
int16_t raw = ((hi & 0x3F) << 8) | lo;
float voltage_V = raw * 0.000382f;
```

The BQ76920 returns 14-bit ADC results in two bytes. The MCU assembles the bytes into a raw ADC count and multiplies by 382 µV/bit to get the cell voltage.

### isoSPI — Daisy-Chaining AFEs on an Isolated Bus

For high-voltage battery packs with many series modules, running a separate SPI connection to each AFE is impractical. Analog Devices' LTC6804 and LTC6811 solve this with isoSPI, a scheme that converts standard SPI into a differential pulse-based signal that can be daisy-chained through capacitive isolators.

In a daisy-chain configuration, the BMS MCU's SPI master connects to the first AFE module. That module's isoSPI output connects to the next module, and so on down the stack. The MCU addresses each chip with a broadcast or individual address field in the command; each chip forwards the signal downstream. This single isolated bus can span the entire HV stack — 400V, 800V — while only the two ends require isolation transformers. isoSPI handles the isolation with pulse transformers integrated into the chip. Other designs use dedicated digital isolators (TI ISO7241, Analog Devices ADuM series) on standard SPI lines.

The isolation requirement is non-negotiable. AFE chips sitting on cell groups in the middle of a 400V stack have their signal-ground pins at potentially 200V above chassis ground. Connecting those SPI lines directly to a low-side BMS MCU would destroy the microcontroller and create a shock hazard.

---

## CAN Bus — The Vehicle Backbone

The Controller Area Network was developed by Bosch in the early 1980s specifically for automotive use, and it shows. The protocol is engineered around the assumption that wires are long, the environment is electrically hostile, multiple nodes need to talk, and the network cannot have a single point of failure.

### Physical Layer

CAN uses differential signaling on two wires: CAN_H and CAN_L. The signal is the voltage difference between them, not the voltage on either wire relative to ground. A dominant bit (logic 0) drives CAN_H to approximately 3.5V and CAN_L to approximately 1.5V — a 2V differential. A recessive bit (logic 1) lets both lines float to approximately 2.5V, a near-zero differential. Noise that couples onto both wires equally cancels out in the difference.

The bus is terminated at each physical end with 120 ohm resistors between CAN_H and CAN_L. This matches the characteristic impedance of the twisted-pair cable and prevents signal reflections at high bit rates. Missing termination is among the most common causes of CAN reliability issues on first builds.

### Frame Structure

A Classical CAN data frame contains:

- **Start of Frame (SOF):** 1 dominant bit, synchronizes all nodes
- **Arbitration field:** 11-bit (standard) or 29-bit (extended) message identifier
- **Control field:** 6 bits including the Data Length Code (DLC, 0–8 bytes)
- **Data field:** 0–8 bytes of payload
- **CRC field:** 15-bit cyclic redundancy check plus delimiter
- **ACK field:** any receiving node drives this dominant to acknowledge receipt
- **End of Frame:** 7 recessive bits

The CAN controller handles framing in hardware. From firmware, you write data bytes into a transmit buffer and set the arbitration ID and DLC; the controller serializes and transmits the frame with no further intervention.

### Message Arbitration

CAN is a multi-master bus — any node can transmit when the bus is idle. When two nodes start simultaneously, bitwise arbitration resolves the collision without destroying either message. Each transmitting node monitors the bus as it drives. When a node transmitting a recessive bit (1) detects a dominant bit (0) driven by another node, it backs off immediately. The node with the numerically lower ID always wins — which is why safety-critical messages are assigned low IDs by convention.

### Error Detection

CAN includes five error-detection mechanisms: bit monitoring (transmitter checks what it drove back from the bus), bit stuffing violations (after five consecutive same-polarity bits, an opposite-polarity stuff bit must follow), CRC mismatch, frame format violations, and missing ACK. A node that accumulates errors enters progressively restricted error states; a node with severe errors enters Bus-Off and disconnects, protecting the rest of the bus.

### CAN FD

Classical CAN caps at 8 bytes payload and 1 Mbps. CAN FD (Flexible Data-rate) extends payload to 64 bytes and bit rate to 8 Mbps in the data phase, while remaining backward-compatible in the arbitration phase. Modern BMS designs for high-end EVs increasingly use CAN FD for telemetry-dense applications where streaming all cell voltages in a single frame becomes practical.

---

## What the BMS Sends on CAN

A production BMS typically publishes four to six message types, each at a cycle rate matched to how fast the recipient needs the data.

**Status message (10–100 ms):** Pack-level overview — SOC (%), SOH (%), pack voltage (V), pack current (A), max and min cell temperatures, fault flags bitmask, system state (idle / charging / discharging / fault).

**Cell data message (100–1000 ms):** Individual cell voltages for all N cells, minimum and maximum cell voltage, delta voltage (max minus min). For large packs this message may span multiple CAN IDs.

**Limits message (10–100 ms):** Maximum continuous charge current (A), maximum continuous discharge current (A), peak discharge current (A, with associated time limit), charge enable flag, discharge enable flag. The motor controller and charger subscribe to this message.

**Fault message (event-driven):** Transmitted immediately when a fault occurs or clears. Contains fault code, severity (warning / recoverable / critical), fault source (cell index, temperature zone), and time since onset.

**Heartbeat (10 ms):** A single-byte or two-byte message, often just a rolling counter. If the VCU stops receiving heartbeats within a configured timeout, it treats the BMS as failed and limits or cuts power. This is the simplest and most critical liveness signal.

A minimal DBC snippet for the status message:

```
BO_ 100 BMS_Status: 8 BMS
 SG_ SOC        : 0|8@1+  (0.5,0)    [0|100]      "%"    VCU,Dashboard
 SG_ PackVoltage: 8|16@1+ (0.1,0)    [0|6000]     "V"    VCU,Motor
 SG_ PackCurrent: 24|16@1-(0.1,0)    [-3200|3200] "A"    VCU,Motor
 SG_ MaxCellTemp: 40|8@1+ (1,-40)    [-40|85]     "degC" VCU,ThermalMgr
 SG_ FaultFlags : 48|16@1+(1,0)      [0|65535]    ""     VCU,Dashboard
```

Reading the SOC signal definition: start bit 0, length 8 bits, little-endian (`@1`), unsigned (`+`), scale 0.5, offset 0. A raw byte value of 190 decodes to SOC = 190 × 0.5 = 95.0%. The arbitration ID 100 decimal (0x064) is low enough that the BMS status message wins arbitration over most non-safety messages on a typical vehicle bus.

---

## DBC Files — Decoding CAN

A DBC file is a text file that describes every message and signal on a CAN bus: arbitration IDs, signal bit positions, byte order, scale factors, offsets, units, and which nodes transmit and receive each message. DBC files are the lingua franca of automotive CAN analysis — every major CAN tool reads them.

The `cantools` Python library parses DBC files and decodes raw CAN frames into engineering values. Combined with `python-can` for bus access, this gives you a complete logging and analysis stack in fewer than 20 lines:

```python
import can
import cantools

db = cantools.database.load_file('bms.dbc')
bus = can.interface.Bus(channel='can0', bustype='socketcan')

for msg in bus:
    try:
        decoded = db.decode_message(msg.arbitration_id, msg.data)
        print(f"{msg.timestamp:.3f}  {decoded}")
    except cantools.database.errors.DecodeError:
        pass
```

This opens a SocketCAN interface on Linux, loads the DBC, and prints every decoded BMS message as a Python dictionary of signal names to physical values. Swap `bustype='socketcan'` for `bustype='slcan'` to use a USB-to-CAN adapter like the CANable. SavvyCAN is a cross-platform GUI alternative: import the DBC, connect to a CAN adapter, and see decoded signals in real time with built-in graphing.

---

## UDS — Diagnostic Communication

Unified Diagnostic Services (ISO 14229) is the protocol used by professional scan tools to interrogate ECUs. A technician connects a J2534 PassThru interface to the OBD-II port; the scan tool communicates with the BMS over a dedicated diagnostic CAN ID. IDs 0x7E2 (request) and 0x7EA (response) are commonly cited examples for BMS, but diagnostic IDs are OEM-defined and vary by vehicle — always consult the vehicle's DBC or OEM documentation.

Key UDS services relevant to BMS diagnosis:

- **Service 0x22 — Read Data By Identifier (RDBI):** Read any parameter by a two-byte Data Identifier. DID 0xF190 might return the BMS firmware version; DID 0xF401 might return SOC and SOH as a packed structure.
- **Service 0x19 — Read DTC Information:** Retrieve all stored diagnostic trouble codes, their status (active / pending / confirmed / stored), and freeze-frame data captured at fault onset.
- **Service 0x14 — Clear DTC Information:** Clear all stored DTCs after repair.
- **Service 0x2E — Write Data By Identifier:** Write configuration parameters, only allowed in an unlocked extended diagnostic session.
- **Service 0x27 — Security Access:** Challenge-response authentication before writing — prevents unauthorized ECU configuration changes in the field.

OBD-II Mode 06 and Mode 09 expose a standardized subset of these services to generic scan tools. Proprietary DID ranges (0xF400 and above) give OEMs access to deeper BMS data not exposed through standardized modes.

---

## Charger Communication

When the vehicle plugs in, a negotiation layer separate from the main vehicle CAN determines how much power can flow.

**J1772 (AC charging):** The pilot pin in the J1772 connector carries a 1 kHz PWM signal from the EVSE to the vehicle. Per SAE J1772, the duty cycle encodes the EVSE's available current: 10%–85% duty cycle maps to approximately 6–51 A capability. The vehicle's onboard charger reads this duty cycle and limits charge current accordingly. Deliberately simple — no CAN, no PLC, just a PWM signal and two threshold comparators.

**CHAdeMO (DC fast charging):** CHAdeMO uses a dedicated CAN bus, separate from the vehicle CAN, to establish communication between the DC charger and the vehicle BMS. The vehicle sends target charge voltage, target current, and maximum current to the charger; the charger sends actual output voltage and current back. The BMS controls the entire charge session through this CAN exchange, commanding charge stop when SOC, voltage, or temperature limits are reached.

**CCS and ISO 15118 (DC fast charging + V2G):** CCS uses Power Line Communication layered over the pilot pin. The protocol stack is ISO 15118, which supports charge parameter negotiation, Vehicle-to-Grid energy export, smart charging schedules, and authentication. For the BMS engineer, CCS means adding a PLC modem to the BMS or charge port controller and implementing a substantial software stack on top of it.

---

## UART and USB — Development and Debug

During firmware development, UART is the BMS engineer's closest ally. Every MCU with a UART peripheral can stream human-readable log output at 115200 bps over a USB-to-UART adapter (FTDI FT232, CH340G, CP2102) to a laptop terminal. The cost is under $2 for the adapter and two GPIO pins on the MCU.

A structured debug log from a BMS looks like:

```
[00:01:23.456] SOC=78.5% V=394.2V I=-12.3A Tmax=31C Tmin=28C
[00:01:23.556] Cells: 3.912 3.915 3.911 3.918 3.909 3.914 (V)
[00:01:23.656] FAULT: Cell 4 overvoltage 3.985V > threshold 3.980V
```

Timestamps, units, and fault context in every line make post-mortem debugging tractable. The UART bootloader supported by most ARM Cortex-M MCUs (STM32 system bootloader, for example) also lets you flash firmware over the same port without a dedicated programmer — important for field updates. USB CDC (USB Communication Device Class) creates a virtual serial port on the laptop side, combining the log stream and command interface behind a single USB connector.

---

## Protocol Selection Summary

| Requirement | Protocol |
|---|---|
| Read cell voltages from AFE chip | I2C (BQ769x0) or SPI/isoSPI (LTC6804/6811) |
| Report SOC to instrument cluster | CAN |
| Send current limits to motor controller | CAN |
| Retrieve fault codes with scan tool | UDS over CAN |
| AC charge current negotiation | J1772 PWM |
| DC fast charge (CHAdeMO) | CHAdeMO CAN |
| DC fast charge + V2G | CCS ISO 15118 PLC |
| Development log output | UART / USB CDC |
| Firmware update in field | UART bootloader or CAN bootloader |
| Rack-level BMS network, long distances | RS-485 / Modbus RTU |

Different protocols for different purposes is not complexity for its own sake — it reflects real constraints on each interface. SPI is fast and simple but inherently short-range and point-to-point. CAN handles the multi-node vehicle bus. UDS provides structured authenticated access for diagnostics. J1772 is deliberately simple so any car can use any charger regardless of manufacturer. Understanding which protocol to reach for, and why, is the mark of a BMS system engineer rather than just a firmware developer.

---

## Experiments

### Experiment 1: Read an AFE Over SPI

**Materials**

- Arduino Uno or Nano
- TI BQ76920 evaluation board or LTC6804 breakout board
- 2–4 series-connected 18650 cells (charged to at least 3.0V each)
- Jumper wires
- Oscilloscope (optional but highly recommended)
- Digital multimeter

**Procedure**

1. Wire the I2C connections: Arduino A4 (SDA) to BQ76920 SDA, Arduino A5 (SCL) to BQ76920 SCL. Place 4.7 kΩ pull-up resistors from SDA to 3.3 V and SCL to 3.3 V. Connect GND to GND. Connect BQ76920 VCC to 3.3 V and wire REGSRC as specified in the datasheet's application schematic. The BQ76920 default I2C address is 0x08 (confirmed in the TI BQ76920 datasheet).
2. Include the Arduino Wire library. Call `Wire.begin()` in setup. Send the BQ76920 wake command: write 0x00 to register 0x00 via I2C to transition the chip from boot to normal mode.
3. Read VC1_HI (0x0C) and VC1_LO (0x0D): call `Wire.beginTransmission(0x08)`, write the register address, call `Wire.endTransmission(false)` (repeated start), then `Wire.requestFrom(0x08, 2)` and read two bytes. Assemble into a 14-bit raw value; multiply by 382 µV/bit to get cell 1 voltage.
4. Repeat for VC2, VC3, VC4 using the appropriate register addresses from the BQ76920 datasheet.
5. Print all cell voltages to Serial at 115200 bps. Compare each printed value to a DMM measurement across the corresponding cell terminals.
6. If you have a logic analyzer: probe SDA and SCL. Decode the I2C transaction — you should see the address byte (0x08 + R/W bit), register address, then the two data bytes with ACK bits between each.

**What to observe**
On the logic analyzer, an I2C start condition (SDA falling while SCL high) is followed by the address byte, register address, repeated start, and data bytes. Cell voltage readings should match the DMM within a few millivolts. Any larger discrepancy usually indicates a pull-up resistor issue, incorrect I2C address, or a missing decoupling capacitor on the AFE power supply.

---

### Experiment 2: Transmit BMS Status on CAN Bus

**Materials**

- 2× Arduino Uno (or one Arduino plus a USB-CAN adapter such as CANable and SavvyCAN on a laptop)
- 2× MCP2515 CAN controller module with TJA1050 transceiver
- 2× 120 ohm resistors (if MCP2515 modules do not include onboard termination)
- Jumper wires (3-wire: CAN_H, CAN_L, GND between nodes)

**Procedure**

1. Wire each MCP2515 module to its Arduino over SPI (SCK, MOSI, MISO, CS). Connect CAN_H to CAN_H and CAN_L to CAN_L between the two modules using a twisted pair or parallel wires. Place a 120 ohm resistor between CAN_H and CAN_L at each node.
2. On Node A (transmitter): initialize MCP2515 at 500 kbps. Every 100 ms, assemble an 8-byte buffer and transmit with arbitration ID 0x064. Encode: Byte 0 = SOC as integer (value × 2 to fit 0–200 in one byte), Bytes 1–2 = pack voltage in mV as uint16 big-endian, Bytes 3–4 = pack current in units of 100 mA as int16, Byte 5 = max temperature as uint8 with -40 offset, Bytes 6–7 = fault flags as uint16.
3. On Node B (receiver): print each received frame's arbitration ID and data bytes in hex to Serial at 115200 bps. Manually decode Byte 0 to SOC percentage.
4. Write a minimal DBC file matching your encoding. Import into SavvyCAN to verify automatic decoding of all signals.
5. Add a pushbutton to Node A. When pressed, set bit 0 of FaultFlags and confirm it appears on Node B or SavvyCAN within one 100 ms cycle.

**What to observe**
SavvyCAN's DBC-decoded view shows labeled engineering values updating at 10 Hz. Press the fault button and watch FaultFlags flip. Note the consistent 100 ms spacing between frames in the message trace. Temporarily remove one 120 ohm termination resistor and observe whether the bus still operates — at 500 kbps over short wires it likely will, but try increasing cable length and the effect of missing termination becomes apparent.

---

### Experiment 3: Build a DBC File and Decode with Python-CAN

**Materials**

- PC with Python 3.8 or later
- Libraries: `pip install python-can cantools matplotlib`
- CANable or equivalent slcan-compatible USB-CAN adapter connected to the Node A CAN bus from Experiment 2
- Text editor

**Procedure**

1. Write a minimal DBC file named `bms.dbc`. It needs one message block for BMS_Status with arbitration ID 100, and five signal definitions matching your Experiment 2 encoding. Pay careful attention to start bit, length, byte order (@1 for little-endian, @0 for big-endian), signed/unsigned, scale, offset, and unit.
2. Verify the file parses: `python -c "import cantools; db = cantools.database.load_file('bms.dbc'); print(db)"`. Fix any reported syntax errors before continuing.
3. Write a Python logging script that opens the CANable with `python-can`, reads frames for 30 seconds, and for each frame with ID 0x064, decodes it with `cantools` and appends the timestamp and signal dictionary to a list.
4. After logging, use `matplotlib` to plot SOC on the left y-axis and PackVoltage on the right y-axis over time. Save the figure as a PNG.
5. Modify Node A to decrement its fake SOC by 1 count every second. Rerun the logger and confirm the downward SOC trend is visible in the plot.

**What to observe**
The complete data pipeline from hardware to visualization: raw USB packets from the CAN adapter decoded by SocketCAN, filtered by arbitration ID, decoded from binary by the DBC file, accumulated in Python, and rendered as a time-series plot. This is the exact workflow used for BMS test bench analysis. Replace the Arduino transmitter with a real BMS and the pipeline is immediately useful for characterization and certification testing.

---

## Further Reading

- Corrigan, D. & Bhatt, M. — "Introduction to the Controller Area Network (CAN)," Texas Instruments Application Report SLOA101, available at ti.com — concise and authoritative introduction to CAN framing and error handling
- Andrea, D. — *Battery Management Systems for Large Lithium-Ion Battery Packs*, Artech House, 2010 — Chapter 8 covers BMS communication architecture in a production pack context
- ISO 11898-1:2015 — *Road vehicles — Controller area network (CAN) — Part 1: Data link layer and physical signalling*, ISO, Geneva
- ISO 11898-2:2016 — *Road vehicles — Controller area network (CAN) — Part 2: High-speed medium access unit*, ISO, Geneva
- ISO 14229-1:2020 — *Road vehicles — Unified diagnostic services (UDS) — Part 1: Application layer*, ISO, Geneva
- CHAdeMO Association — *CHAdeMO 2.0 Protocol Specification*, available to members at chademo.com
- CSS Electronics — "CAN Bus Explained: A Simple Introduction," csselectronics.com — best accessible overview of CAN framing and termination for practitioners
- SavvyCAN documentation — savvycan.com/docs — covers DBC import, signal decoding, graphing, and scripting
- python-can documentation — python-can.readthedocs.io; cantools documentation — cantools.readthedocs.io
- Texas Instruments — BQ76920 product page and datasheet (I2C interface specification), ti.com/product/BQ76920; BQ76940 product page, ti.com/product/BQ76940
- Analog Devices — *LTC6804 isoSPI Daisy-Chain Application Note*, analog.com — covers daisy-chain topology, isolation transformer selection, and timing requirements
