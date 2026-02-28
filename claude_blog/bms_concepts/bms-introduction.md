# Battery Management System — What It Is and Why Every Li-Ion Pack Needs One

*Next: [Open Circuit Voltage vs Terminal Voltage →](./ocv-vs-terminal-voltage.md)*

---

## The Problem With Lithium-Ion

Lead-acid batteries are forgiving. Overcharge one slightly and it vents some hydrogen, gets warm, and keeps working. Deeply discharge it and it sulphates, losing capacity permanently — but it does not catch fire. The chemistry has a kind of built-in tolerance for abuse.

Lithium-ion cells are the opposite. They are extraordinarily energy-dense — a 21700 cell stores more energy per kilogram than a lead-acid equivalent several times its weight — but they are intolerant of conditions outside a narrow operating window. Charge an NMC cell above roughly 4.2 V and lithium plating begins on the anode; thermal runaway becomes a real possibility. Discharge it below roughly 2.5 V and copper dissolution corrodes the anode current collector, causing irreversible capacity loss and potentially creating internal short-circuit pathways. Operate it above 60°C repeatedly and the electrolyte degrades, the SEI layer thickens, and cycle life collapses.

None of these failure modes are theoretical. They happen in real cells, in real vehicles, when the conditions are wrong.

The cell itself has no way to stop this. It does not know what voltage it is at. It cannot refuse to accept charge. A lithium-ion cell is entirely at the mercy of whatever is connected to it.

**The Battery Management System (BMS) is what stands between a lithium-ion pack and its own failure modes.** It is the mandatory electronic system that watches every cell, enforces every limit, and makes the decisions the cell cannot make for itself.

---

## What a BMS Actually Is

The term gets used loosely — sometimes people mean a simple protection circuit, sometimes the entire battery management software stack, sometimes a specific PCB. A precise definition helps.

A BMS is an electronic system that **monitors, protects, and manages** a rechargeable battery pack. The key word is *system*. It is not a single chip, a single board, or a single function. It is a combination of:

- **Hardware** — an Analog Front End (AFE) IC that measures every cell voltage and temperature, a current sensor on the pack's main bus, a microcontroller that runs the management software, the contactor drivers that control the main relays, and thermistors throughout the pack
- **Firmware** — state estimation algorithms (SOC, SOH, SOP), protection logic, balancing control, fault handling, and communication protocols running on the microcontroller
- **Communication** — CAN bus messages that carry pack state, cell data, and fault codes to the rest of the vehicle

A simple power bank protection circuit — the three-pin IC that cuts off a single cell at 4.2 V and 2.5 V — is the minimal version of a BMS. It monitors one voltage and protects against two limits. A full automotive-grade BMS for an EV pack with hundreds of cells in multiple modules is the complex end: distributed hardware, real-time state estimation, functional safety compliance, and a complete CAN message set. Both are BMS implementations; the scope is what differs.

---

## Where the BMS Sits

In the system diagram, the BMS sits between the cells and everything outside the pack.

![BMS system diagram: cells → AFE + microcontroller → contactor control → HV bus → inverter, charger, DC-DC converter; CAN bus connects BMS to VCU and cluster](../assets/bms-concepts/bms-system-diagram.svg)

The pack's positive and negative terminals are connected to the HV bus through **contactors** — high-voltage relays. The BMS controls these contactors. When the pack is safe to connect, the BMS closes the contactors. When a fault is detected, it opens them. The pack cannot electrically connect to or disconnect from the vehicle without the BMS's permission.

Inside the pack, the AFE measures every cell's voltage directly — sense wires run from each cell terminal to the AFE inputs. This is distinct from the pack terminal voltage, which is just the sum of all cells in series. The BMS knows each cell individually. It can see that cell 47 of 96 is reading 3.2 V while the rest are at 3.6 V, and act on that specific information. The vehicle's VCU, by contrast, only sees what the BMS chooses to tell it over CAN — a state of charge percentage, a max discharge current limit, a pack temperature, and any active fault codes.

The current sensor lives on the pack's main bus, outside the cells, measuring the total current flowing in or out of the pack at all times. Combined with cell voltages and temperatures, this gives the BMS everything it needs to estimate the pack's state.

---

## Core Functions

This section introduces each BMS function briefly. Each one gets a dedicated post later in the series.

### Measurement

Everything the BMS does downstream depends on accurate measurement of three quantities: **cell voltage**, **pack current**, and **temperature**.

Cell voltages are measured by the AFE IC — typically accurate to ±1–2 mV, sampled for all cells in the pack every few hundred milliseconds. Pack current is measured by a shunt resistor (milliohm-range, high accuracy) or a Hall-effect sensor on the main bus. Temperatures are measured by NTC thermistors placed throughout the pack — on cell surfaces, at module entry and exit, at the contactor, and sometimes on the BMS board itself.

The accuracy of these measurements is the floor on which everything else is built. A ±5 mV error in cell voltage translates to a meaningful SOC error for LFP cells with their nearly flat OCV curve. A ±1% current measurement error accumulates over an integration into a SOC drift that matters at the end of a long discharge. Measurement quality is the first thing to examine when a BMS is behaving unexpectedly.

### State Estimation

Three states matter most:

**SOC — State of Charge** answers "how full is the battery?" It is not the same as voltage, although voltage correlates with SOC through the OCV-SOC relationship. SOC estimation uses current integration (coulomb counting), corrected and initialised via the OCV-SOC curve when the pack has been resting long enough for the terminal voltage to relax to open circuit. A well-implemented SOC estimator maintains accuracy to within a few percent across temperature, aging, and charge/discharge rate.

**SOH — State of Health** answers "how much of the original capacity remains?" A new NMC pack at 100% SOH can deliver its full rated Ah from 100% to 0% SOC. As cells age, their capacity fades. SOH tracks that fade — an SOH of 80% means the pack can now deliver 80% of its original rated capacity.

**SOP — State of Power** answers "how much current can the pack deliver or accept right now?" SOP depends on cell voltage, SOC, temperature, and internal resistance. A cold pack, a low-SOC pack, and an aged pack all have reduced SOP even if their SOC readings are similar. SOP is what the VCU uses to determine how much torque the motor controller can request.

### Protection

Protection is the BMS function the cell physically cannot provide for itself. The BMS monitors every cell continuously and responds to any condition outside safe limits by limiting current or opening the contactors.

The standard set of protection functions:

| Protection | Trigger | Response |
|---|---|---|
| Overvoltage | Any cell exceeds V_max | Stop charging; open contactors if not resolved |
| Undervoltage | Any cell falls below V_min | Stop discharging; open contactors if not resolved |
| Over-current charge | Pack current exceeds I_max_charge | Request charger to reduce current; open contactors if not complied |
| Over-current discharge | Pack current exceeds I_max_discharge | Request VCU to reduce power; open contactors if not complied |
| Over-temperature | Any temperature sensor exceeds T_max | Reduce current limit; trigger cooling request; open contactors if critical |
| Under-temperature | Cell temperature below T_min_charge | Block charging (lithium plating risk) until temperature rises |
| Short circuit | Sudden massive current spike | Open contactors within microseconds |
| Isolation fault | HV bus leakage to chassis detected | Alert driver; open contactors if leakage exceeds safe limit |

These protection thresholds are not arbitrary. They come from cell manufacturer datasheets, validated in qualification testing against the applicable standard for the market — AIS-156 in India, UN38.3 internationally, ISO 6469-1 for passenger vehicles. The BMS's protection configuration is, in effect, a software implementation of the battery's datasheet limits.

### Cell Balancing

In a series string of cells, every cell must carry the same current. But cells are not identical — small manufacturing differences mean they have slightly different capacities and slightly different rates of aging. Over time, cells diverge in SOC. The weakest cell hits its minimum SOC first during discharge, and its maximum SOC first during charge, both times cutting the cycle short before the other cells are finished.

The BMS counteracts this with **cell balancing** — either bleeding charge from high-SOC cells through a resistor (passive balancing), or transferring charge from high cells to low cells via a switched-mode converter (active balancing). The result is a string where all cells arrive at their top and bottom limits together, maximising usable pack capacity.

### Contactor Control

The contactors are high-voltage relays — typically rated 200–600 V, 200–500 A — that connect the pack to the HV bus. The BMS controls their gate signals. On startup, the BMS runs a **pre-charge sequence** before closing the main positive contactor: a pre-charge contactor with a series resistor limits the inrush current that would otherwise spike through the bus capacitance of the inverter and charger. Only after bus voltage has risen to within a few volts of pack voltage does the BMS close the main contactor and open the pre-charge contactor.

This sequence prevents contact welding from inrush current — a failure mode that leaves the pack permanently connected to the bus with no ability to disconnect, which is a significant safety hazard.

### Thermal Management

The BMS does not run the cooling system directly — that is the Thermal Management Controller (TMC) or the VCU. But the BMS holds all the temperature data, and it uses that data to make requests. When cell temperature rises above a threshold, the BMS sends a cooling request over CAN. When cells are too cold to charge safely, the BMS requests heating. When temperature is critical and no cooling response comes quickly enough, the BMS reduces power limits and eventually opens contactors.

### Communication

The BMS is the primary source of truth about pack state for the rest of the vehicle. Over CAN, it broadcasts pack SOC, pack voltage, pack current, max charge and discharge current limits, cell temperatures, fault codes, and contactor state — typically at 10–100 ms intervals depending on the signal.

The VCU uses the SOC to display range to the driver and manage energy strategy. The motor controller uses the discharge current limit to cap torque requests. The charger uses the charge current limit and voltage target from the BMS to implement the correct charging profile. None of these systems can function correctly without the BMS providing accurate, timely data.

### Fault Management

When the BMS detects an out-of-limits condition, it follows a defined fault response hierarchy. Minor faults — a single cell slightly high in temperature, a transient current spike — are handled by reducing limits and logging the event. Moderate faults trigger a controlled shutdown: the BMS notifies the VCU, allows the vehicle to safely stop, and opens contactors once standstill is confirmed. Critical faults — thermal runaway indicators, isolation failures, sensor failures that leave the BMS unable to verify pack safety — trigger immediate contactor opening regardless of vehicle state.

Every fault is logged with a timestamp and the parameter values that triggered it. This fault log is essential for warranty analysis, field debugging, and regulatory compliance.

---

## BMS Architectures

How the BMS hardware is physically arranged varies with pack size and cost targets.

**Centralised architecture** puts all the monitoring and control electronics on a single board. Sense wires run from every cell terminal in the pack to the one AFE or set of AFEs on that board. This is simple, low-cost, and standard for small packs — most two- and three-wheeler BMS designs are centralised, monitoring 13–20 cells from one board. The limitation is harness length and complexity: for a 96-cell EV car pack, running individual sense wires to a single location creates long wire runs that are both a cost and an EMC challenge.

**Distributed (modular) architecture** places a small slave board on each module, typically handling 12–16 cells each. Each slave measures its local cells and handles local balancing. A single master board communicates with all slaves, collects measurements, runs state estimation, controls the contactors, and handles CAN communication. The sense wire harness from each slave only spans its own module — much shorter and tidier. The tradeoff is that the master-slave communication link (often isoSPI daisy-chain, or a dedicated CAN segment) adds design complexity and a potential failure point.

A common implementation of the modular approach uses AFE ICs with built-in daisy-chain support — the LTC6811/6812 series from Analog Devices and the BQ76920/40 series from Texas Instruments both support this. Each AFE measures up to 12–15 cells; multiple AFEs chain together, and the microcontroller reads all of them through a single isolated SPI interface.

Most passenger EV platforms use distributed architecture. Most LEV (light electric vehicle) designs use centralised. The right choice depends on cell count, harness packaging constraints, and the balance between simplicity and scalability.

---

## What the BMS Cannot Do

A few misconceptions are worth clearing up directly.

**The BMS cannot fix a bad cell.** If a cell has degraded to 70% of its original capacity, the BMS can report that fact (via SOH), protect against pushing it outside safe limits, and balance the SOC of the string. It cannot restore the lost capacity. Degradation is physical and irreversible.

**The BMS cannot recover lost range.** If SOH has fallen to 80%, 20% of the pack's energy is simply gone. The BMS estimates the situation accurately, but estimation is not restoration.

**The BMS is not the charger.** It monitors charging, estimates the pack state, and communicates maximum allowed charge voltage and current to the charger. The charger applies the current. The BMS cannot directly control what comes out of the charger — it can only send limits and open contactors if those limits are violated.

**The BMS is not the motor controller.** The motor controller is a separate ECU. The BMS communicates the maximum discharge current; the motor controller decides what to do with that limit. Traction power, regenerative braking, torque control — none of these are BMS functions.

Understanding these boundaries helps when debugging system-level faults. A range complaint is not automatically a BMS issue. A charging cutoff might be the charger refusing a BMS limit, or the BMS refusing a charger voltage, or a communication failure between them — identifying which requires reading CAN logs from both.

---

## The Rest of This Series

Each post in the BMS Concepts section covers one function in depth. The recommended reading order follows the dependency structure — later topics build on earlier ones.

```
BMS Introduction (this post)
        ↓
OCV vs Terminal Voltage   ← the foundation for all state estimation
        ↓
SOC   ←────────→   SOH
        ↓                ↓
       SOP      Deep Discharge Protection
        ↓
Cell Balancing ←── Analog Front End (AFE)
        ↓
Charging Algorithm
        ↓
Ignition Handling ──→ Battery Paralleling
        ↓
Communication Interface
   ├── CAN
   └── RS-485/232
        ↓
Error Handling / Fault Reporting
        ↓
Thermal Runaway Detection
        ↓
HV Safety Architecture
        ↓
BMS During a Drive (narrative walkthrough)
```

If you are already familiar with a topic, you can jump in anywhere. If you are new to BMS, read in order — each post assumes the previous ones.

---

## Experiments

### Experiment 1: What Happens Without Protection?

**Materials**: 1× 18650 NMC cell, bench power supply with CC/CV mode, INA219 current and voltage sensor + Arduino for logging, NTC thermistor taped to the cell surface, DMM

**Procedure**:
1. Set the power supply to 4.4 V CV, 200 mA CC. Connect the cell and begin logging voltage, current, and temperature at 1-second intervals via the INA219 and Arduino. Run for 15 minutes or until temperature rises more than 5°C above ambient — whichever comes first. Do this in a well-ventilated area with the cell resting on a ceramic tile, not a flammable surface.
2. Let the cell rest for 30 minutes to cool and equilibrate.
3. Set the power supply to 4.2 V CV, 500 mA CC. Repeat the logging run for the same duration.
4. Plot both voltage, current, and temperature traces side by side.

**What to observe**: In the overvoltage run, the cell absorbs current past the point where a correctly limited charger would have tapered to near zero, and temperature rises measurably. In the correctly limited run, the CV phase taper keeps the cell within its rated window and temperature stays flat. This is the physical demonstration of why an overvoltage limit exists — the cell cannot refuse the charge itself.

---

### Experiment 2: Map BMS Signals on a Real Pack

**Materials**: A small commercial Li-ion pack — an e-bike battery with an accessible PCB, or a DIY pack with an exposed BMS board. Multimeter. Logic analyser or oscilloscope (optional). CAN USB adapter + laptop with `candump` or SavvyCAN (optional, if the pack has CAN).

**Procedure**:
1. With the pack disconnected from its load, open the case (if safe to do so) or access the exposed BMS PCB.
2. Identify the cell sense wire connector — the multi-pin connector where individual cell tap wires arrive. Measure the voltage between each adjacent pair of pins; each should read one cell voltage (3.0–4.2 V for NMC, 2.5–3.65 V for LFP).
3. Find the thermistor connector. Measure resistance between its pins with the pack at room temperature — an NTC thermistor will read 10 kΩ at 25°C for most standard values.
4. Find the current sense shunt (a low-value, high-power resistor in series with the main bus) or the Hall sensor. Note its placement relative to the positive or negative main bus conductor.
5. If the BMS has an external CAN connector (many e-bike BMS designs do), connect a CAN USB adapter, set the baud rate to 250k or 500k (try both), and run `candump` or SavvyCAN. Charge the pack via its normal charger and watch the CAN traffic. Look for messages that update with a voltage or percentage value — that is likely the SOC or pack voltage broadcast.

**What to observe**: Build a physical map linking the hardware you can see to the BMS functions described in this post. Every connector you identify — sense wires, thermistors, current sense, CAN — corresponds to a specific measurement or communication function. This connects the abstract system diagram to real hardware.

---

### Experiment 3: Implement the Core Sense-Protect-Act Loop

**Materials**: Arduino Uno or Nano, INA219 breakout, 1× 18650 cell in a single-cell holder, small NPN transistor (2N2222) or N-channel MOSFET (2N7000), LED + 330 Ω resistor, bench power supply set to CC/CV

**Procedure**:
1. Wire the INA219 in series with the cell, measuring both voltage and current. Wire the transistor/MOSFET as a low-side switch on the cell's discharge path; the LED represents the "contactor open" indicator.
2. Write a sketch that:
   - Reads cell voltage and current every 500 ms
   - Turns the LED on (contactor open) if voltage exceeds 4.15 V or falls below 3.0 V, or if current exceeds 1 A
   - Prints a CSV of `timestamp, voltage, current, state` to Serial
3. Connect the bench power supply as a current-limited charger, set to 4.3 V CV / 500 mA CC.
4. Start charging. Watch the serial output and LED. The LED should trip when voltage reaches the 4.15 V threshold.
5. Modify the threshold to 3.0 V (under-voltage). Discharge through a resistive load and watch the LED trip at the discharge endpoint.

**What to observe**: The sense → compare → act loop that every commercial BMS runs — condensed to roughly 30 lines of Arduino code. Voltage is read, compared to a threshold, and a protection output is toggled. The commercial BMS adds measurement accuracy, multiple channels, state estimation algorithms, CAN communication, and hardware-level short-circuit protection — but this loop is the core of it. Understanding it at this level makes the rest of the series make sense.

---

## Further Reading

- **Plett, G.L.** — *Battery Management Systems, Vol. 1: Battery Modeling* (Artech House, 2015) — Chapter 1 provides the formal scope and functional decomposition of a BMS; the rest of the book covers the estimation algorithms in detail.
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* (2010, Artech House) — Part I covers BMS architecture, hardware components, and the design choices between centralised and distributed topologies.
- **Lu, L. et al.** (2013) — "A review on the key issues for lithium-ion battery management in electric vehicles" — *J. Power Sources* 226 — broad survey of BMS functions, estimation methods, and challenges; a good single-paper introduction to the field.
- **Rahimi-Eichi, H. et al.** (2013) — "Battery Management System: An Overview of Its Application in the Smart Grid and Electric Vehicles" — *IEEE Industrial Electronics Magazine* — accessible overview covering both grid and vehicle BMS contexts.
- **Orion BMS User Manual** (Ewert Energy Systems) — a real commercial BMS manual, freely available online. Read it alongside this series — every function discussed here appears with real configuration parameters and CAN message definitions.
- **TI Application Report SLUA848** — "Introduction to Battery Management Systems" — hardware-focused overview from Texas Instruments; covers AFE selection, current sensing, contactor drive, and microcontroller integration.
- **IEC 62619:2022** — Clause 6 defines the protection functions that a compliant BMS must implement; this is the standard-level specification for what "protection" means in a commercial product.
- **ISO 6469-1:2019** — Safety specifications for EV energy storage; defines required BMS protective functions for road vehicles.
- **AIS-156** (India) — Indian performance and safety standard for Li-ion traction batteries; protection thresholds and BMS requirements relevant to the Indian EV market.
- [Open Circuit Voltage vs Terminal Voltage →](./ocv-vs-terminal-voltage.md) — the next post: why the voltage you measure at the cell terminals is not the same as the cell's true electrochemical potential, and why this matters for every state estimation algorithm.
