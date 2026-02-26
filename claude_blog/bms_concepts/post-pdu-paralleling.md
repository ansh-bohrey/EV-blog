# Post-PDU Paralleling — Connecting Multiple Battery Packs Safely

*Prerequisites: [Ignition Handling →](./ignition-handling.md), [Battery Pack & Module Architecture →](../battery/battery.md)*
*Next: [Thermal Runaway Detection & Handling →](./thermal-runaway-detection-handling.md)*

---

## The Temptation of Just Connecting Them

A single 100 kWh battery pack weighs roughly 600 kg and occupies most of the floor of a large EV. For a long-haul electric truck needing 500+ km range, or a grid storage installation requiring megawatt-hours of capacity, a single pack is not enough. The instinct is straightforward: connect two packs in parallel, double the capacity, done.

The reality is considerably less simple. Two battery packs on a shared HV bus with mismatched voltages — even a difference of a few volts — will exchange energy instantaneously and violently the moment their connection is made. The path impedance of EV-scale HV cabling is measured in milliohms. A 5 V mismatch across a 10 mΩ path produces 500 A instantaneously, in the first microseconds of connection, before any protection firmware has had time to react.

At 500 A peak, contactors can weld shut permanently. Fast-acting HV fuses can blow. Bus voltage can collapse enough to crash the inverter. The resulting shock can trigger BMS protection faults in both packs simultaneously, leaving the vehicle stranded with both packs isolated. In severe cases the inrush current spike generates enough localised heating to initiate thermal events in cabling or connectors.

Post-PDU paralleling is the engineering discipline that makes multi-pack connection safe and reliable. It is not exotic — it is a structured sequence of measurements, pre-charge, and coordination that gives controlled paralleling the same safety properties as the single-pack pre-charge sequence you learned in [Ignition Handling](./ignition-handling.md).

---

## What the PDU Is

The **Power Distribution Unit (PDU)** — sometimes called the HV junction box or battery junction box — is the HV switching centre for the traction battery. It houses the main contactors, pre-charge relay, HV fuses, service disconnect, and in many designs the manual service plug that isolates the pack for maintenance. Everything the pack energises passes through the PDU.

**Post-PDU paralleling** means connecting two packs on the HV bus side — the output side — of each pack's own PDU. Each pack has its own contactors, its own fuses, its own BMS. They share the external HV bus that connects to the inverter, charger, and DC-DC converter.

This is distinct from parallel cell strings within a single pack (handled internally during pack assembly) and from series-connected packs (used to achieve higher voltage, not higher capacity). Post-PDU paralleling specifically adds capacity at the same voltage by paralleling two independently managed packs at system level.

---

## Two Tanks at Different Heights

Imagine two water tanks sitting on stands at slightly different heights, connected by a wide pipe with a valve in the middle. Open the valve instantly: the pressure difference drives a violent surge of water from the higher tank to the lower one. Water hammers through the pipe. The valve mechanism takes the full shock. Both tanks oscillate as the water sloshes before settling.

Now open the valve slowly, through a restriction. The restriction limits flow rate. The tanks equalise gradually. By the time the restriction is removed and the valve opens fully, the levels are nearly equal — the pressure difference is minimal and the transition is smooth.

This is exactly what **pre-charge** does when paralleling two packs. The pre-charge contactor places a current-limiting resistor in series with the parallel connection path. The resistor limits the inrush current to a safe level while the bus voltages equalise. When the voltage difference has dropped to near zero, the main parallel contactor closes and the resistor is bypassed.

The physics is not complicated. What matters is that the sequence is followed exactly and that the BMS verifies each step before proceeding.

---

## The Physics of Uncontrolled Paralleling

Consider two packs:
- Pack 1: 400 V, fully charged, on the HV bus powering the inverter
- Pack 2: 395 V, cooling after a partial discharge, ready to be added

Total series impedance of the connection path — cable resistance, contactor contact resistance, connector resistance — is approximately 10 mΩ.

<iframe src="../../assets/bms-concepts/post-pdu-inrush.html" width="100%" height="380" frameborder="0"></iframe>

Peak inrush current if connected directly:

```
I_peak = ΔV / R_path = (400 - 395) / 0.010 = 500 A
```

This 500 A peak decays with a time constant τ = L/R, where L is the cable inductance — typically a few microhenries for EV-scale HV cables. The peak is brief (microseconds to tens of microseconds) but intense. Energy dissipated in the contact resistance during the inrush:

```
E = 0.5 × C_bus × ΔV² = 0.5 × C_bus × 25
```

Where C_bus is the bus capacitance (inverter film capacitors, cable capacitance — typically 100–2000 µF in an EV powertrain). For 1000 µF: E = 12.5 J, deposited in milliohm resistances in microseconds. That is more than enough to arc contacts, vaporise thin conductors, and initiate weld failures.

Even a 1 V mismatch at 10 mΩ produces 100 A. At EV bus impedances, millivolt differences are meaningful. The only safe approach is to limit inrush with a resistor and verify equalisation before making the low-impedance connection.

---

## Pre-Charge Sequence for Safe Paralleling

The paralleling sequence is a state machine executed by the master BMS (or system BMS coordinating the two packs). The sequence must not proceed to the next step without positive confirmation of the previous step's outcome.

**Step 1 — Voltage verification**: the master BMS reads Pack 1 terminal voltage (already on bus) and Pack 2 terminal voltage (isolated, measured by Pack 2 BMS and reported over inter-pack CAN). The difference must be within a defined tolerance — typically ±5 to ±10 V for a 400 V system. If ΔV exceeds the tolerance, paralleling is refused and the operator must pre-equalise the packs.

**Step 2 — Close Pack 2 pre-charge contactor**: a contactor with a series resistor (typically 10–40 Ω, sized to limit peak inrush to a safe level while allowing the bus to equalise in a reasonable time) connects Pack 2 to the shared bus through the resistor.

**Step 3 — Monitor equalisation**: Pack 2 BMS monitors the current flowing through the pre-charge path. As bus voltage equalises, the current decreases. The BMS also monitors Pack 2 terminal voltage rising toward Pack 1 bus voltage.

**Step 4 — Equalisation confirm**: when the current through the pre-charge path drops below a threshold (typically < 2–5 A) and the voltage difference is confirmed small (< 1 V), the equalisation is complete. The transition to main contactor must happen promptly — the pre-charge resistor is dissipating power and will overheat if the pre-charge phase lasts too long.

**Step 5 — Close Pack 2 main contactor**: the main parallel contactor closes, providing the full low-impedance connection between Pack 2 and the bus.

**Step 6 — Open Pack 2 pre-charge contactor**: with the main contactor closed, the pre-charge resistor is bypassed. Opening the pre-charge contactor removes the resistor from the circuit. Pack 2 is now on the bus.

**Step 7 — Confirm parallel operation**: both packs now share the HV bus. Master BMS monitors current distribution between them.

If any step fails — pre-charge contactor does not close, voltage does not equalise within the timeout window, main contactor feedback indicates it did not close — the sequence is aborted and all Pack 2 contactors are opened. The fault is logged and reported. See [Error Handling & Fault Reporting](./error-handling-fault-reporting.md) for how contactor faults are classified and communicated.

---

## Voltage Matching Requirement

The allowable ΔV before paralleling is not arbitrary — it derives directly from the inrush current calculation and the pre-charge resistor value:

```
I_peak_with_precharge = ΔV / R_precharge
```

For a 20 Ω pre-charge resistor and a 10 V ΔV tolerance: I_peak = 10 / 20 = 0.5 A — completely benign. But if the operator attempts to parallel packs with a 50 V mismatch: I_peak = 50 / 20 = 2.5 A through the resistor, with the resistor dissipating up to 125 W instantaneously. A 20 Ω 5 W resistor would fail immediately.

This is why the voltage check in Step 1 is not advisory. It is a hard gate. The BMS must refuse the parallel command if ΔV exceeds the limit, regardless of operator or system pressure to proceed.

**Pre-equalisation**: when two packs are at significantly different voltages — one fully charged, one half depleted — the operator must first bring them closer together before paralleling is possible. This means either:
- Charging Pack 2 to match Pack 1 via the onboard charger (if Pack 2 is lower)
- Discharging Pack 1 through a resistive load or the drive system until it drops to match Pack 2 (uncommon)
- Accepting a longer, slower pre-charge time with a higher-resistance pre-charge path (impractical for large ΔV)

Most multi-pack systems design the operational workflow to avoid large ΔV at paralleling time by scheduling when each pack is brought online relative to its SOC.

---

## Current Sharing During Parallel Operation

Once two packs are sharing the HV bus, they share load current. In an ideal world with identical packs and identical cabling, the split is exactly 50/50. In the real world, it is not.

Current sharing between two parallel packs is governed by their internal resistances:

```
I₁ / I₂ = R₂ / R₁
```

A newer pack with lower internal resistance takes a larger share of the total current than an older, higher-resistance pack. This is a passive balancing effect — it is self-correcting in the sense that the lower-resistance pack naturally carries more, which tends to warm it slightly and raise its resistance — but at high current rates the imbalance can be significant. A 2:1 resistance ratio between a new and an aging pack produces a 2:1 current split: the new pack ages faster because it is working harder, which accelerates the convergence of their resistances over time.

**Circulating currents** are a subtler problem. If Pack 1 and Pack 2 have different open-circuit voltages — different SOCs — a circulating current flows even with zero external load. The higher-voltage pack slowly charges the lower-voltage pack through the bus impedance. This is conceptually useful (passive equalisation) but imposes I²R losses in the cabling, contactors, and fuses continuously, even when the vehicle is parked. The magnitude is:

```
I_circulating = (V_OCV1 - V_OCV2) / (R_internal1 + R_internal2 + R_cable)
```

For a 2 V OCV difference and 50 mΩ total series resistance: I_circulating = 40 A — not negligible. The master BMS monitors this and may open Pack 2's contactor if the circulating current exceeds a defined limit during extended parking.

---

## BMS Architecture for Multi-Pack Systems

Single-pack BMS architecture — one BMS, one pack, one set of contactors — does not extend directly to multi-pack. Each pack's BMS retains full autonomy for its own cells: cell voltage monitoring, temperature monitoring, per-cell balancing, and protective disconnect if its own pack develops a fault. This is non-negotiable: removing per-pack autonomy would mean that a fault in the master coordinator leaves all packs unprotected.

Above the per-pack layer sits a **Master BMS** (or System BMS). Its responsibilities:

- **Pre-parallel voltage match check**: reads Pack 1 and Pack 2 voltages via inter-pack CAN, compares them, gates the parallel command.
- **Paralleling sequence execution**: drives the state machine described above, confirms each step via CAN feedback.
- **Current sharing monitoring**: reads each pack's current sensor, monitors the ratio, flags an imbalance fault if one pack is taking significantly more than its expected share.
- **Combined SOC and SOP reporting**: aggregates individual pack states into a system-level SOC (weighted average by capacity) and SOP (sum of individual power limits) that it reports to the VCU.
- **Fault isolation**: if Pack 2's BMS reports an internal cell fault, the master BMS coordinates the removal of Pack 2 from the bus — commanding Pack 2's contactors to open — while keeping Pack 1 operational. The vehicle limps home on one pack rather than losing all power.

Inter-pack communication uses a dedicated CAN bus segment or a sub-network. In large multi-pack systems (grid storage with many racks), the master BMS may communicate over CAN, RS-485, or Ethernet depending on the application.

---

## Passive Isolation Alternatives

Not all multi-pack architectures use active pre-charge sequencing. **String diodes** — high-current diodes in series with each pack's positive terminal — provide passive isolation. The higher-voltage pack forward-biases its diode and supplies current; the lower-voltage pack's diode is reverse-biased and that pack is effectively isolated until its OCV rises high enough to contribute.

String diodes are simple and fail-safe (they cannot create inrush; the diode limits current until OCV equalises). The drawbacks: the forward voltage drop across each diode (0.5–1.5 V for fast-recovery diodes, less for Schottky) represents a continuous power loss that is non-trivial at high current. And string diodes allow current to flow into each pack but not out of it (diode blocks reverse current), which prevents the packs from contributing regenerative braking energy back through the diode — a significant limitation in EV applications.

**OR-ing FETs** — MOSFETs used in the same topology as string diodes but with controlled gate drive — replace the diode drop with the FET's R_DS(on) (typically <1 mΩ for a large power MOSFET), eliminating most of the forward-drop loss. They also allow bidirectional current under gate control, solving the regeneration problem. OR-ing FET controllers are available as integrated ICs (e.g., LTC4370) that implement the same paralleling function as string diodes but with active gate drive and much lower voltage drop. For high-current multi-pack EV applications, OR-ing FETs are generally preferred over string diodes.

---

## Real-World Applications

**Electric trucks and buses**: range requirements often exceed what a single pack can provide in the available floor area. Two packs — front and rear of the frame — are paralleled at the HV bus. The BMS architecture must handle road vibration affecting contactor feedback, different thermal environments for the two packs (engine bay heat near the front pack), and potentially different aging rates.

**Second-life repurposing**: used EV cells with different SOH values are often combined in grid storage applications. The different internal resistances and OCV curves make current sharing and circulating current management critical. The master BMS must actively monitor and manage packs that are electrically mismatched in ways that new-pack systems never see.

**DIY and conversion builds**: dual-pack EV conversions often use surplus EV packs. The absence of a master BMS in many DIY builds makes this a common source of contactor welding and fuse failures — the physics of paralleling does not care whether the build is DIY or OEM.

---

## Experiments

### Experiment 1: Measure Inrush Current with Two 18650 Cells

**Materials**: 2× 18650 NMC cells at different SOC (one at ~4.0 V, one at ~3.7 V), INA219 + Arduino, 10 Ω pre-charge resistor, a jumper wire as the "main switch", oscilloscope or fast data logger (Arduino at 1 ms sample rate as an approximation).

**Procedure**:
1. Charge Cell A to ~4.0 V and Cell B to ~3.7 V. Measure and record OCV of both.
2. Connect them in parallel through the INA219's shunt, with no series resistor. Log current at the fastest sample rate the Arduino supports (~1 ms). Record the peak current reading.
3. Repeat, but insert the 10 Ω resistor in series. Log the current — it should be much lower, rising then decaying as the cells equalise.
4. Compare the measured peak current without resistor to the theoretical: I = ΔV / R_shunt (the INA219 shunt is 100 mΩ, so I = 0.3 V / 0.1 Ω = 3 A — measurable and visible, but safe at cell scale).

**What to observe**: The difference in peak inrush between the direct-connect and pre-charge cases. Even at 18650 cell scale, the inrush is measurable and the pre-charge resistor clearly limits it. Extrapolate to EV scale: the same physics with ΔV = 5 V and R_path = 10 mΩ produces 500 A — an inrush that would destroy components and weld contactors.

---

### Experiment 2: Simulate the Pre-Charge State Machine in Firmware

**Materials**: Arduino Uno, INA219, 2× 18650 cells at different SOC, relay module (or MOSFET board) to simulate the pre-charge contactor, 10 Ω resistor, LED as "main contactor closed" indicator.

**Procedure**:
1. Wire Cell 2 through the pre-charge resistor and relay, with Cell 1 representing the "bus". The INA219 monitors current in the pre-charge path.
2. Write a state machine in Arduino firmware with states: IDLE → VOLTAGE_CHECK → PRECHARGE → EQUALISED → MAIN_CLOSE → PARALLEL_RUNNING.
3. In VOLTAGE_CHECK: read both cell voltages (estimate from the INA219 and a voltage divider on Cell 2). If ΔV > 0.3 V, refuse the sequence and print "VOLTAGE MISMATCH — PRE-EQUALISE REQUIRED". If ΔV ≤ 0.3 V, advance to PRECHARGE.
4. In PRECHARGE: close the pre-charge relay. Poll current every 100 ms. When current < 50 mA, advance to MAIN_CLOSE.
5. In MAIN_CLOSE: illuminate the LED, print "MAIN CONTACTOR CLOSED". Enter PARALLEL_RUNNING.

**What to observe**: The state machine advancing through each step and the current trace falling during the pre-charge phase. Deliberately test the VOLTAGE_CHECK gate — charge one cell higher than the threshold and confirm the state machine refuses to proceed. This is the core logic that prevents inrush in a real system.

---

### Experiment 3: Current Sharing Imbalance Measurement

**Materials**: 2× 18650 cells with different internal resistances (an old cell and a new cell), 2× INA219 modules (one per cell), Arduino, matching resistive load.

**Procedure**:
1. Charge both cells to the same voltage (same SOC, ~3.8 V). Measure internal resistance of each using a pulse discharge test: ΔV / ΔI at a known step current.
2. Connect both cells in parallel through their respective INA219 sensors. Connect a fixed resistive load (5–10 Ω).
3. Log current from each INA219 simultaneously at 200 ms intervals.
4. Compute the ratio I_cell1 / I_cell2 and compare to the theoretical R_cell2 / R_cell1.

**What to observe**: The cell with lower internal resistance supplies more current — the ratio should approximately match the theoretical inverse resistance ratio. This makes concrete the current sharing imbalance that a master BMS must monitor. In a real EV, the cell with lower resistance is doing more work, aging faster, which accelerates the convergence of their resistances. Log for several minutes and observe whether the ratio shifts as the cells warm slightly under load.

---

## Further Reading

- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* (2010) — Ch. 5 covers multi-pack architectures, string diodes vs active paralleling, and master/slave BMS coordination. The clearest available treatment of the engineering tradeoffs.
- **Plett, G.L.** — *Battery Management Systems, Vol. 2* (Artech House, 2015) — covers SOC and SOP estimation for multi-pack systems, including how aggregated state estimation differs from single-pack estimation.
- **Linear Technology (Analog Devices) LTC4370 Datasheet** — OR-ing FET controller for multi-source systems. The application section explains the current-sharing and prevention-of-reverse-current functions that parallel multi-pack connections.
- **SAE J1772 / IEC 62196** — EV charging interface standards that define how the vehicle communicates charge current limits to the EVSE — relevant when a multi-pack system is charging and the master BMS must coordinate charging limits across two packs.
- **Orion BMS 2 User Manual** — Chapter on "Master/Slave configuration" and "Cell Voltage Balancing" describes how a production BMS handles multi-unit coordination. Publicly available and directly applicable.
- **IEC 62619:2022** — Safety requirements for secondary lithium cells and batteries for use in industrial applications — relevant for grid storage multi-pack systems.
- [Ignition Handling →](./ignition-handling.md) — pre-charge sequence for a single pack, which the multi-pack sequence extends.
- [Error Handling & Fault Reporting →](./error-handling-fault-reporting.md) — how contactor faults, communication faults between master and slave BMS, and current sensor plausibility checks apply in multi-pack systems.
- [State of Health (SOH) →](./state-of-health-soh.md) — how differing SOH between two parallel packs affects internal resistance matching and current sharing over time.
- [Battery Pack & Module Architecture →](../battery/battery.md) — physical pack construction context for understanding what is being paralleled and where the PDU sits in the HV system.
