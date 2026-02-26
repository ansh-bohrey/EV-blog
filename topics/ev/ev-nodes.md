# EV Nodes (ECU Architecture) — Blog Plan

## Goal
Explain what the major electronic control units (nodes) in a battery electric vehicle are, what each one does, how they communicate, and how they start up and coordinate — from "why does an EV need so many computers?" to understanding the full powertrain network.

## Audience Angles
- **Engineers / students**: ECU functional decomposition, CAN network topology, gateway routing, startup sequencing, HV/LV domain separation, node wake/sleep management
- **EV enthusiasts**: "What computers are in my EV?", why EVs have over-the-air updates, how the BMS fits into the bigger picture, why one failed sensor can stop the whole car

---

## Subtopic Flow

### 1. Hook — An EV Is a Network of Computers
- A modern EV has 50–100+ microcontrollers. Each one is a "node" with a specific job.
- Unlike an ICE car where much of the logic is mechanical, an EV is almost entirely electronic — every function from torque delivery to door lock involves a dedicated ECU talking on a shared network
- The BMS we've studied throughout this series is just one node. Understanding the full picture shows how the BMS's outputs (SOC, limits, faults) flow to every other part of the car.

### 2. Why Multiple ECUs? Why Not One Big Computer?
- **Safety by separation**: a crash detection ECU (airbag) must always respond instantly — it cannot share compute cycles with the infotainment system. Separation = predictable response time.
- **Fault isolation**: if the radio ECU crashes, the motor controller should not be affected. Physical separation limits fault propagation.
- **Development parallelism**: different suppliers develop different ECUs; standardized communication interfaces (CAN, LIN) allow integration
- **ASIL zones**: safety-critical nodes (BMS, airbag, steering) must meet high ASIL levels; separating them avoids contaminating lower-criticality nodes with expensive safety requirements
- Trend: "zonal architecture" (Tesla, Rivian's new approach) — fewer, more powerful ECUs with more software — moves away from this distributed model, but the underlying function decomposition remains

### 3. The Main Nodes in a BEV

#### VCU — Vehicle Control Unit (the Brain)
- The top-level coordinator of the powertrain
- Receives: driver inputs (accelerator pedal position, brake pedal, gear selector, drive mode), navigation/ADAS data, HMI requests
- Sends: torque request to MCU, charge request to BMS/OBC, thermal targets to thermal management controller
- Makes decisions: which drive mode? regen braking level? how to split torque in AWD? limp-home mode if fault?
- Publishes on CAN: vehicle speed, state (park/drive/reverse/neutral), ready signal, drive mode
- Safety role: enforces BMS-published current limits — if BMS says "max 100A discharge", VCU scales torque request accordingly
- In some architectures: VCU and BMS are one physical unit; in others (most OEM designs) they are separate ECUs on the same bus

#### BMS — Battery Management System
- Already covered in depth throughout this series — here place it in the full node context
- Inputs: cell voltages (from AFE via SPI), pack current (shunt sensor), temperatures (NTC thermistors), ignition signal, CAN commands
- Outputs on CAN: SOC, SOH, pack voltage, max charge/discharge current, charge enable, fault status, individual cell data
- Critical role: the BMS is the authority on what the pack can safely do. All other nodes must respect its limits.
- Hardware: dedicated microcontroller (STM32, TI Hercules, NXP S32K series), AFE chips (BQ76940, LTC6804), contactors, pre-charge circuit

#### MCU — Motor Control Unit (Inverter)
- Converts DC pack voltage to 3-phase AC for the traction motor
- Inputs from VCU: torque request (Nm), direction (forward/reverse)
- Inputs from sensors: motor phase currents, rotor position (resolver or encoder), DC bus voltage, IGBT/SiC module temperatures
- Outputs: 3-phase PWM gate signals to power switches (IGBT or SiC MOSFET)
- Feedback on CAN: actual torque delivered, motor speed (RPM), motor temperature, MCU temperature, DC bus voltage
- In regen braking: motor becomes a generator; MCU controls current to convert kinetic energy back to DC, subject to BMS charge acceptance limit
- Modern trend: SiC (Silicon Carbide) MOSFETs replacing IGBTs — higher switching frequency, lower losses, higher temperature tolerance

#### OBC — On-Board Charger
- Converts AC grid power (single-phase 240V or 3-phase 400V) to DC to charge the HV battery
- Interfaces with EVSE via J1772 pilot signal (current capability negotiation) and in V2G scenarios via ISO 15118 PLC
- Communicates with BMS over CAN: receives target voltage and current, publishes actual output voltage and current
- Power factor correction (PFC) front end: draws near-sinusoidal current from AC grid regardless of DC output requirement
- Typical ratings: 7.2 kW (single-phase Level 2), 11 kW, 22 kW (3-phase Level 2)
- For DC fast charging (CHAdeMO/CCS): OBC is bypassed — DC enters directly to the HV bus; BMS negotiates directly with the charger via CAN

#### DCDC Converter
- Bidirectional DC-DC converter: steps down HV pack voltage (400V) to 12–14V for the 12V auxiliary system
- Powers: low-voltage ECUs, lights, wipers, 12V accessories, charges the 12V lead-acid or LiFePO4 auxiliary battery
- Also powers the BMS itself (BMS microcontroller runs at 12V, not pack voltage)
- Bidirectional variant (V2L, Vehicle-to-Load): can also boost 12V to 120/230V AC for external power outlets
- Communicates on CAN: reports output voltage, output current, operating status, fault flags
- Critical dependency: if the DCDC fails and the 12V aux battery dies, the BMS microcontroller loses power → BMS cannot control contactors → vehicle safe-states (contactors stay open)

#### Thermal Management Controller (TMC / TMU)
- Controls the battery thermal system and (in some architectures) the HVAC thermal system as a unified loop
- Inputs: battery temperatures (from BMS), motor temperature (from MCU), ambient temperature, cabin temperature demand
- Outputs: coolant pump speed (PWM), fan speed (PWM), heat pump compressor speed, valve positions (3-way valves for cooling/heating routing)
- Receives target temperature setpoints from BMS (battery) and climate control ECU (cabin)
- In vehicles with a unified heat pump (Tesla, Hyundai Ioniq 5): manages complex refrigerant circuit routing — heating battery from motor waste heat, cooling cabin while heating battery in winter, etc.

#### Gateway ECU
- Routes messages between CAN networks of different domains
- Typical partition:
  - **Powertrain CAN** (500kbps–1Mbps): BMS, VCU, MCU, OBC, DCDC, TMC — high-priority, real-time
  - **Body CAN** (250kbps): BCM (body control module), door modules, lights, wipers, power seats
  - **Chassis CAN** (500kbps): ABS/ESC, steering, suspension — safety-critical
  - **Infotainment/HMI**: often Ethernet or high-speed CAN FD
- Gateway translates and filters: a speed signal from the chassis CAN may be needed on the powertrain CAN for regen blending — gateway republishes it
- Security role: in modern vehicles, gateway enforces firewall — OBD-II diagnostic traffic cannot directly access safety-critical powertrain CAN
- With growing cybersecurity requirements (UN R155), gateway is increasingly a security enforcement point

#### Other Nodes (Brief)
- **BCM (Body Control Module)**: doors, locks, windows, exterior lights, horn, comfort functions
- **ABS/ESC ECU**: anti-lock braking, electronic stability control — publishes wheel speeds used by VCU for regen torque blending
- **ADAS domain**: cameras, radar, LiDAR processing, autonomous driving stack — increasingly its own high-speed Ethernet sub-network
- **Instrument Cluster / HMI**: receives SOC from BMS (via gateway), displays range, charge status, fault warnings to driver
- **Telematics ECU**: 4G/5G cellular modem, GPS; used for OTA updates, remote monitoring, fleet management

### 4. Network Topology — How Nodes Are Connected

**Physical topology**: linear CAN bus with stubs (not star) — each node taps off the backbone with a short stub
- Too-long stubs cause reflections → increase error rate at high bus speeds
- Node count on one CAN bus: limited by capacitance (max 110 nodes at 1Mbps in practice, fewer for high-speed reliability)

**Multi-bus architecture**: separate CAN buses for different domains, connected via gateway
- Powertrain bus: highest priority, fastest (500kbps–1Mbps), fewest nodes
- Body bus: slower (250kbps), many nodes (20+), not time-critical
- Isolation between buses: a software bug in infotainment cannot flood the powertrain bus

**Message priorities and bus loading**:
- ID assignment follows priority: BMS fault (0x001) beats cell data (0x200) beats diagnostics (0x7DF)
- Bus loading target: keep below 50% utilization for headroom during fault storm (many nodes transmitting simultaneously)

### 5. Node Startup Sequence
Order matters — a node that comes online before its dependencies causes faults:

1. **12V domain wakes up** (ignition key or wake-on-CAN) — BCM, gateway, instrument cluster boot
2. **DCDC converter enabled** — sustains 12V bus independent of aux battery
3. **BMS boots** — starts AFE reads, cell voltage check, self-test
4. **Pre-charge sequence** (see Ignition Handling post) — BMS closes contactors
5. **HV bus live** — MCU, OBC, TMC enabled
6. **VCU ready** — receives "HV ready" from BMS, enables torque request
7. **Drive ready signal** — VCU → instrument cluster → driver sees "Ready" indicator

Startup time: typically 1.5–3 seconds from key-on to drive-ready, dominated by BMS self-check and pre-charge timing.

### 6. Node Wake and Sleep Management
- Parked EV: most nodes sleep to protect 12V aux battery
- **Always-on nodes**: BMS (low-power cell monitoring), telematics (remote access, over-the-air updates), gateway (handles remote wake commands)
- **Wake triggers**: ignition signal, CAN wake frame from telematics (e.g., OTA update push), internal BMS alarm (cell voltage approaching UV threshold)
- BMS standby current budget: typically 1–5mA from 12V → critical constraint for cars parked for weeks
- 12V aux battery: must sustain always-on nodes for 2–4 weeks without a charge event (DCDC charges it when driving or charging)

### 7. The BMS in Context — Information Flow
Draw a data flow diagram showing:
- BMS → VCU: SOC, max charge current, max discharge current, charge enable, fault flags
- BMS → Instrument Cluster (via gateway): SOC %, estimated range, fault warnings
- BMS → OBC: charge enable, max charge current, target voltage
- BMS → TMC: cell temperatures, target temperature, heating request
- VCU → BMS: torque request (informational, VCU already respects BMS limits), ignition state
- MCU → VCU: actual torque, motor speed, MCU temperature
- VCU → MCU: torque request, limited by BMS discharge limit

### 8. OTA Updates — The Software-Defined Vehicle
- Modern EVs receive firmware updates over-the-air (cellular network → telematics ECU → gateway → target ECU)
- Enables: bug fixes, new features, range improvements, charging curve optimization — post-sale
- BMS firmware updates are safety-critical: must include rollback capability, integrity verification, no update while driving or charging
- Tesla, Rivian, and others do this routinely. The vehicle ECU network must support secure update propagation.

### 9. Fault Propagation Across Nodes
- BMS publishes: "charge current limit = 0A, discharge current limit = 0A" → VCU reads this → torque request to MCU = 0Nm → vehicle cannot move (limp or shutdown)
- BMS publishes: fault flag → VCU triggers warning light via instrument cluster → driver informed
- MCU overtemperature → MCU publishes fault → VCU derate torque → TMC increases cooling
- Cascade: a BMS contactor open (hard shutdown) → HV bus dead → MCU loses input → motor stops instantly → ABS/ESC detects unexpected deceleration → ESC applies correction braking

### 10. Takeaways
- An EV is a deeply networked system — the BMS is one critical node, but its outputs drive decisions across every other node
- CAN bus is the glue that holds it all together; the gateway enforces domain separation and security
- Startup sequence and wake/sleep management are often where subtle reliability problems appear in new EV designs
- Engineers: understand the full node map before designing a BMS — the CAN message set is shaped by what every other node needs from you

---

## Experiment Ideas

### Experiment 1: Simulate a Two-Node VCU–BMS Interaction
**Materials**: 2× Arduino + MCP2515 CAN modules, LED strip (simulating motor/load)
**Procedure**:
1. Node A (BMS simulator): publishes a CAN frame every 100ms with: SOC (decrementing fake value), max discharge current (200A at 50% SOC, derates to 50A below 20% SOC), fault bit
2. Node B (VCU simulator): receives BMS frame, maps max current to LED brightness (PWM), shows derating behavior as SOC drops
3. Trigger a fault bit on Node A — Node B cuts LED to zero (safe state)

**What to observe**: VCU behavior correctly follows BMS-published limits. Demonstrates how the BMS's CAN outputs directly control the vehicle's power delivery.

### Experiment 2: CAN Bus Sniffing on OBD-II (if access to an EV or PHEV)
**Materials**: OBD-II to USB CAN adapter (e.g., CANtact, OBDLink SX), PC with SavvyCAN or python-can
**Procedure**:
1. Connect CAN adapter to OBD-II port (this is the gateway's diagnostic port — exposes a limited view of the vehicle CAN buses)
2. Log frames at idle, while driving (passenger, legal), while charging
3. Identify periodic messages (BMS heartbeat), identify messages that change with accelerator input or charging current
4. Cross-reference any known DBC files for the vehicle

**What to observe**: Real vehicle CAN traffic. Number of distinct message IDs visible. Different message rates. Shows the bus in action with real node traffic (not simulated).

### Experiment 3: Node Boot Sequence Timing
**Materials**: Arduino + oscilloscope or logic analyzer, a relay simulating the contactor, LED per "node state"
**Procedure**:
1. Program a boot sequence: 12V ready → BMS boot (500ms) → pre-charge start → pre-charge complete (300ms) → HV ready → drive enable
2. Use GPIO pins to signal each stage; capture on logic analyzer
3. Introduce a fault (BMS fault pin goes high after 200ms) — observe that sequence stops, drive enable never asserted

**What to observe**: Timing of each startup stage. The effect of a fault halting the sequence. Models the real-world state machine that governs EV startup.

---

## Literature Review

### Core Textbooks
- **Ehsani, M. et al.** — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles* (3rd ed., CRC Press) — EV powertrain architecture, ECU functional decomposition
- **Reif, K.** (ed.) — *Fundamentals of Automotive and Engine Technology* (Bosch) — automotive ECU architecture reference

### Key Papers / Reports
- **Paret, D.** — *Multiplexed Networks for Embedded Systems: CAN, LIN, FlexRay, Safe-by-Wire* (Wiley) — automotive network architecture from a systems perspective
- **Emadi, A. et al.** — "Power electronics and motor drives in electric, hybrid electric, and plug-in hybrid electric vehicles" — *IEEE Trans. Industrial Electronics* 55(6) — covers MCU/inverter in full system context
- **SAE Technical Paper 2019-01-0793** — "Automotive ECU Architecture Evolution Toward Centralized Vehicle Computers" — covers the trend from distributed to zonal architectures

### Online Resources
- **CSS Electronics** — "CAN Bus Multi-Network Architecture Guide" — visual explainer of multi-bus topologies in automotive
- **Vector Informatik** — "E/E Architecture" white papers — professional automotive network design resources
- **CANdb++ and DBC tutorials** — Vector, CSS Electronics — understanding real vehicle DBC formats
- **COVESA (previously GENIVI)** — vehicle signal specification (VSS) — open standard for naming EV signals including BMS outputs
- **Bosch Motorsport** — ECU architecture application notes — helpful for understanding functional decomposition even in a race context

### Standards / Regulations
- **ISO 26262** (already written) — functional safety decomposition of ECU responsibilities
- **UN R155 (WP.29)** — Vehicle cybersecurity regulations; governs gateway security and OTA update requirements
- **SAE J1939** — Heavy vehicle CAN standard; relevant for electric trucks and buses (similar node structure at higher current/voltage)
- **ISO 15118** — V2G and smart charging: governs OBC ↔ EVSE communication protocol
- **ISO 14229 (UDS)** — Unified Diagnostic Services: the protocol used by service tools to communicate with any ECU including BMS
