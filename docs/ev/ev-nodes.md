# EV Nodes — The Network of Computers Driving Your Car

*Prerequisites: [CAN Bus](../interfaces/can.md) · [BMS During a Drive](../bms_concepts/bms-during-a-drive.md)*
*Next: [Why Range Drops in Winter](./why-range-drops-in-winter.md)*

---

## Fifty Computers, One Car

A modern battery electric vehicle contains dozens to well over a hundred electronic control units (ECUs), depending on the platform and its feature set. Each one is an embedded computer with its own processor, memory, firmware, and communication interfaces. The BMS we have been studying throughout this series is just one of them.

This might seem like over-engineering until you think about what an EV actually is. In an ICE vehicle, much of the "control" is mechanical: the throttle cable moves the butterfly valve, the crankshaft drives the camshaft, the differential splits torque through gears. Electronics supervise and trim, but the machinery does the fundamental work. In a BEV, there is no mechanical drivetrain to speak of — the motor has one moving part, and every aspect of how that motor behaves, how the battery supplies it, how the cabin stays comfortable, how the vehicle responds to a skid, how the driver knows the state of charge — all of it is decided by software running on a network of microcontrollers.

Understanding the full node map matters for BMS engineers because the BMS does not operate in isolation. Its outputs — SOC, SOP limits, fault flags, cell temperatures — flow directly into the decision-making of every other node on the vehicle. Before writing a BMS CAN message specification, you need to know who is reading those messages and what they will do with them.

---

## Why Not One Big Computer?

The obvious alternative to fifty specialized ECUs is one powerful central computer doing everything. Some new architectures are moving in this direction (Tesla's "Full Self-Driving" computer, Rivian's zone controller approach), but the distributed model still dominates production EVs. The reasons are rooted in safety, regulatory requirements, and practical engineering:

**Real-time isolation**: a collision detection ECU (airbag controller) must respond to a crash within milliseconds, with no interference from background tasks. If it shared a processor with the infotainment system, a software hang in the video player could delay the airbag. Hard real-time requirements are much easier to satisfy on a dedicated processor with a small, auditable codebase.

**Fault isolation**: if the navigation ECU crashes, it should not affect the motor controller. Physical separation means a software fault in one domain cannot propagate into another. This is not theoretical — complex systems fail, and the architecture must contain that failure.

**ASIL zoning**: ISO 26262 functional safety requires that the ASIL (Automotive Safety Integrity Level) of a hardware component cover all software running on it. A safety-critical function (like BMS fault detection, rated ASIL-C or ASIL-D) running on the same processor as a non-safety function raises the safety requirements — and cost — of the entire component. Separating safety-critical ECUs from convenience ECUs keeps certification costs manageable.

**Supplier partitioning**: OEMs rarely design every ECU in-house. The motor controller comes from one supplier, the BMS from another, the ADAS stack from a third. Standardized CAN interfaces allow independent development and integration. Each supplier delivers a black box with documented inputs and outputs; the OEM integrates them.

---

## The Main Nodes

### VCU — Vehicle Control Unit

The VCU is the coordinator of the powertrain. It sits at the top of the command hierarchy and makes the high-level decisions: how much torque to request, which mode to run in, what to do when a fault occurs.

**Inputs**: accelerator pedal position (from a pedal sensor via CAN or direct analog), brake pedal position, gear selector state, drive mode selection (Eco/Normal/Sport), ignition state, ADAS torque requests.

**Outputs on CAN**: torque request to the motor controller (in Nm), charge current request to the OBC, thermal setpoints to the thermal management controller, ready signal to the instrument cluster.

**The BMS relationship**: the VCU reads the BMS's published maximum discharge current every cycle — typically every 10–100 ms. When the BMS reduces its current limit (cold battery, low SOC, thermal event), the VCU immediately scales the torque request to the MCU to stay within that limit. The driver presses the accelerator; the VCU calculates what torque that corresponds to; the BMS says "not more than 80 A right now"; the VCU sends a torque request consistent with 80 A. The car responds accordingly. The driver may not notice anything, or may notice that the car feels less responsive than usual.

The VCU enforces BMS limits — it does not override them.

### BMS — Battery Management System

You have read fifteen posts about this one. In the node context, what matters is understanding the BMS's position in the information hierarchy.

The BMS is the **authority on pack state and limits**. No other node has the right to override what the BMS publishes about the pack's condition. If the BMS says charge current limit is zero, the OBC stops. If the BMS says discharge current limit is zero, the VCU requests zero torque. If the BMS opens the contactors, the HV bus goes dead regardless of what any other node wants.

**Key CAN outputs**:

- SOC (%), SOH (%), pack voltage (V), pack current (A)
- Max discharge current (A) — updated every 10–100 ms based on SOP calculation
- Max charge current (A)
- Charge enable flag (boolean)
- Cell temperature maximum and minimum
- Fault status byte (bitmask of active fault conditions)
- Individual cell data (voltages, temperatures) — often at lower rate due to frame count

**Hardware composition**: BMS microcontroller (STM32, TI Hercules, NXP S32K), AFE chips (BQ76940, LTC6804/6811), current sensor (shunt or Hall effect), pre-charge circuit, contactors, NTC thermistors.

### MCU — Motor Control Unit (Inverter)

The MCU converts the BMS's stored DC energy into mechanical rotation. It contains the power electronics (IGBT or SiC MOSFET power modules), the gate drive circuits, and the control processor that runs the motor control algorithm.

**Inputs from VCU**: torque request (Nm), direction (forward/reverse/regen), enable signal.

**Inputs from sensors**: motor phase currents (from current sensors on each phase), rotor position (resolver or encoder), DC bus voltage, power module temperatures (thermistors on IGBT/SiC modules).

**What it does**: runs a field-oriented control (FOC) algorithm — typically with a 10–20 kHz PWM switching frequency — to generate the three-phase AC waveform that produces the requested torque. The MCU controls the duty cycle of six gate drivers, which switch the six power transistors (or twelve in an H-bridge variant) to synthesize the required AC waveform from the DC bus.

**Feedback on CAN**: actual torque delivered (Nm), motor speed (RPM), motor winding temperature, power module temperature, DC bus voltage, MCU fault status.

**Regen braking**: when the driver lifts the throttle or applies the brake, the VCU sends a negative torque request (or the MCU interprets it as generator mode). The traction motor becomes a generator; the MCU controls the power flow back into the DC bus. The amount of regen is bounded by the BMS's published max charge current — if the pack is nearly full or too cold, the BMS reduces the charge current limit, and the MCU reduces regen accordingly. The remaining braking is made up by the friction brakes, coordinated by the ABS/ESC ECU.

**SiC vs IGBT**: Silicon carbide MOSFETs are increasingly replacing IGBTs in new EV inverter designs. SiC switches faster (lower switching losses), tolerates higher junction temperatures, and allows higher DC bus voltages — but costs more. The transition has been rapid in high-performance platforms, with many premium and high-power designs from around 2021 onward adopting SiC, while cost-focused and legacy platforms continue to use IGBTs. Both technologies remain in production across the industry.

### OBC — On-Board Charger

The OBC converts AC grid power to the DC voltage needed to charge the HV pack. It physically plugs into the AC inlet of the vehicle and connects its DC output to the HV bus (through the BMS contactors).

**AC side**: a power factor correction (PFC) front end draws a nearly sinusoidal current from the grid regardless of the DC output requirements, maintaining a high power factor. The PFC output is a regulated DC bus at ~400 V. An isolated DC-DC stage then converts this to the exact voltage the BMS requests.

**Communication with BMS**: the OBC and BMS exchange CAN messages during a charge session. The BMS publishes the target charge voltage (e.g., 420 V for a 400 V pack) and max charge current (e.g., 32 A). The OBC adjusts its output accordingly and reports back actual output voltage, actual output current, and its own thermal status.

**AC charging levels**: Level 1 (typically 1.4–1.9 kW, 120 V single-phase) and Level 2 (typically 7.2–22 kW, 240 V single-phase or 400 V three-phase). 22 kW represents the upper end of common OBC hardware; higher AC power requires physically larger, heavier hardware and is less common in passenger EVs. Actual OBC rating varies by vehicle and market.

**DC fast charging (CCS, CHAdeMO)**: the OBC is bypassed. DC power from the DCFC enters the HV bus directly through a separate inlet. The BMS communicates directly with the charger via CAN (for CCS) or a separate protocol (for CHAdeMO), negotiating the charge current without the OBC's DC-DC conversion in the loop. This is why DC fast charging can deliver 150–350 kW while the OBC caps at 22 kW.

### DC-DC Converter

The vehicle's entire low-voltage (12 V) electrical system — ECUs, lights, wipers, power windows, 12 V accessories — runs at 12–14 V. The HV pack sits at 400–800 V. The DC-DC converter bridges the two voltage domains.

**Function**: steps the HV bus voltage down to ~14.4 V to power the 12 V bus and charge the 12 V auxiliary battery. Output current: typically 100–200 A (1.2–2.4 kW). High-efficiency bidirectional versions can also boost 12 V to higher voltages for V2L (vehicle-to-load) AC output sockets.

**Why it matters for the BMS**: the BMS microcontroller, AFE chips, contactors, and gate drivers all run on 12 V derived from the DC-DC converter. If the DC-DC fails and the 12 V aux battery goes flat, the BMS microcontroller loses power, contactors cannot be commanded, and the vehicle safe-states: contactors open, HV bus dead, no drive possible. The 12 V aux battery provides a backup for this scenario, but only for a limited time.

A second dependency: the pre-charge sequence during ignition requires the DC-DC to be running to supply the contactor coil drive current. The startup sequencing must account for this.

### Thermal Management Controller (TMC)

A BEV generates heat in the battery pack, the motor windings, and the power electronics — and in cold weather must generate heat for the cabin that a petrol car gets for free from engine waste heat. The TMC orchestrates the entire thermal system.

**Inputs**: battery temperatures (from BMS, per-zone), motor temperature (from MCU), power electronics temperatures (from MCU), ambient temperature (external sensor), cabin temperature demand (from climate control ECU), battery temperature target (from BMS).

**Outputs**: coolant pump PWM (speed control), radiator fan PWM, heat pump compressor speed, 3-way valve positions (routing coolant between battery loop, motor loop, cabin heater core, or chiller).

**The BMS interface**: the BMS publishes a battery temperature target — the temperature range it wants the pack maintained within for optimal performance. In summer this may be a cooling request (keep cells below 40°C); in winter a heating request (warm cells above 15°C before charging). The TMC acts on these targets by routing coolant and activating heat pump or chiller circuits.

**Heat pump**: vehicles with a heat pump (standard on Hyundai Ioniq 5, standard on Tesla Model Y in cold markets) use a refrigerant circuit to move heat rather than generate it electrically. As an illustrative range, a heat pump at −5°C ambient can typically deliver 2–3.5 kWh of heat per kWh of electricity consumed (COP varies by ambient temperature, system design, and operating point). The efficiency gain directly extends winter range by reducing the energy drawn from the pack for cabin heating.

### Gateway ECU

A modern EV has multiple CAN networks operating at different speeds and with different security requirements. The gateway connects these networks and controls what information crosses between them.

**Typical network partition**:

- **Powertrain CAN** (500 kbps–1 Mbps): BMS, VCU, MCU, OBC, DC-DC, TMC. High priority, low latency, most safety-critical.
- **Body CAN** (250 kbps): BCM (body control module), door ECUs, window motors, exterior lights, horn, power seat ECUs. Many nodes, low time-criticality.
- **Chassis CAN** (500 kbps): ABS/ESC, electric power steering, air suspension. Safety-critical but separate from powertrain.
- **Infotainment / HMI**: often a separate high-speed CAN or Automotive Ethernet network (100BASE-T1).

The gateway translates messages between networks. A wheel speed signal from the chassis CAN is needed on the powertrain CAN (for regen braking torque blending) — the gateway reads it on one bus and republishes it on the other with possible ID and scaling translation.

**Security**: OBD-II diagnostic traffic enters through the gateway. UN Regulation R155 (UNECE WP.29 Cybersecurity Regulation, in force for new type approvals from July 2022 in markets that have adopted it) requires OEMs to maintain a cybersecurity management system covering the full vehicle lifecycle, which includes gateway access controls. A diagnostic session on the OBD-II port should not be able to directly write messages onto the powertrain CAN without authorization — this is a hard regulatory requirement in R155-adopting markets, not just a best practice.

### Other Nodes (Brief)

**BCM (Body Control Module)**: manages all body-electrical functions — door locks, windows, exterior lights, horn, interior lighting, comfort features. Publishes door states, ignition state, and the ignition signal that wakes the BMS.

**ABS/ESC ECU**: anti-lock braking, electronic stability control, torque vectoring on AWD vehicles. Publishes wheel speeds — the VCU uses these for regen braking coordination (brake blending). In aggressive cornering the ESC can request individual wheel torque reduction from the VCU; the VCU passes this to the MCU.

**ADAS domain**: cameras, radar, and LiDAR feed into a dedicated compute platform (Mobileye, Nvidia Orin, or proprietary silicon). ADAS torque override requests reach the VCU via CAN or Ethernet; the VCU arbitrates between the driver's pedal input and the ADAS system's request.

**Instrument Cluster / HMI**: receives SOC, estimated range, fault warnings, and drive-ready status from the VCU and (via gateway) from the BMS. Displays them to the driver. Range estimate accuracy is a known pain point: the cluster typically applies its own smoothing algorithm on top of the BMS's SOC to avoid showing the driver a number that jumps around.

**Telematics ECU**: cellular modem + GPS. Enables remote monitoring (check SOC from a phone app), remote preconditioning commands, over-the-air software updates (the telematics ECU receives the update package and distributes it to target ECUs via the gateway), and fleet management. The telematics ECU is typically always powered at low current, even when the vehicle is parked.

---

## Network Topology

CAN bus topology must be linear — a backbone running from one end of the vehicle to the other, with short stubs to individual nodes. Star topology (all nodes running long cables to a central hub) is not permitted because each star arm is an unterminated stub that generates signal reflections.

Each node connects to the backbone with a stub ideally shorter than 0.3 metres at 1 Mbps, consistent with ISO 11898-2 physical-layer guidance. The longer the stub, the more it acts like an antenna for reflections, degrading signal quality at high bit rates.

**Bus loading**: as a widely used design rule of thumb, CAN bus utilization should be kept below 50% under normal conditions. This reserves headroom for burst traffic during fault conditions, when multiple nodes may simultaneously transmit fault reports and diagnostic requests. A bus loaded at 80% under normal conditions will lose messages during a fault storm — exactly when reliable communication is most critical.

**Message ID assignment** encodes priority. CAN arbitration means lower IDs win. A BMS fault message should have a low ID (high priority) — for example 0x001 — so it always wins arbitration over routine cell data at 0x200 or diagnostic requests at 0x7DF. This is a design decision that the BMS team must negotiate with the vehicle integration team before any CAN matrix is finalized.

---

## Startup Sequence — Order Matters

A node that powers on before its dependencies causes faults. The correct startup sequence for a BEV:

**1. 12 V domain wakes up** (ignition key, button press, or CAN wake frame): BCM, gateway, telematics ECU, and instrument cluster boot from the 12 V aux battery. This happens in under 500 ms for modern ECUs.

**2. DC-DC converter enables**: begins sustaining the 12 V bus from the HV pack once HV becomes available. Until HV is live, the 12 V aux battery supplies everything.

**3. BMS boots**: reads all cell voltages, temperatures, HVIL status, isolation resistance. Runs self-check. Initializes SOC from OCV if the car has been parked long enough for cells to settle, or from stored SOC if recently driven. Duration: 500 ms to 1.5 s depending on implementation.

**4. Pre-charge sequence**: BMS closes main negative contactor, then pre-charge contactor. Inverter bus capacitors charge through the pre-charge resistor. BMS monitors bus voltage rise until it reaches pack voltage (typically within 5% tolerance). Then BMS closes main positive contactor and opens pre-charge contactor. Duration: 200–600 ms.

**5. HV bus live**: MCU, OBC, and TMC can now operate.

**6. VCU receives HV ready**: BMS publishes a "ready" flag on CAN. VCU reads it, enables the torque path, and signals the instrument cluster.

**7. Ready-to-drive indicator**: the cluster shows the "Ready" light (the EV equivalent of a running engine). Driver can select a gear and begin moving. Total time from button press to drive-ready: 1.5–3 seconds.

Any failure in this sequence results in the BMS refusing to close contactors and logging the specific fault that prevented readiness. Common startup faults: cell below minimum voltage, HVIL break (service plug not fully seated), isolation fault detected.

---

## Wake and Sleep Management

A parked EV must protect its 12 V aux battery. Most nodes are powered off, their CAN transceivers in silent mode.

**Always-on nodes**: BMS (low-power cell monitoring mode, scanning voltages every 30 seconds), telematics ECU (listening for remote commands and pushing telematics data), gateway (handling remote wake frames).

**BMS standby current**: typically in the low milliamp range from 12 V (exact figures vary by OEM and telematics duty cycle). The constraint is usually the cumulative draw of all always-on nodes combined — BMS, telematics, and gateway together. Most EV owners report aux battery depletion after several weeks of parking without a charge event, with the exact duration depending heavily on whether telematics are active and the ambient temperature.

**Wake triggers**:

- Ignition button or key fob (12 V signal to BCM → BCM wakes full network)
- Remote start command (telematics ECU → wake frame on low-power CAN segment → BCM → full wake)
- BMS internal alarm: if a cell reaches a low-voltage threshold during standby self-monitoring, the BMS can wake the telematics ECU to alert the driver

**Sleep shutdown sequence**: ignition off → VCU commands contactors open → BMS verifies HV bus dead → MCU, OBC, TMC confirm shutdown → gateway routes shutdown commands → non-essential ECUs power off → BMS transitions to low-power scan mode → telematics ECU goes to standby. Duration: 1–2 seconds.

---

## BMS Information Flow in Context

Pulling together the BMS's role across all nodes:

| Source | Destination | Message | Update Rate |
|---|---|---|---|
| BMS | VCU | SOC, max discharge/charge current, fault flags | 10–100 ms |
| BMS | OBC | Charge enable, max charge current, target voltage | 100 ms |
| BMS | TMC | Cell temps, battery temp target, heating/cooling request | 200 ms |
| BMS | Gateway → Cluster | SOC %, estimated range, fault warning | 500 ms |
| VCU | BMS | Ignition state, drive mode | 100 ms |
| MCU | VCU | Actual torque, motor speed, MCU temp | 10 ms |
| VCU | MCU | Torque request (bounded by BMS limits) | 10 ms |
| ABS/ESC | VCU | Wheel speeds, ESC torque requests | 10 ms |

The BMS publishes its limits; every other node reads and respects them. This is the core architectural principle of the powertrain network: the BMS is the single authority on what the pack can do, and every other node must operate within that envelope.

---

## Fault Propagation Across the Network

A BMS fault does not stay inside the BMS — it cascades through the network:

**Scenario 1 — BMS current limit drops to zero**: BMS sets max discharge current = 0 A on CAN. VCU reads updated limit → scales torque request to MCU = 0 Nm → motor produces no torque → vehicle coasts to a stop. BMS simultaneously triggers a warning on the cluster via the gateway. The driver sees an amber or red warning, hears a chime, and the car decelerates. The fault is contained: the VCU did not fight the BMS limit, the MCU did not request more current.

**Scenario 2 — BMS hard fault, contactors open**: contactors open immediately. HV bus dies. MCU gate drivers turn off (no bus voltage = no power to the gates). Motor stops. Significant deceleration if at speed — the ESC detects unexpected wheel deceleration and may apply individual brake corrections to maintain vehicle stability. The BMS logs the fault, opens all contactors, publishes a critical fault flag. The VCU enters limp mode.

**Scenario 3 — MCU overtemperature**: MCU publishes thermal fault → VCU reduces torque request → TMC increases inverter cooling → BMS remains uninvolved unless the thermal fault also affects pack current.

The propagation paths are documented in the vehicle's fault tree analysis (part of the DFMEA process for ISO 26262). Every failure mode at the ECU level must have a defined effect at the vehicle level, and every critical vehicle-level effect must have a protective response.

---

## Over-the-Air Updates

Software-defined vehicles receive firmware updates wirelessly. The process:

1. OEM server prepares and signs a firmware package for a target ECU (e.g., BMS firmware v2.4.1)
2. Package is pushed over cellular to the telematics ECU during a parked, plugged-in window
3. Telematics ECU validates the signature and transfers the package to the gateway
4. Gateway routes the update to the target ECU using UDS (ISO 14229) protocol over CAN
5. Target ECU downloads, validates, flashes to an inactive partition, and reboots into the new firmware
6. If startup check fails after update: automatic rollback to previous firmware version

BMS firmware updates require additional precautions: the vehicle must be parked and not charging, the update must complete within a bounded time window, and rollback must always be possible. A failed BMS update that leaves the ECU unbootable is a vehicle-level failure requiring physical service.

---

## Further Reading

**Textbooks**

- Ehsani, M. et al. — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles* (3rd ed., CRC Press) — full BEV powertrain architecture
- Reif, K. (ed.) — *Fundamentals of Automotive and Engine Technology* (Bosch) — ECU architecture reference

**Standards**

- ISO 26262 — functional safety decomposition of ECU responsibilities (covered separately in this series)
- ISO 15118 — OBC to EVSE communication (V2G and smart charging protocols)
- ISO 14229 (UDS) — Unified Diagnostic Services: how service tools and OTA systems talk to ECUs
- UN R155 — vehicle cybersecurity regulation; governs gateway security and OTA update requirements

**Online**

- CSS Electronics — "CAN Bus Multi-Network Architecture Guide" — visual explainer of automotive multi-bus topologies
- Vector Informatik — E/E Architecture white papers — professional automotive network design resources
- COVESA Vehicle Signal Specification (VSS) — open naming standard for EV signals including BMS outputs
