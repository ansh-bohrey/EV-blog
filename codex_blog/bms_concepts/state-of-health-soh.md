# State of Health (SOH) — Why Batteries Age

*Prerequisites: [State of Charge (SOC) →](./state-of-charge-soc.md)*

---

## Batteries Age Like Engines

A new battery and a five-year-old battery can look identical from the outside. **State of Health (SOH)** is how we quantify the invisible degradation inside. Most EV warranties treat **80% SOH** as end-of-life for range and performance, even though the pack still works.

---

## What SOH Actually Means

There are two practical definitions:

### Capacity-Based SOH
```
SOH_C = (Q_measured / Q_nominal) x 100%
```
If the pack used to hold 60 kWh and now holds 48 kWh, SOH_C is 80%.

### Resistance-Based SOH
```
SOH_R = (R_initial / R_current) x 100%
```
As internal resistance rises, peak power and fast-charge acceptance drop.

**Capacity fade** affects range. **Power fade** affects acceleration and charging.

---

## What’s Happening Inside (Aging Mechanisms)

- **SEI growth**: consumes lithium and thickens over time. Accelerated by high temperature and high SOC.
- **Lithium plating**: metallic Li deposits during cold or aggressive charging. Causes irreversible capacity loss and safety risk.
- **Particle cracking**: repeated expansion/contraction fractures electrodes, exposing fresh surface and creating more SEI.
- **Electrolyte decomposition and transition metal dissolution**: worsens at high voltage and temperature.

Aging is not one thing. It is a stack of mechanisms that accelerate under different stress conditions.

---

## What Accelerates Aging (Rules of Thumb)

| Stress Factor | Mechanism | Rule of Thumb |
|---|---|---|
| High temperature (>35 C) | SEI growth, electrolyte breakdown | 10 C rise ≈ 2x faster aging |
| High SOC (>90%) | SEI growth, cathode stress | Keep daily use below ~80% |
| Cold fast charging | Lithium plating | Avoid below ~5 C |
| High C-rate | Plating, cracking | Occasional fast charge is better than constant |
| Deep DoD | Mechanical stress | 20–80% cycling is gentler |

---

## How SOH Is Estimated in a BMS

No car can do full capacity tests every week, so SOH is estimated:

- **Full capacity tests**: accurate but impractical in-field
- **Incremental Capacity Analysis (ICA)**: dQ/dV peaks shift with aging
- **Impedance estimates**: rising DCIR is a strong SOH_R indicator
- **Model-based**: Kalman filters track Q_nominal as a state
- **Data-driven**: voltage trajectory features predict SOH (Severson 2019)

Most production systems use a hybrid: occasional calibration + continuous estimation.

---

## How SOH Is Used

- Updates **Q_nominal** so SOC remains accurate
- Sets conservative current limits as the pack ages
- Logs history for warranty and resale
- Enables fleet operators to plan replacements

---

## Second Life

At 80% SOH, an EV pack is often too weak for vehicle range expectations but still useful for stationary storage. Good SOH records are what make second-life decisions feasible.

---

## Takeaways

- SOH is unavoidable, but its **rate** is controllable.
- Temperature, SOC window, and charge rate dominate aging speed.
- SOC accuracy depends on SOH accuracy; the two are linked.

---

## Experiments

### Experiment 1: Capacity Fade vs Depth of Discharge
**Materials**: 2x 18650 cells, charger/discharger, INA219 logger.

**Procedure**:
1. Baseline capacity test.
2. Cycle group A between 20–80%, group B between 0–100%.
3. Re-test capacity every 50 cycles.

**What to observe**: Deep cycling accelerates fade.

### Experiment 2: Temperature vs Calendar Aging
**Materials**: 2 identical cells, room temp vs 45 C storage.

**Procedure**:
1. Store both at 50% SOC for 4 weeks.
2. Measure capacity before/after.

**What to observe**: Warmer storage loses more capacity even without cycling.

### Experiment 3: Simple ICA
**Materials**: Slow C/10 discharge with high-resolution logging.

**Procedure**:
1. Log V vs Ah.
2. Compute dQ/dV.

**What to observe**: Aging shifts and flattens ICA peaks.

---

## Literature Review

### Core References
- Plett — *Battery Management Systems Vol. 1*
- Vetter et al. (2005) — aging mechanisms review
- Birkl et al. (2017) — degradation diagnostics

### Key Papers
- Severson et al. (2019) — early-life cycle life prediction
- Attia et al. (2020) — fast charging trade-offs

### Standards
- IEC 62660-2, SAE J2464, USABC goals
