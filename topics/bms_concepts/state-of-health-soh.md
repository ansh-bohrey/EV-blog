# State of Health (SOH) — Blog Plan

## Goal
Explain what SOH is, what causes it to degrade, how a BMS estimates it, and what it means practically for EV owners and engineers.

## Audience Angles
- **Engineers / students**: Degradation mechanisms (SEI, lithium plating), impedance spectroscopy, capacity fade models
- **EV enthusiasts**: "Why does my EV lose range over years?", battery warranty thresholds, second-life batteries

---

## Subtopic Flow

### 1. Hook — Batteries Age Like Engines
- A new battery and a 5-year-old battery of the same model look identical from the outside
- SOH quantifies the invisible degradation inside
- Stakes: 80% SOH is the typical EV warranty end-of-life threshold — below it, range loss is significant

### 2. What is SOH? — Two Definitions
- **Capacity-based**: SOH_C = (Q_measured / Q_nominal) × 100%
- **Resistance-based**: SOH_R = (R_0_initial / R_0_current) × 100% — power fade
- Distinguish capacity fade (less Ah) vs power fade (higher internal resistance, less peak power)
- Both matter but for different use cases: capacity for range, resistance for acceleration/fast charge acceptance
- End-of-life criteria: typically 80% SOH_C or 200% of initial resistance

### 3. What is Happening Inside? — Degradation Mechanisms
- **SEI (Solid Electrolyte Interphase) growth** — forms on graphite anode surface, consumes lithium, thickens over time
  - Faster at high temperature and high SOC
  - Calendar aging: happens even if you don't cycle
- **Lithium plating** — at high charge rates or low temperatures, Li deposits as metal instead of intercalating
  - Can form dendrites → safety risk
  - Irreversible capacity loss
- **Particle cracking** — repeated volume expansion/contraction during cycling fractures electrode particles
  - Exposes fresh surface → more SEI growth → more lithium loss
  - Worse with deep DoD and high C-rate
- **Electrolyte decomposition** — at high voltage or temperature, electrolyte oxidizes at cathode
- **Transition metal dissolution** — especially in NMC/LCO at high voltage; manganese poisoning in NMC

Present this with a diagram: cross-section of a cell showing each mechanism's location.

### 4. What Accelerates Aging?
Present as a table:

| Stress Factor | Mechanism Accelerated | Rule of Thumb |
|---|---|---|
| High temperature (>35°C) | SEI growth, electrolyte decomp | 10°C rise ≈ 2× faster aging |
| High SOC (>90%) | SEI growth, cathode stress | Keep below 80% for longevity |
| Low temperature charging | Lithium plating | Never fast-charge below 5°C |
| High C-rate | Lithium plating, particle cracking | Occasional fast charge is less harmful than always |
| Deep DoD | Particle cracking, mechanical stress | Avoid regular 100→0% cycling |

### 5. How SOH is Estimated
- **Full capacity test** — charge fully, discharge to cutoff, measure Ah → most accurate, impractical in-field
- **Incremental Capacity Analysis (ICA)** — dQ/dV plot reveals aging signature peaks without full cycle
- **Electrochemical Impedance Spectroscopy (EIS)** — inject AC signal, measure impedance vs frequency → quantifies R_SEI, charge transfer resistance. Lab tool but embedded versions emerging.
- **Model-based** — ECM with Kalman filter can track Q_nominal as a state
- **Data-driven** — partial charge features (voltage trajectory slope, knee shape) predict SOH; Severson 2019 landmark paper

### 6. SOH in the BMS
- BMS tracks SOH to update Q_nominal for SOC estimation accuracy
- SOH used to set conservative current limits as battery ages
- SOH history logged for warranty claims and resale value
- Fleet operators use SOH trends to predict replacement scheduling

### 7. Second Life and Beyond
- At 80% SOH, EV battery is "end of life" for EVs but still useful
- Second-life applications: stationary storage, lower-power vehicles
- Importance of SOH records for second-life repurposing decisions

### 8. Takeaways
- SOH is unavoidable degradation, but rate is controllable
- Good charging habits (avoid 0–100% daily, moderate temperatures) meaningfully extend SOH
- Next: SOC estimation accuracy depends on accurate SOH tracking

---

## Experiment Ideas

### Experiment 1: Capacity Fade Over Cycles
**Materials**: 18650 cells (×2 minimum), bench charger/discharger, Arduino + INA219, data logger
**Procedure**:
1. Baseline capacity test: full CC-CV charge, 1C CC discharge to cutoff, measure Ah
2. Stress cycle group A at 1C between 20–80% SOC
3. Stress cycle group B at 1C between 0–100% SOC
4. Re-test capacity every 50 cycles

**What to observe**: Group B degrades faster — demonstrates DoD effect. Quantify SOH_C over cycle number, plot fade curve.

### Experiment 2: Temperature vs Aging (Calendar)
**Materials**: Two identical cells, controlled temperature environments (room temp + fridge + oven at 45°C if safe)
**Procedure**:
1. Charge all cells to 50% SOC (halfway — least stressful storage point)
2. Store for 4 weeks at different temperatures
3. Measure capacity before and after

**What to observe**: Higher temperature → measurable capacity loss even without cycling.

### Experiment 3: ICA — Incremental Capacity Analysis (Simple Version)
**Materials**: Same discharge setup, high-resolution voltage logging
**Procedure**:
1. Discharge at very slow rate (C/10), log V vs Ah at high resolution
2. Numerically differentiate: compute dAh/dV (or dQ/dV)
3. Plot dQ/dV vs V — peaks correspond to phase transitions

**What to observe**: As cell ages, peaks shift and shrink — visible SOH fingerprint without measuring full capacity.

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 1* — degradation models, Ch. 6–7
- **Vetter et al.** — "Ageing mechanisms in lithium-ion batteries" — *J. Power Sources* 147 (2005) — the canonical degradation mechanism review
- **Waldmann et al.** — numerous papers on lithium plating and aging mode identification

### Key Papers
- **Severson et al.** (2019) — "Data-driven prediction of battery cycle life before capacity degradation" — *Nature Energy* — landmark ML SOH/lifetime prediction paper; must-read
- **Attia et al.** (2020) — "Closed-loop optimization of fast-charging protocols" — *Nature* — fast charge and SOH trade-off
- **Broussely et al.** (2005) — "Main aging mechanisms in Li-ion batteries" — *J. Power Sources*
- **Birkl et al.** (2017) — "Degradation diagnostics for lithium-ion cells" — *J. Power Sources* — excellent mechanism taxonomy
- **Han et al.** (2014) — "Simplification of physics-based electrochemical model for lithium-ion battery on electric vehicle"

### Online Resources
- Battery University — Article: "How to Prolong Lithium-based Batteries" (direct application)
- Recurrent Auto — SOH data from real-world EVs fleet (publicly visible insights blog)
- Dahn Group (Jeff Dahn, Dalhousie) — open access publications on long-life Li-ion cells
- NREL Battery Lifetime Analysis and Simulation Tool (BLAST)

### Standards / App Notes
- IEC 62660-2 — Reliability and abuse testing for Li-ion EV cells
- SAE J2464 — EV and HEV rechargeable energy storage system abuse testing
- USABC Goals for Advanced Batteries — defines the 80% SOH end-of-life criterion and test protocols
