# EV Nodes (ECU Architecture) — The Network Behind the Battery

*Prerequisites: [Battery Pack Architecture →](../battery/battery.md), [Communication Interface →](../interfaces/communication-interface.md)*

---

## An EV Is a Network of Computers

A modern EV has 50–100+ microcontrollers. Each ECU is a node with a specific job: battery safety, torque delivery, charging, thermal control, and driver display. The BMS is one critical node, but its outputs flow into nearly every other system.

Understanding this network makes BMS decisions feel less abstract. A “max discharge current” message isn’t a number in isolation. It is a command that directly changes torque, regen, charging, and driver warnings.

---

## Why Multiple ECUs Instead of One Big Computer?

- **Safety by separation**: airbag logic cannot share cycles with infotainment.
- **Fault isolation**: a failed radio should not take down the motor controller.
- **Supplier parallelism**: standardized interfaces allow multi‑vendor integration.
- **ASIL partitioning**: safety‑critical nodes stay isolated.
- **Trend**: zonal architectures reduce node count, but functions remain distinct.

The trend is toward fewer, more powerful controllers, but the functional decomposition still exists in software and networks.

---

## The Main Nodes in a BEV

### VCU — Vehicle Control Unit
The top‑level coordinator of the powertrain.

- Inputs: pedals, drive mode, ADAS requests
- Outputs: torque request to MCU, charge requests to BMS/OBC, thermal targets
- Enforces BMS current limits (max charge/discharge)
- Decides drivetrain mode: eco, sport, limp‑home

### BMS — Battery Management System
The authority on what the pack can safely do.

- Inputs: cell voltages, pack current, temperatures, ignition state
- Outputs: SOC, SOH, max charge/discharge current, fault flags
- Controls contactors and pre‑charge
- Publishes limits every 10–100 ms on CAN

### MCU — Motor Control Unit (Inverter)
Converts DC pack voltage to 3‑phase AC.

- Inputs: torque request, rotor position, bus voltage
- Outputs: gate signals, torque feedback
- Regen: pushes current back to the pack within BMS limits

### OBC — On‑Board Charger
Converts AC to DC for charging.

- Negotiates with EVSE via J1772 / Type 2 pilot
- Receives charge limits from BMS over CAN
- Bypassed during DC fast charging

### DC‑DC Converter
Steps HV pack voltage down to 12–14 V.

- Powers all low‑voltage ECUs
- Charges the 12 V auxiliary battery
- If DC‑DC fails and 12 V dies, the BMS can no longer control contactors

### Thermal Management Controller (TMC)
Controls pumps, valves, and heat pump.

- Inputs: battery and motor temps
- Outputs: pump and fan commands
- Keeps pack in its optimal temperature window

### Gateway ECU
Routes messages between CAN domains.

- Powertrain CAN, chassis CAN, body CAN, infotainment Ethernet
- Filters and secures safety‑critical networks

### Other Nodes (Brief)
- **BCM**: doors, lights, windows
- **ABS/ESC**: wheel speed and stability control
- **Cluster/HMI**: SOC and warning display
- **Telematics**: OTA updates and remote diagnostics

---

## Network Topology

- **Powertrain CAN**: BMS, VCU, MCU, OBC, DC‑DC, TMC (high priority)
- **Chassis CAN**: ABS/ESC, steering
- **Body CAN**: lights, doors, comfort
- **Infotainment**: Ethernet or CAN FD

The gateway isolates domains so non‑critical traffic cannot flood the powertrain bus.

---

## Startup Sequence (Typical)

1. 12 V domain wakes (BCM + gateway)
2. DC‑DC stabilizes 12 V
3. BMS boots and runs self‑checks
4. Pre‑charge completes
5. HV bus becomes live
6. MCU and TMC enable
7. VCU sends drive‑ready signal

Typical time: 1.5–3 s from key‑on to ready. Most of this is BMS self‑checks and pre‑charge timing.

---

## Wake and Sleep Management

- Parked EV: most nodes sleep to protect the 12 V battery
- Always‑on: BMS (low‑power monitoring), telematics, gateway
- Wake triggers: ignition, CAN wake, plug‑in event, low‑cell alarm
- BMS standby current budget: often 1–5 mA at 12 V

If the 12 V battery dies, the HV pack is fine but the car is a brick. That is why DC‑DC reliability and low‑power design matter.

---

## BMS in Context — Data Flow

- BMS → VCU: SOC, max current limits, fault flags
- BMS → OBC: charge enable, target voltage/current
- BMS → TMC: cell temps and heating requests
- BMS → Cluster (via gateway): SOC, warnings

If the BMS says “0 A discharge,” the VCU and MCU must obey immediately. That single message controls vehicle motion.

---

## OTA Updates and Safety

OTA updates flow telematics → gateway → target ECU. BMS updates are safety‑critical:

- Integrity verified before install
- Rollback supported
- Never applied while driving or charging
- Version compatibility across the ECU network

---

## Fault Propagation Across Nodes

Example chain:

1. BMS detects cell overtemperature.
2. BMS sets max discharge current to 0 A.
3. VCU scales torque to 0 Nm.
4. Cluster displays “Power Reduced.”
5. TMC ramps cooling to maximum.

This is why BMS faults feel like whole‑vehicle events: they are.

---

## Takeaways

- An EV is a distributed control system, not a single computer.
- The BMS is the authority on pack safety, but every ECU depends on its outputs.
- Startup sequencing and wake/sleep control are common real‑world reliability issues.

---

## Experiments

### Experiment 1: Simulate BMS → VCU Limits on CAN
**Materials**: 2x Arduino + MCP2515 CAN modules.

**Procedure**:
1. Node A (BMS) sends max discharge current based on fake SOC.
2. Node B (VCU) scales an LED brightness to simulate torque output.

**What to observe**: VCU behavior tracks BMS limits in real time.

### Experiment 2: Node Boot Sequence Timing
**Materials**: Arduino + logic analyzer.

**Procedure**:
1. Implement staged boot sequence with GPIO signals.
2. Inject a fault mid‑sequence.

**What to observe**: Startup halts safely when a dependency fails.

### Experiment 3: CAN Sniffing (If You Have Vehicle Access)
**Materials**: OBD‑II CAN adapter + SavvyCAN.

**Procedure**:
1. Log frames during key‑on and charging.
2. Identify periodic BMS or VCU frames.

**What to observe**: Real‑world ECU traffic and startup timing.

---

## Literature Review

### Core References
- Ehsani et al. — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles*
- Bosch Automotive Handbook — ECU architecture sections

### Key Reports
- SAE 2019‑01‑0793 — centralized/zonal ECU trends
- Paret — *Multiplexed Networks for Embedded Systems*
