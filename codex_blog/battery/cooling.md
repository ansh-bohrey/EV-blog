# Battery Thermal Management — Cooling, Heating, and Why Temperature Wins

*Prerequisites: [Battery Pack & Module Architecture →](./battery.md)*

---

## Temperature Is the Battery’s Friend and Enemy

The same EV can lose ~15% range at -10 C and age roughly twice as fast at 40 C compared to 25 C. Temperature is the single biggest external factor controlling performance, safety, and lifetime. Thermal management is not an afterthought; it is a first-order design constraint that shapes the entire pack.

---

## The Goldilocks Zone

Li-ion cells are happiest roughly in this window:

- **Performance**: about 15–35 C
- **Longevity**: about 20–25 C

Outside that range:

- **Too hot (>40 C)**: faster SEI growth, electrolyte breakdown, rising thermal runaway risk
- **Too cold (<10 C)**: higher internal resistance, reduced power, lithium plating risk when charging

Uniformity matters too. A 10 C gradient across a pack can cause localized aging that turns into imbalance. Good thermal design aims for **<5 C spread** under load.

---

## Where the Heat Comes From

Two dominant sources:

### Ohmic (I^2R) Heat
- Every resistive element (cells, busbars, shunts, contactors) generates heat
- Scales with current squared: 2C creates ~4x the heat of 1C
- Internal resistance rises at low SOC and low temperature, so heat is worst when the cell is already stressed

### Entropic Heat
- Thermodynamic heat from the electrochemical reaction
- Can be endothermic or exothermic depending on SOC and chemistry
- At high C-rate, I^2R dominates; at low rate, entropic heat becomes visible

Hotspots usually appear at terminals, busbars, and within cylindrical cell cores where heat must conduct outward.

---

## Cooling Architectures

### Passive Cooling
Natural convection and radiation only.

- **Pros**: simple, cheap, no parasitic power
- **Cons**: no control, no heating, poor in extreme climates
- **Use**: low-power systems, not modern EVs

### Air Cooling
Fans move air over cells or through channels.

- **Pros**: simple, low cost, no coolant loops
- **Cons**: air has low heat capacity and conductivity
- **Result**: limited heat removal, larger gradients

Nissan Leaf Gen1 used air cooling and saw accelerated degradation in hot climates. The core issue was insufficient heat removal plus no active heating.

### Liquid Cooling (Modern Standard)
Water-glycol coolant through a cold plate or channels.

- **Pros**: high heat capacity, good uniformity, supports fast charging
- **Cons**: pumps, lines, seals, added complexity

Common layouts:

- **Bottom cooling plate**: cells sit on an aluminum plate with internal channels
- **Side cooling**: channels between cell rows for more uniform extraction
- **Serpentine vs parallel channels**: serpentine is simpler but creates inlet-to-outlet temperature gradients; parallel improves uniformity but is more complex

---

## Thermal Interface Materials (TIM)

The cell-to-plate interface often dominates thermal resistance. Air is a terrible conductor. TIMs fill microscopic gaps.

- **Gap pads**: compressible, good for manufacturing tolerance
- **Thermal grease**: higher conductivity, messy in production
- **Adhesive TIM**: bonds + conducts, used in CTP, hard to service
- **Phase change**: softens at operating temperature to improve contact

A well-designed plate is useless if the TIM is poor.

---

## Heating — The Winter Problem

Cold batteries cannot accept fast charge safely. Heating is as important as cooling.

- **PTC heaters**: simple, safe, but inefficient
- **Heat pumps**: 2–4x more efficient than resistive heating
- **Self-heating**: controlled charge/discharge pulses to generate internal heat

**Preconditioning** warms the pack before fast charging or a scheduled departure. At -20 C, heating the pack to 20 C can consume multiple kWh, which is why winter range drops.

---

## Thermal Control Loop

The BMS and thermal ECU monitor:

- Cell temperatures (NTC sensors)
- Coolant inlet/outlet temperatures
- Ambient temperature

Actions include:

- Pump speed control
- Radiator fan control
- Charge/discharge derating
- Heater activation

Thermal state feeds directly into **SOP** (power limits).

---

## Real-World Examples (Quick Comparison)

| Vehicle | Cooling Type | Chemistry | Notes |
|---|---|---|---|
| Nissan Leaf (Gen1) | Air | NMC/LMO | Poor hot-climate performance |
| Tesla Model 3/Y | Liquid | NCA/NMC | Strong thermal management, preconditioning |
| Hyundai Ioniq 5 | Liquid | NMC pouch | Heat pump standard |
| CATL Blade (LFP) | Liquid | LFP | CTP pack, channels integrated |

---

## Takeaways

- Temperature is the master variable for performance and lifetime.
- Liquid cooling is the current EV standard; air cooling is insufficient for fast charging.
- Heating is essential for winter range and safe charging.
- Model the full thermal resistance chain: **cell → TIM → plate → coolant**.

---

## Experiments

### Experiment 1: Heat Generation vs C-Rate
**Materials**: 18650 cell, INA219, NTC thermistor, constant-current load.

**Procedure**:
1. Discharge at C/5, log temperature rise.
2. Repeat at C/2, 1C, 2C.
3. Compare temperature slopes.

**What to observe**: Temperature rise scales roughly with I^2.

### Experiment 2: Temperature Gradient Across a Mini-Pack
**Materials**: 4 cells in 4S, 4 thermistors, insulated enclosure.

**Procedure**:
1. Discharge at 1C.
2. Log each cell temperature.

**What to observe**: Center cells heat more than edge cells.

### Experiment 3: Simple Cooling Plate Demo
**Materials**: Aluminum plate + copper tube, 2 cells, water flow.

**Procedure**:
1. Discharge at 1C with flow, log temperature.
2. Repeat without flow.

**What to observe**: Active cooling keeps temperatures lower and more uniform.

---

## Literature Review

### Core References
- Warner — *The Handbook of Lithium-Ion Battery Pack Design* (thermal chapter)
- Pesaran (NREL) thermal management reports

### Key Papers
- Bandhauer et al. (2011) — thermal issues review
- Yang et al. (2019) — air vs liquid cooling comparison
- Waldmann et al. (2014) — temperature-dependent aging

### Standards / Notes
- ISO 6469-1, IEC 62660-1, SAE J2288
