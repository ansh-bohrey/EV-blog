# Why Your EV Loses Range in Winter — Three Separate Physics Problems

*Prerequisites: [State of Charge (SOC)](../bms_concepts/state-of-charge-soc.md) · [State of Power (SOP)](../bms_concepts/state-of-power-sop.md) · [OCV vs Terminal Voltage](../bms_concepts/ocv-vs-terminal-voltage.md)*
*Next: [EV Nodes — ECU Architecture](./ev-nodes.md)*

---

## It Is Not a Software Bug

Every EV driver in a cold climate has lived this: a January morning, battery showing 100% SOC, range estimate reading 200 km. By the time you reach the highway it is already showing 170 km. By the end of a one-hour drive, you have used 45 km of range to travel 30 km of road.

The standard explanation — "cold weather reduces battery range" — is technically correct and practically useless. It lumps together three distinct physical effects, each operating through a different mechanism, each costing range in a different way. Understanding them separately gives you the vocabulary to reason about cold weather intelligently: to know why the first fifteen minutes are the worst, why preconditioning on grid power matters, why an LFP-chemistry car suffers differently from an NMC car, and why a heat pump is genuinely worth paying for.

This post uses a reference vehicle: a mid-size EV with 60 kWh usable capacity, rated 250 km at 25°C. We will track it on a 0°C winter morning.

---

## Cause 1 — Reduced Usable Capacity

### What the Resistance Is Doing

A lithium-ion cell is not a pure voltage source. It has internal resistance — the combined opposition of the electrolyte, the separator, the electrode particle interfaces, and the current collectors. We model this as R₀ (the ohmic, instantaneous component) plus RC pairs that capture the slower diffusion processes. The [Equivalent Circuit Model post](../intro/equivalent-circuit-model.md) covers this in detail.

R₀ depends strongly on temperature. The relationship follows an Arrhenius form: resistance rises exponentially as temperature drops. As a rough rule of thumb for NMC cells (values are cell-specific and vary with chemistry and electrode design — see Zhang et al. 2003, *J. Power Sources* 115 for measured data): R₀ roughly doubles for every 15–20°C drop in temperature. At 0°C, expect R₀ to be approximately 2–3× its 25°C value for typical NMC. At −10°C, it may be 3–4× higher.

This is not a defect. It is electrochemistry. The lithium ions that must move through the electrolyte during charge and discharge move more slowly when cold, just as viscosity in any fluid increases with cold. The electrolyte conductivity drops, the ion mobility drops, and the effective resistance rises.

### How Resistance Robs Usable Capacity

Under load, the terminal voltage of a cell drops below its open-circuit voltage:

```
V_terminal = OCV − I × R_total
```

The BMS must stop discharging when any cell's terminal voltage reaches V_min — the lower cutoff, typically 2.8–3.0 V for NMC, 2.5 V for LFP. At 25°C with moderate R₀, the cell can deliver essentially all its capacity before V_terminal reaches V_min. At 0°C with elevated R₀, the terminal voltage hits V_min while the cell's OCV is still significantly above its empty-battery level — meaning there is still electrochemical energy in the cell that the BMS cannot safely extract at the current demand level.

Here is a concrete example. Suppose at 25°C, a cell with OCV = 3.4 V and R₀ = 3 mΩ at 50A load shows terminal voltage of 3.4 − (50 × 0.003) = 3.25 V — well above V_min. At 0°C, R₀ is 6 mΩ. Same cell, same current: 3.4 − (50 × 0.006) = 3.1 V. If V_min is 2.8 V, the cell is still safe, but the margin is much smaller. Now push to highway cruising: 100 A draw. At 25°C: 3.4 − (100 × 0.003) = 3.1 V, fine. At 0°C: 3.4 − (100 × 0.006) = 2.8 V — right at V_min. The BMS must cut the drive current or reduce speed to stay within limits.

The result: at cold temperatures, the BMS terminates discharge at a higher remaining OCV — meaning higher remaining energy in the cells — than it would at 25°C. That energy is physically present but electrochemically inaccessible at safe current levels. **As an illustrative range, capacity loss from this effect is often reported as 8–15% of rated capacity at 0°C for NMC cells at moderate C-rates; the exact figure is cell-specific and C-rate dependent** (see Pesaran, NREL, "Battery Thermal Management in EVs and HEVs" for measured data across chemistries).

### The OCV Recovery Effect

After stopping at your destination and parking for an hour, the SOC reading may be higher than when you parked. This is real, not an instrument error. With no current flowing, the concentration gradients in the electrodes equalize, the RC pair voltages relax to zero, and the terminal voltage rises to the true OCV. The OCV then maps to a higher SOC on the OCV-SOC curve. The battery "remembers" that it had more energy than it could deliver under load at that temperature.

This is also why SOC estimation is harder in cold weather. The gap between OCV and terminal voltage is larger and more variable, making voltage-based SOC estimation less reliable. Coulomb counting accumulates errors over a long cold drive. The most accurate SOC fix comes after a long rest when the OCV has fully settled — which is why the range estimate often looks better after an overnight park than after a quick stop.

---

## Cause 2 — SOP Derating

### The Power Limit That Follows from the Resistance

The [SOP post](../bms_concepts/state-of-power-sop.md) explains this calculation in detail. The short version: the BMS continuously computes the maximum current it can safely allow given the current cell voltages, temperatures, and R₀ estimate. At 0°C with elevated R₀, the safe current ceiling is lower than at 25°C.

For discharge, the SOP calculation is essentially:

```
I_max = (OCV − V_min) / R_total
```

With R_total 2× higher, I_max is roughly halved. The BMS publishes this reduced limit on CAN. The VCU reads it and caps the torque request to the motor controller accordingly.

### How Derating Affects Range, Not Just Performance

The obvious effect is reduced peak performance — the car cannot accelerate as hard. The less obvious effect is reduced efficiency.

At highway speed, the traction motor runs at a power level that depends on vehicle speed and road resistance. If the BMS permits full power, the motor operates at its designed operating point with good efficiency. If the BMS derate forces the motor to operate near its current limit for an extended period — say, climbing a hill that would normally be well within the car's power budget — the motor is drawing closer to the maximum allowed current. I²R losses scale as the square of current. If cold weather forces the motor to operate at 90% of its current limit instead of 60%, the I²R losses are (0.9/0.6)² = 2.25× higher. Over a 30-minute highway climb in cold weather, this can meaningfully reduce energy-per-km efficiency.

**Effective range impact: 5–10% in typical cold weather driving**, more in terrain with sustained climbs.

### Recovery During the Drive

The SOP derating at cold startup is the worst it will be. As the pack discharges, the I²R heating within the cells raises cell temperature. After 20–30 minutes of highway driving, a pack that started at 0°C may warm to 15–20°C. At 15°C, R₀ is 1.3–1.5× its 25°C value instead of 2–3×. The SOP limit recovers substantially.

This is why EV drivers in cold climates report that the car "wakes up" after the first 15–20 minutes on the highway. The range estimate stabilizes, the acceleration feels more normal, and the power feels less restricted. The battery literally warming itself up is the cause.

---

## Cause 3 — Heating Energy Cost

This is the largest single factor in most climates, and it is the one that surprises people who come from ICE vehicles.

### The Petrol Car's Free Lunch

A petrol engine converts roughly 25–35% of fuel energy to mechanical work. The remaining 65–75% is waste heat — dumped through the radiator, the exhaust, and the engine block. In cold weather, the driver asks for some of this waste heat to be redirected into the cabin via the heater core. The energy cost to the driver is effectively zero: the engine was going to waste that heat anyway.

An EV has no engine and no waste heat. The traction motor is extremely efficient: 90–97% of electrical energy becomes mechanical work, with only 3–10% as heat. That small amount of waste heat from the motor and inverter is not enough to heat a cabin at −5°C. All cabin heating must come from the traction battery.

### Resistive PTC Heating

Most EV heaters use a PTC (Positive Temperature Coefficient) resistive element — essentially an electric heater. PTC heaters are simple, reliable, and safe (they self-limit their power as they heat up). They are also the least efficient way to generate heat: 1 kWh of electricity produces exactly 1 kWh of heat.

On a cold day with the cabin heater running at a typical 3–5 kW continuously (actual draw varies by vehicle size, insulation, and target cabin temperature):

- 4 kW heater running for 1 hour = 4 kWh from the traction battery
- Our 60 kWh pack at 250 km range uses energy at ~4 kWh per 60 km
- 4 kWh of heating = 60 km of lost range per hour of driving
- On a 1.5-hour winter commute: 6 kWh to heating = 90 km of range lost before the wheels start turning

This is not a rounding error. It is the dominant range loss mechanism in cold weather for vehicles without a heat pump.

### Heat Pump — The Efficiency Multiplier

A heat pump does not generate heat from electricity — it moves heat from a cold reservoir to a warm one, using electricity to drive the process. In an EV heat pump, the cold reservoir is the outside air (even at −10°C, there is thermal energy in the air) and the warm reservoir is the cabin.

The efficiency of a heat pump is measured as its Coefficient of Performance (COP): how many kWh of heat are delivered per kWh of electricity consumed. The following are illustrative values — actual COP depends on refrigerant circuit design, ambient temperature, and operating point:

- Resistive heater COP: exactly 1.0 (1 kWh in, 1 kWh of heat out)
- Heat pump COP at +5°C ambient: typically 2–4
- Heat pump COP at −10°C ambient: typically 1.5–2.5
- Heat pump COP at −20°C ambient: often approaches resistive efficiency; many vehicles add resistive supplemental heating below this point

At +5°C with a COP of 3: the heat pump delivers 3 kWh of heat for every 1 kWh of electricity. The same 4 kWh of heating that a resistive heater needs now costs 1.3 kWh from the pack. The range penalty drops substantially.

**This is why heat pumps have a measurable impact on real-world winter range — not a marginal one.** Fleet data from Recurrent Auto shows that EVs with heat pumps retain materially more range in cold conditions than EVs with resistive heating. Recurrent's published analysis reports approximately 83% range retention for heat-pump vehicles vs approximately 75% for resistive-only vehicles in cold conditions (roughly 17% vs 25% loss), though this varies by model and climate. (Source: recurrentauto.com/research/how-does-cold-weather-affect-ev-range.)

Heat pumps lose effectiveness at very low temperatures (below −15°C to −20°C) because there is less thermal energy to extract from the ambient air. Many vehicles switch to resistive heating as a supplement or fallback at these extremes. But for the temperature range that covers most of Europe, North America, and East Asia in winter, the heat pump operates in its efficient range.

### Battery Heating

The battery itself requires heating in cold weather — both for performance (keeping R₀ manageable) and for safe charging (lithium plating risk during charging at low temperatures). The BMS monitors cell temperatures and, when below a threshold, activates battery heating.

Battery heating energy: typically 0.5–1.5 kWh to raise a large pack from −10°C to operational temperature (around 15°C), depending on pack mass and thermal insulation. This is a smaller effect than cabin heating, but it matters:

- If battery heating runs from pack energy (driving without preconditioning): 0.5–1 kWh deducted from range before the first kilometre
- If battery heating runs from grid power while plugged in (preconditioning): zero range cost

### The Full Winter Energy Budget

The following is an illustrative scenario based on the reference vehicle (60 kWh, 250 km rated, 0°C ambient, 1-hour highway drive). Individual line items are representative estimates, not measured values for a specific vehicle:

| Energy Item | Summer (25°C) | Winter (0°C, resistive heat) | Winter (0°C, heat pump) |
|---|---|---|---|
| Propulsion | 20 kWh | 20 kWh | 20 kWh |
| Cabin heating | 0 kWh | 4 kWh | 1.5 kWh |
| Battery heating (startup) | 0 kWh | 0.5 kWh | 0.5 kWh |
| Increased rolling resistance (cold tires, lubricants) | 0 kWh | 0.5 kWh | 0.5 kWh |
| Higher I²R (SOP derating effect) | 0 kWh | 1.0 kWh | 1.0 kWh |
| **Total** | **20 kWh** | **26 kWh** | **23.5 kWh** |
| **Equivalent range for 60 kWh pack** | **250 km** | **192 km** | **213 km** |
| **Range reduction** | — | **−23%** | **−15%** |

The reduced capacity effect (Cause 1) acts on top of this by making fewer than 60 kWh actually usable — perhaps only 52 kWh at 0°C — so the actual achievable range is lower than the table implies.

---

## What Preconditioning Does (and Does Not Fix)

Preconditioning means using grid power to warm the battery and cabin before unplugging and departing. Most EVs support scheduling this via the car's app or touchscreen.

**What preconditioning fixes**:

*Cabin heating cost*: heating the cabin from cold while plugged in shifts that 3–4 kWh energy cost from the traction battery to the grid. You unplug with a warm cabin and a full battery. Net range effect: large positive.

*Battery temperature*: warming the battery from 0°C to 15°C before departure recovers a significant fraction of the capacity and SOP derating described above. If the battery is at 15°C when you pull out of the garage, Cause 1 and Cause 2 are both substantially reduced for the initial drive.

**What preconditioning does not fix**:

*Temperature drop during the drive*: if your commute is short (15–20 minutes) and temperatures are very cold, the pack may not fully self-heat during the drive. The cells cool back down between preconditioning and the next morning unless you plug in again.

*Cold tires and higher rolling resistance*: cold rubber is stiffer, and cold drivetrain lubricants are thicker. These add 2–3% to energy consumption regardless of battery temperature.

*Reduced regen acceptance when charging into a cold pack*: a cold pack has a lower charge acceptance limit (the BMS will restrict the max charge current to prevent lithium plating). This means regen braking is softer at startup on a cold morning — not enough to matter for range, but noticeable for drivers who rely on one-pedal driving.

**Best practice**: schedule preconditioning to finish 5–10 minutes before departure. The battery and cabin cool the moment you unplug, so timing matters. Plug in every time you park — even for a 30-minute stop — to keep the battery thermal management active on grid power rather than traction battery power.

---

## Chemistry Differences

**NMC (Nickel Manganese Cobalt)**: the dominant chemistry in most passenger EVs. Moderate cold sensitivity. R₀ increase at 0°C is roughly 2–3×. OCV curve is sloped enough that the BMS can still estimate SOC reasonably from voltage.

**LFP (Lithium Iron Phosphate)**: used in entry-level vehicles and second-generation Tesla Model 3/Y base variants. Worse cold performance than NMC for two reasons. First, LFP's flat OCV-SOC curve (OCV barely changes from 10% to 90% SOC) makes voltage-based SOC estimation almost useless when cold — the BMS relies almost entirely on Coulomb counting. Second, LFP's lower nominal voltage (3.2 V vs 3.6 V for NMC) leaves less headroom between operating voltage and V_min, so the cell hits the cutoff sooner under cold-temperature voltage drop.

**NCA (Nickel Cobalt Aluminium)**: used in some Tesla models. Higher energy density than NMC but similar cold behaviour.

**Practical implication**: LFP vehicles will show larger winter range losses than equivalent NMC vehicles, even at equal capacity. Tesla's LFP Model 3 base trim loses more winter range percentage than the NMC Long Range trim of the same model.

---

## Real-World Data Points

Fleet analysis from Recurrent Auto (aggregated from thousands of real-world North American EVs; see recurrentauto.com/research/how-does-cold-weather-affect-ev-range for their published methodology):
- Heat-pump vehicles: approximately 83% range retention in cold conditions (~17% reduction)
- Resistive-only vehicles: approximately 75% range retention (~25% reduction)
- Spread varies significantly by model, climate, and driving style

ADAC (Germany) annual winter range tests: ADAC publishes annual cold-weather range tests for European-market vehicles. Results vary by model and year; as a general characterisation, many vehicles deliver substantially below their WLTP rated range at 0°C ambient (which includes cabin heating loads). Heat pump models tend to retain more range. Check ADAC's current published test data (adac.de) for specific model figures, as the spread across vehicles is wide.

SAE J1634 (the official US range test procedure) is conducted at 23°C ± 5°C with a specific test cycle, per the standard's specified test conditions. WLTP (European) is similarly a moderate-temperature standard. Published range figures are not winter figures — the gap between EPA/WLTP and real cold-weather performance is not manufacturer deception. It is the three effects described in this post.

---

## Experiment 1 — Measure Capacity Reduction at Different Temperatures

**Materials**: one 18650 NMC cell, Arduino Uno + INA219 current/voltage sensor, a constant-current load (or a 5 Ω power resistor as a fixed load), thermometer, access to a refrigerator.

**Procedure**:
1. Charge the cell fully at room temperature (25°C). Rest 1 hour.
2. Discharge at a fixed current (0.5–1 A) to cutoff voltage (2.8 V). Record total Ah using the INA219. This is your baseline capacity.
3. Re-charge. Bring the cell to ~10°C (partial fridge cooling). Re-measure.
4. Re-charge. Bring the cell to ~5°C (deeper cooling). Re-measure.
5. Plot delivered Ah vs temperature.

**What to observe**: capacity decreases at each temperature step. Calculate the loss as a percentage of the 25°C baseline. At 5°C you should see 5–10% reduction at 0.5C rate; more at higher rates. This directly demonstrates Cause 1 with hardware that costs under $10.

---

## Experiment 2 — Internal Resistance vs Temperature

**Materials**: same cell and INA219 setup.

**Procedure**:
1. Bring cell to ~50% SOC at each test temperature. Rest 30 minutes for voltage to settle.
2. Apply a 1A pulse for 10 seconds. Record voltage immediately before the pulse and at the 10-second mark.
3. DCIR = ΔV / ΔI = (V_rest − V_10s) / 1 A.
4. Test at 30°C, 20°C, 10°C, 5°C, 0°C.

**What to observe**: DCIR rises as temperature drops — roughly doubling from 25°C to 0°C for most 18650 NMC cells. This is the R₀ increase that drives both Cause 1 (capacity derating) and Cause 2 (SOP derating). Compare your measured values to the cell's datasheet if available.

---

## Experiment 3 — Heating Power Budget

**Materials**: NTC thermistor + Arduino, small insulated box (styrofoam cooler), a small PTC heater element (from an inexpensive hand warmer or 12V car heater), 12V power supply or battery, multimeter for power measurement.

**Procedure**:
1. Place thermistor inside the box, set up the heater, measure heater power (V × I).
2. Start with box at 0°C. Run heater. Log temperature every 30 seconds.
3. Calculate total energy consumed (power × time in kWh).
4. Scale to a car: a typical EV cabin heater runs at 3–5 kW. If your 10 W heater consumed 0.003 kWh in 15 minutes, a 4 kW heater would consume 2 kWh in the same time — equivalent to losing 20 km of range.

**What to observe**: intuition for energy cost of heating. The numbers become concrete when you calculate the range-equivalent energy at your own scale.

---

## Further Reading

**Core Papers**
- Pesaran, A.A. (NREL) — "Battery Thermal Management in EVs and HEVs" — NREL technical report, free download; quantifies temperature effects on capacity and power across chemistry types
- Zhang, S.S. et al. (2003) — "The low temperature performance of Li-ion batteries" — *J. Power Sources* 115 — direct measurement of capacity vs temperature at multiple C-rates
- Ji, Y. & Wang, C.Y. (2013) — "Heating strategies for Li-ion batteries operated from subzero temperatures" — *Electrochimica Acta* — covers battery heating methods including AC heating and self-heating

**Online / Real-World Data**
- Recurrent Auto — "How Does Cold Weather Affect EV Range?" — fleet data analysis with model-by-model breakdown
- ADAC — annual winter EV range tests — detailed real-world data for European-market vehicles
- Battery University — "BU-502: Discharging at High and Low Temperatures"

**Standards**
- IEC 62660-1 — includes cold temperature performance test methods for EV cells
- SAE J1634 — BEV energy consumption and range test procedure (explains why official figures are 25°C figures)
