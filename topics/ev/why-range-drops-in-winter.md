# Why Range Drops in Winter — Blog Plan

## Goal
Give a complete, quantified explanation of the three distinct reasons EV range drops in cold weather — reduced usable capacity, SOP derating, and heating energy cost — and explain what preconditioning does and doesn't fix.

## Audience Angles
- **Engineers / students**: Quantitative breakdown of each effect, Arrhenius temperature dependence of internal resistance, energy balance of heating loads vs usable pack energy
- **EV enthusiasts**: Direct answers to "why does my EV only get 140km in December when it shows 200km in summer?" — with real numbers and actionable advice

---

## Subtopic Flow

### 1. Hook — The Winter Surprise
- Every EV driver in a cold climate experiences it: the range estimate that looked fine in the garage collapses by the time you reach the highway.
- This is not a software bug, not a manufacturer lie, and not a battery problem. It is three separate physics effects, each taking a slice of your range independently.
- Most EV articles say "cold weather reduces range" and leave it there. This post explains exactly how much each effect costs, and why.

### 2. Setting Up the Example
- Reference vehicle for the calculations: a mid-range EV with a 60 kWh usable pack, 250 km rated range at 25°C
- We'll track it on a 0°C winter morning
- Spoiler: the three effects together can reduce usable range to ~160–175 km even on a fully charged battery

### 3. Cause 1 — Reduced Usable Capacity (~10–15% range loss)

**What is happening physically:**
- Every Li-ion cell has an internal resistance R₀ (plus RC pair contributions to voltage under load)
- R₀ follows an Arrhenius-like relationship with temperature: it roughly doubles for every 15–20°C drop
- At 0°C, R₀ might be 2–3× its 25°C value for a typical NMC cell

**Why this reduces range:**
- Under load (driving), terminal voltage = OCV − I × R_total
- At cold temperatures, higher R_total means a larger voltage drop per amp of current
- The BMS must stop discharging when any cell reaches V_min (e.g., 2.8V)
- At high R₀, the cell hits V_min at a higher OCV (= higher remaining SOC) than it would at 25°C
- Result: the BMS shuts off discharge while some energy is still physically in the cells but electrochemically inaccessible at safe current levels
- Typical loss: ~8–15% of rated capacity depending on chemistry and C-rate
- LFP is more affected than NMC at cold due to LFP's lower nominal voltage and flatter OCV-SOC curve

**The OCV recovery effect:**
- After stopping (parked at destination), cell voltages recover as concentration gradients equalize
- If you check SOC an hour after arrival, it may read higher than when you parked — the battery "remembered" it had more energy than it could deliver at cold temperature
- This is why winter SOC readings feel inconsistent

### 4. Cause 2 — SOP Derating (~5–10% effective range loss)

**What is happening physically:**
- Higher R₀ at cold temperatures reduces the instantaneous power the BMS can safely allow
- SOP_discharge = (OCV − V_min) / R_total — with higher R_total, the safe current limit is lower
- The BMS publishes a reduced max discharge current on CAN. The VCU respects this.

**Why this affects range (not just performance):**
- Reduced max power forces the car to operate at a lower peak efficiency point in many conditions
- Most EVs are most efficient at moderate power — very low power on highway has worse drag-dominated efficiency; very high power has worse drivetrain losses
- More significantly: at reduced power limit, the car may struggle to maintain highway speed in headwinds or on inclines without exceeding the BMS limit — requiring longer time at near-limit power, increasing I²R losses
- The efficiency loss from operating near the current limit (higher I²R) is a real but often-overlooked secondary range penalty

**Recovery:**
- As the battery self-heats through normal driving (I²R), R₀ drops and SOP recovers
- After 20–30 minutes of highway driving, the pack may have warmed from 0°C to 15°C, substantially recovering the power limit
- This is why the car often "wakes up" on winter drives — the first 15 minutes are the worst

### 5. Cause 3 — Heating Energy Cost (~10–25% range loss, largest single factor)

**The EV heating problem:**
- An ICE car heats the cabin for "free" — waste engine heat (which would otherwise be dumped through the radiator) is redirected to the heater core. Energy cost: near zero.
- An EV has no waste engine heat. All cabin heating comes from the traction battery.
- A resistive PTC heater draws 3–5 kW continuously in cold weather
- On a 60 kWh pack, 4 kW of continuous heating consumes the pack at 4/60 = 6.7% per hour of heating
- A 1-hour commute with continuous heating: 4 kWh consumed on heating alone = equivalent to losing ~16 km of range on top of the normal driving consumption

**Heat pump advantage:**
- Vehicles with a heat pump (Tesla Model Y, Hyundai Ioniq 5, many newer EVs) use refrigerant-cycle heat transfer instead of resistive heating
- COP (Coefficient of Performance) = 2.5–4: for every 1 kWh of electricity consumed, 2.5–4 kWh of heat is delivered to the cabin
- A heat pump reduces the heating energy cost by 60–75% vs resistive heating
- Real-world winter range penalty: ~5–10% with heat pump vs ~15–25% with resistive heating

**Battery heating:**
- The battery itself must be kept above a minimum operating temperature for charging and for optimal discharge
- BMS may activate battery heating before driving (preconditioning) — this costs energy drawn from the pack while plugged in (free, from grid) or from the pack itself (not free)
- Battery heating load: ~1–2 kW to bring a large pack from −10°C to 10°C; takes 30–60 minutes

**The winter energy budget (example):**
For our 60 kWh vehicle doing a 1-hour highway drive at 0°C:
| Item | Energy consumption |
|---|---|
| Propulsion (same as summer) | ~20 kWh |
| Cabin heating (resistive) | ~4 kWh |
| Battery heating | ~0.5 kWh |
| Increased rolling resistance (cold tires, cold lubricants) | ~0.5 kWh |
| **Total** | **~25 kWh** |
vs 20 kWh in summer → 25% more energy for the same trip → 25% less range

### 6. What Preconditioning Does (and Doesn't Fix)
- **What it is**: BMS heats the battery and cabin before departure, while still plugged into the grid
- **What it fixes**: heating energy cost (shifts it from battery to grid, so it's free for the driver), and battery temperature (recovers usable capacity and SOP)
- **What it doesn't fix**: the reduced capacity at start of drive if the pack isn't fully up to temperature; tire stiffness and drag; reduced regenerative braking acceptance when charging into a cold pack
- **Best practice**: schedule departure with preconditioning active; plug in whenever possible; precondition before DC fast charging (pack must be warm for high charge rates)

### 7. Chemistry Matters
- **LFP** suffers more from cold than NMC/NCA:
  - Lower nominal voltage → less headroom before V_min → more capacity lost to derating at cold
  - Flatter OCV curve → harder for BMS to detect state accurately when cold
  - However, LFP's thermal stability means it can be discharged at low temperature without the lithium plating risk that constrains NMC charge rate
- **NMC 811** vs NMC 532: higher Ni content improves energy density but the higher R₀ at cold (relative to lower Ni NMC) partially offsets the capacity advantage in winter

### 8. Real-World Data Points
Use publicly available data to ground the discussion:
- Recurrent Auto fleet data: shows 20–30% winter range reduction for most EVs without heat pumps; 10–15% for heat pump vehicles
- ADAC (German automotive club) winter range tests: detailed per-model breakdown
- Bjørn Nyland YouTube range tests: Norway-climate real-world winter data for many EV models
- Tesla / Hyundai official winter range vs EPA range comparisons

### 9. Practical Takeaways
**For enthusiasts:**
- Plug in every night — preconditioning is only free when you're connected
- Pre-condition before a fast charge, not just before driving
- Keep SOC above 20% in winter — the capacity reduction at low SOC compounds with the cold effect
- Heat pump is worth the premium if you live in a cold climate
- Plan winter trips using winter range figures, not EPA/WLTP figures

**For engineers:**
- Thermal management system specification must include a worst-case winter scenario, not just an average
- BMS capacity derating tables must be validated at multiple temperatures and C-rates
- Preconditioning control logic (when to start, target temperature, power limit) is a significant BMS software feature
- Heat pump integration requires coordinated BMS + thermal management controller design

---

## Experiment Ideas

### Experiment 1: Measure Capacity Reduction at Different Temperatures
**Materials**: 18650 NMC cell, Arduino + INA219, constant current load, thermometer + temperature-controlled environment (fridge, room temp, warm water bath)
**Procedure**:
1. Fully charge cell at 25°C, rest 1h
2. Discharge at 1C to cutoff voltage at 25°C. Record total Ah.
3. Repeat at 10°C — same 1C discharge rate
4. Repeat at 0°C — same 1C discharge rate
5. Plot delivered capacity vs temperature

**What to observe**: Delivered capacity decreases at cold temperatures. Quantify as a % of rated capacity. Compare to manufacturer datasheet (usually tested at 25°C). This directly demonstrates Cause 1.

### Experiment 2: Internal Resistance vs Temperature
**Materials**: Same cell, same setup, pulse load
**Procedure**:
1. At each temperature (0°C, 10°C, 20°C, 30°C), bring cell to 50% SOC, rest 30 min
2. Apply 1A pulse for 10s, measure DCIR = ΔV/ΔI
3. Plot DCIR vs temperature

**What to observe**: DCIR roughly doubles between 25°C and 0°C. This is the R₀ increase that causes both Cause 1 (capacity derating) and Cause 2 (SOP derating).

### Experiment 3: Heating Power Budget Estimation
**Materials**: NTC thermistor + Arduino, small insulated box, PTC heater element (from any small hair dryer), 12V battery, clamp meter
**Procedure**:
1. Place thermistor inside insulated box, connect PTC heater
2. Measure heater power (V × I with clamp meter)
3. Log temperature inside box over 20 minutes with heater on
4. Calculate energy consumed by heater (P × t)
5. Compare: how much range-equivalent energy did the heater consume? (Use: 1 kWh = ~5–7 km for a typical EV)

**What to observe**: Visceral understanding of the heating energy cost. A 100W heater over 1 hour = 0.1 kWh = ~0.5–0.7 km of range. Scale up to 4 kW in a real EV = 4 kWh/hour = 20–28 km of range per hour of heating.

---

## Literature Review

### Core References
- **Pesaran, A.A.** (NREL) — "Battery Thermal Management in EVs and HEVs" — quantifies temperature effects on capacity and power; foundational NREL report (free download)
- **Waldmann, T. et al.** (2014) — "Temperature dependent ageing mechanisms in lithium-ion batteries" — *J. Power Sources* — the mechanism behind cold-temperature capacity loss

### Key Papers
- **Zhang, S.S. et al.** (2003) — "The low temperature performance of Li-ion batteries" — *J. Power Sources* 115 — direct measurement of capacity vs temperature
- **Ji, Y. & Wang, C.Y.** (2013) — "Heating strategies for Li-ion batteries operated from subzero temperatures" — *Electrochimica Acta* — battery heating methods comparison

### Online Resources / Data
- **Recurrent Auto** — "How Does Cold Weather Affect EV Range?" — fleet data analysis, model-by-model breakdown (publicly accessible blog)
- **ADAC** — Winter EV range tests (Germany) — published annually; real-world data for European-market vehicles
- **Bjørn Nyland** (YouTube) — Range test playlist; Norway winter conditions, systematic per-model testing
- **Out of Spec Reviews** (YouTube) — Winter range testing with data logging at US temperatures
- Battery University — "BU-502: Discharging at High and Low Temperatures"

### Standards
- **IEC 62660-1** — includes cold temperature performance test methods for EV cells
- **SAE J1634** — Battery electric vehicle energy consumption and range test procedure; defines how official range figures are measured (at 25°C — which is why winter figures are lower)
