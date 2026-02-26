# State of Power (SOP) — Blog Plan

## Goal
Explain what SOP is, how it differs from SOC/SOH, how it is estimated, and why it is critical for performance and safety in EVs.

## Audience Angles
- **Engineers / students**: HPPC test methodology, internal resistance models, current limit computation in BMS
- **EV enthusiasts**: "Why can't I floor it when the battery is cold or nearly empty?" — answered through SOP and derating

---

## Subtopic Flow

### 1. Hook — You Can't Always Get What You Want
- SOC says how much energy is stored. SOP says how fast you can get it out *right now*.
- Cold morning, battery at 50% SOC — yet the car feels sluggish. Why?
- Driver presses regen braking but pack is at 95% SOC — why does regen feel weak?
- SOP answers all of this: it is the instantaneous power envelope the pack can safely deliver or absorb.

### 2. What is SOP? — Formal Definition
- SOP_discharge = maximum power the pack can deliver for a given pulse duration (e.g., 10 seconds) without violating safety limits
- SOP_charge = maximum power the pack can absorb (relevant for regen and fast charging)
- Expressed in Watts (or kW at pack level)
- SOP is a function of: SOC, SOH, temperature, and pulse duration
- Distinct from rated capacity (SOC) and long-term health (SOH)

### 3. What Limits Power? — The Physical Constraints
- **Voltage limits**: cell must stay between V_min and V_max under load
  - Under high discharge current: terminal voltage drops (V = OCV - I × R_internal)
  - If it drops below V_min → cutoff → car shuts off mid-acceleration
- **Current limits**: electrodes and electrolyte have maximum safe current rates (C-rate limits)
- **Temperature limits**: cold → electrolyte conductivity drops → internal resistance rises → voltage drops more for same current
- **SOH effect**: aged cell has higher R_internal → smaller voltage headroom → lower SOP

### 4. Internal Resistance — The Key Parameter
- R_internal is the single biggest determinant of SOP
- DC internal resistance (DCIR): measure voltage drop for a known current step — ΔV/ΔI
- Composed of: electrolyte resistance, SEI resistance, charge transfer resistance, diffusion effects (for longer pulses)
- Why temperature matters: Arrhenius relationship — R_internal doubles or triples at 0°C vs 25°C
- Show R vs T curve across typical EV operating range

### 5. The HPPC Test — How SOP is Characterized
- **Hybrid Pulse Power Characterization (HPPC)** — the standard test protocol (USABC)
- Procedure: discharge pulse at fixed current for 10s, rest 40s, regen pulse for 10s, rest, repeat at each 10% SOC step
- Output: resistance and power vs SOC map across temperatures
- This map is embedded in BMS as a lookup table
- Limitations: HPPC is characterization, not real-time estimation — actual SOP estimation needs to track aging

### 6. How BMS Estimates SOP in Real Time
- Simple approach: lookup table (SOC × temperature → max current) baked from HPPC data
- Limitation: doesn't adapt to aging or dynamic load history
- Better: model-based — ECM predicts future voltage trajectory under a hypothetical current pulse, find max current such that V_min is not violated
  - SOP_discharge = (OCV - V_min) / R_internal (simplified)
  - SOP_charge = (V_max - OCV) / R_internal (simplified)
- Advanced: rolling window of recent IR measurements to track real-time resistance drift with temperature and SOH

### 7. Current Limiting and Derating
- BMS publishes max charge/discharge current (or power) on CAN bus to the vehicle control unit
- Motor controller respects these limits: torque demand is scaled back
- Derating curves: gradual reduction as temperature drops below or exceeds thresholds
- Aggressive vs conservative derating: trade-off between performance and longevity
- Show typical derating curve (power vs temperature, power vs SOC at low/high extremes)

### 8. SOP for Regen Braking
- Regen braking is charging — SOP_charge limits how hard regen can be applied
- At high SOC: little headroom for charge → weak regen (charge acceptance near zero at 100%)
- At low temperature: high R → voltage rises sharply with charge current → limited regen
- Good BMS communicates regen availability so the vehicle can blend mechanical braking smoothly

### 9. Takeaways
- SOP is the real-time performance budget — it changes second by second
- Cold battery + full battery = minimum SOP
- Warm battery + mid-SOC = maximum SOP
- Engineers: accurate R_internal tracking is the key challenge
- Enthusiasts: pre-conditioning the battery (heating it before a fast charge or spirited drive) is SOP-driven behavior

---

## Experiment Ideas

### Experiment 1: Measure DC Internal Resistance at Different Temperatures
**Materials**: 18650 cell, fixed resistive load, DMM or INA219, temperature-controlled environment (fridge, room temp, warm water bath)
**Procedure**:
1. Bring cell to 50% SOC
2. At each temperature: rest 30 min, record OCV, apply 1A current for 10s, record terminal voltage
3. Compute DCIR = (V_OCV - V_loaded) / I
4. Repeat at 5°C, 15°C, 25°C, 35°C, 45°C

**What to observe**: DCIR increases sharply below 15°C. Calculate implied SOP = V_min × I_max at each temperature. Cold = much lower SOP.

### Experiment 2: Mini-HPPC Test
**Materials**: Arduino + INA219 + MOSFET load, Li-ion cell
**Procedure**:
1. Program Arduino to: apply 1A discharge pulse for 10s, rest 40s, apply 0.5A charge pulse for 10s, rest 40s
2. Log current and voltage at 100ms intervals
3. Repeat at 10% SOC increments across full range

**What to observe**: Voltage dip during pulse increases at low SOC. Build SOP vs SOC curve from measured DCIR.

### Experiment 3: Derating Demonstration
**Materials**: Small DC motor, PWM controller, Li-ion pack, thermistor, Arduino
**Procedure**:
1. Run motor at fixed PWM at 25°C, log speed and current
2. Cool battery to 5°C, repeat
3. Manually implement current limit in Arduino at cold temperature, observe motor "derating"

**What to observe**: Demonstrates power derating as a protective BMS function.

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 2* — current limit and SOP chapters
- **Linden & Reddy** — *Handbook of Batteries* — internal resistance sections by chemistry

### Key Papers
- **Waag, W. et al.** (2013) — "Critical review of the methods for monitoring of lithium-ion batteries in electric and hybrid EVs" — *J. Power Sources* 258 — comprehensive SOP methodology review
- **Hu et al.** (2011) — "A multiscale framework with EKF for Li-ion battery SOC and capacity estimation" — *Applied Energy*
- **Dubarry et al.** — HPPC analysis and power fade characterization papers

### Online Resources
- USABC HPPC Test Manual — exact HPPC procedure (publicly available via DOE)
- Idaho National Laboratory — Battery Test Manual for EVs (free, downloadable)
- TI Application Note: "Battery Pack Manager Power Limit Calculation" (SLUA496)
- Battery University — "How to measure internal resistance"

### Standards / Application Notes
- USABC Electric Vehicle Battery Test Procedures Manual — Section 2: HPPC
- IEC 62660-1 — Power characterization tests for Li-ion cells
- FreedomCAR Battery Test Manual — HPPC and power limits
