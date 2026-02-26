# State of Power (SOP) — The Instantaneous Performance Budget

*Prerequisites: [OCV vs Terminal Voltage →](./ocv-vs-terminal-voltage.md), [State of Charge (SOC) →](./state-of-charge-soc.md)*
*Next: [Deep Discharge Protection →](./deep-discharge-protection.md)*

---

## Why 50% SOC Can Feel Like 10%

SOC tells you how much energy is stored. SOP tells you how fast you can get it out *right now*.

A cold winter morning. Battery at 50% SOC. You press the accelerator — the car responds sluggishly, noticeably slower than on a warm day. Nothing is wrong with the battery in any permanent sense. The energy is there. But the internal resistance is too high in the cold to deliver it at full power without the terminal voltage collapsing below the safe minimum.

The same logic works in reverse: pressing the regen braking paddle on a full battery produces weak braking. The battery cannot absorb the regenerated energy quickly because it is nearly at maximum charge — there is no voltage headroom left.

**State of Power (SOP)** is the BMS's answer to the real-time question: given the current SOC, SOH, and temperature, what is the maximum power I can safely deliver or absorb right now? It is expressed in watts or kilowatts at the pack level, updated continuously, and published on the CAN bus to the vehicle control unit.

---

## The Formal Definition

**SOP_discharge** is the maximum power the pack can continuously deliver for a specified pulse duration (typically 10 seconds by USABC convention) without any cell's terminal voltage dropping below V_min.

**SOP_charge** is the maximum power the pack can absorb for the same pulse duration without any cell's terminal voltage rising above V_max.

Both are functions of:
- **SOC**: less remaining capacity means less OCV headroom against V_min
- **SOH**: a degraded cell has higher internal resistance, less voltage headroom for the same current
- **Temperature**: cold cells have substantially higher resistance; hot cells have reduced thermal margin
- **Pulse duration**: a 2-second pulse allows more current than a 10-second pulse, because shorter-duration loads do not build up as much diffusion overpotential

This last point is important: SOP is not a single number, it is a function of time horizon. The BMS typically publishes separate values for different timescales — a 2-second peak power limit for transients and a 10-second sustained limit for calculating accelerator pedal response.

---

## What Limits Power

The fundamental constraint is that terminal voltage must stay within [V_min, V_max] during the current pulse. The Thevenin ECM makes this concrete:

During discharge:
```
V_T = OCV − I × R_total ≥ V_min
→ I_max = (OCV − V_min) / R_total
→ SOP_discharge = I_max × V_min  (conservative approximation)
```

During charge:
```
V_T = OCV + I × R_total ≤ V_max
→ I_max = (V_max − OCV) / R_total
→ SOP_charge = I_max × V_max
```

This shows immediately why SOP shrinks at the extremes of SOC:
- At low SOC, OCV is low → (OCV − V_min) is small → I_max is small → discharge SOP is low
- At high SOC, OCV is high → (V_max − OCV) is small → I_max is small → charge SOP (regen) is low

And why temperature matters so much: R_total roughly doubles from 25°C to 0°C in typical NMC chemistries — an approximate rule of thumb; actual factor depends on cell design (Plett 2015). Double R_total → half I_max → half SOP. A 100 kW pack at room temperature might deliver roughly 50 kW at −10°C — an illustrative order-of-magnitude scenario; actual reduction depends on cell chemistry and pack thermal design — the energy is present, but the physics of ion transport through cold electrolyte prevent extracting it at full rate.

---

## Internal Resistance — The Key Parameter

**DC internal resistance (DCIR)** is the single most important determinant of SOP:

```
DCIR = ΔV / ΔI = (V_OCV − V_loaded) / I
```

It is measured by applying a known current step and measuring the immediate voltage drop. This R includes ohmic resistance (R₀ from the ECM — contact resistance, electrolyte conductance, SEI), charge transfer resistance, and some diffusion contribution depending on pulse duration.

DCIR is a strong function of temperature. The Arrhenius relationship governs ion mobility in the electrolyte:

<iframe src="../assets/claude_assetsplan/bms-concepts/rint-temperature-chart.html" width="100%" height="380" frameborder="0"></iframe>

Typical NMC internal resistance values (illustrative ranges from published 21700 cell characterisation; actual values are cell-design and SOC dependent):
- At 25°C: 40–100 mΩ for a single 21700 cell at mid-SOC
- At 0°C: 80–200 mΩ (roughly 2× increase)
- At −20°C: 200–500 mΩ (4–10× increase at very low temperature)

At pack level, cell resistances in series sum, but in parallel-series configurations (e.g., 4P×96S), cells in parallel reduce effective resistance. A 100S4P pack has 1/4 the internal resistance per cell pair compared to a 100S1P pack, enabling four times the current for the same voltage drop.

---

## The HPPC Test — Where SOP Data Comes From

Before a BMS can estimate SOP in the field, the cell's resistance-SOC-temperature map must be characterised in the lab. The standard protocol is the **Hybrid Pulse Power Characterization (HPPC) test**, defined by the USABC.

![HPPC test waveform: discharge pulse, rest, regen pulse, rest — repeated at each SOC step](../assets/claude_assetsplan/bms-concepts/sop-hppc-waveform.svg)

The HPPC procedure:
1. Discharge the cell to a known SOC step (e.g., 90%)
2. Apply a 25A discharge pulse for 10 seconds
3. Rest for 40 seconds
4. Apply a 12.5A charge (regen) pulse for 10 seconds
5. Rest for 40 seconds
6. Repeat at each 10% SOC step down to 0%
7. Repeat the entire sequence at multiple temperatures (−20°C, 0°C, 15°C, 25°C, 40°C, 55°C)

The output is a resistance matrix indexed by (SOC, temperature, pulse duration). This matrix is embedded in BMS firmware as a lookup table. Given current SOC, temperature, and requested pulse duration, the BMS interpolates the expected resistance and computes I_max.

The HPPC map captures the cell as-new. As the cell ages and internal resistance grows, the map becomes stale. Better BMS designs supplement the static lookup with a running resistance estimator that updates continuously from in-service measurements.

---

## BMS Real-Time SOP Estimation

### Lookup Table Approach

The simplest approach: use the HPPC-derived table directly.

```
R = R_table[SOC, T, t_pulse]          (interpolate)
I_max_discharge = (OCV − V_min) / R
I_max_charge    = (V_max − OCV) / R
SOP_discharge   = I_max_discharge × min_cell_V × n_series
SOP_charge      = I_max_charge × max_cell_V × n_series
```

This works well for new cells at characterised operating points, but does not adapt to aging. A cell that has doubled its internal resistance will be incorrectly granted the same SOP as a new cell.

### Model-Based Estimation

A better approach uses the ECM continuously. Rather than a static lookup, the BMS simulates what would happen if it were to apply a current pulse right now:

1. Use current SOC estimate and temperature to set ECM parameters
2. Simulate the voltage trajectory V_T(t) over the next 10 seconds at a hypothetical current I_test
3. Find the maximum I_test such that V_T(t) stays ≥ V_min throughout (binary search or analytical solution)
4. Convert to power: SOP = I_max × V_min

This approach naturally incorporates the current state of the RC capacitor voltages (V_C₁, V_C₂) — if the cell has been under a sustained load for 30 seconds, the diffusion overpotential is already partially built up, and the available additional voltage headroom is less than from a rested state.

### Rolling Resistance Estimation

Both approaches benefit from a rolling estimator that tracks real-time DCIR from each current pulse in normal driving. Every time there is a significant current step, the BMS can estimate R₀ = (V_before − V_after) / ΔI. Over time, this provides an adaptive R map that reflects the actual aged state of the pack rather than the factory characterisation.

---

## Current Limiting and Derating

The BMS publishes SOP on the CAN bus every 10–100 ms. The vehicle control unit (VCU) scales torque demand accordingly: if the BMS says maximum discharge power is 80 kW, the motor controller will not request more than 80 kW from the pack regardless of what the driver is asking for.

**Derating** is a gradual reduction in SOP as limits are approached, rather than a hard cliff:

<iframe src="../assets/claude_assetsplan/bms-concepts/sop-derating-chart.html" width="100%" height="380" frameborder="0"></iframe>

A typical derating strategy reduces SOP linearly from 100% at, say, 15°C to 20% at −20°C — an illustrative OEM-policy-dependent example; actual thresholds and curve shapes vary widely by platform. Similarly, SOP is derated as SOC drops below 15% or rises above 90%. The result is a smooth power reduction the driver experiences as progressive sluggishness rather than an abrupt cutoff.

**Aggressive vs conservative derating** is a design choice with a direct performance-longevity tradeoff. A conservative BMS that derate early protects the cells and extends pack life. An aggressive BMS delivers better performance but risks cell stress events. High-performance EVs typically offer user-selectable modes that adjust the derating curve; race or sport modes reduce safety margins in exchange for more peak power.

---

## SOP for Regen Braking

Regenerative braking is charging — SOP_charge limits how aggressively regen can be applied.

At **high SOC**, the voltage headroom above OCV is small. Even modest regen current causes terminal voltage to rise toward V_max quickly. The BMS reduces SOP_charge → weak regen → the car blends in more mechanical braking to compensate. This is why regen feels weaker at 95% SOC than at 50%.

At **low temperature**, high internal resistance causes terminal voltage to spike sharply under even moderate charge current. The BMS restricts SOP_charge to protect cell voltage. Cold regen is therefore both weaker and more dependent on mechanical braking.

A good BMS communicates the available regen SOP to the braking controller, which blends hydraulic braking to fill the gap. Poor coordination produces inconsistent brake pedal feel and reduced energy recovery.

---

## Pre-conditioning

The connection between SOP and thermal management is direct. Heating the battery pack from −10°C to 20°C roughly doubles SOP. This is why performance EVs and vehicles designed for cold climates include battery pre-conditioning: actively heating the pack before a fast-charging session or before a spirited drive.

A BMS that is managing pre-conditioning correctly is simultaneously:
- Running the thermal management system to heat the pack
- Raising the SOP limit in real-time as temperature rises
- Scheduling the pre-conditioning start to complete before the user needs peak performance

The driver presses the "pre-condition" button and the BMS does the physics.

---

## Experiments

### Experiment 1: Measure DCIR at Multiple Temperatures

**Materials**: 18650 NMC cell at 50% SOC, INA219, fixed 1A load resistor, thermometer, fridge, warm water bath

**Procedure**:
1. Bring cell to 50% SOC. Rest 1 hour at 25°C. Record OCV. Apply 1A for 10 s, record terminal voltage. Compute DCIR = (OCV − V_10s) / 1A.
2. Repeat at 10°C (fridge), 5°C (colder fridge), and 40°C (warm water bath at safe distance from electronics).

**What to observe**: DCIR rises sharply below 15°C. Compute implied SOP = (OCV − V_min) / DCIR × V_min for each temperature. Plot. The temperature sensitivity of SOP is visible directly — cold battery at 5°C may have less than half the peak power of the same cell at 25°C.

---

### Experiment 2: Mini-HPPC Test

**Materials**: Arduino + INA219 + MOSFET load, 18650 cell

**Procedure**:
1. Program Arduino to execute: 10 s discharge pulse at 1A → 40 s rest → 10 s charge pulse (use current-limited bench supply at 0.5A) → 40 s rest. Log V and I at 100 ms intervals.
2. Repeat at each 10% SOC step from 90% to 20%.
3. Extract DCIR at each SOC from the voltage step at pulse start.

**What to observe**: Voltage dip during discharge pulse increases at low SOC (lower OCV headroom). DCIR varies slightly with SOC. Build a SOP vs SOC curve from the measured data. Compare the SOC at which SOP begins declining sharply — this is the derating trigger point used in BMS firmware.

---

### Experiment 3: Demonstrate Derating in a Simple Motor Circuit

**Materials**: Arduino, small DC motor, PWM controller, 3-cell Li-ion pack, NTC thermistor for temperature sensing

**Procedure**:
1. Run motor at fixed PWM at 25°C. Log speed and current.
2. Cool pack to 5°C (fridge). Re-run at same PWM. Observe speed difference.
3. Implement a software current limit in Arduino that scales with temperature (reduce limit by 2% per degree below 20°C). Apply limit and re-run at 5°C.

**What to observe**: At 5°C without derating, terminal voltage sags — motor may run slower due to reduced voltage. With derating enabled, current limit prevents the voltage sag from reaching critical levels, demonstrating how BMS derating protects cell voltage at the cost of reduced performance.

---

## Further Reading

- **Plett, G.L.** — *Battery Management Systems, Vol. 2* (Artech House, 2015) — Ch. on current limits and SOP estimation using the ECM and Kalman filter.
- **Waag, W. et al.** (2013) — "Critical review of the methods for monitoring of lithium-ion batteries in electric and hybrid vehicles" — *J. Power Sources* 258 — comprehensive SOP methodology review covering lookup table, model-based, and adaptive approaches.
- **USABC Electric Vehicle Battery Test Procedures Manual** — defines the HPPC test procedure in full detail; freely available from the US Department of Energy.
- **Idaho National Laboratory** — *Battery Test Manual for Electric Vehicles* — HPPC and SOP characterisation methodology with worked examples.
- TI Application Note SLUA496 — "Battery Pack Manager Power Limit Calculation" — implementation of SOP limits in TI BMS ICs.
- Battery University — "How to Measure Internal Resistance" — practical DCIR measurement methods.
