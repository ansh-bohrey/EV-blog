# State of Charge (SOC) — The Fuel Gauge Problem

*Prerequisites: [OCV vs Terminal Voltage →](./open-circuit-voltage-ocv-vs-terminal-voltage-logic.md), [Equivalent Circuit Model →](../intro/equivalent-circuit-model.md)*  
*Next: [State of Health (SOH) →](./state-of-health-soh.md)*

---

## The Fuel Gauge Problem

Your phone battery percentage is a lie — and so is your EV range estimate. Unlike a fuel tank, a battery has no direct sensor for “how full” it is. **State of Charge (SOC)** is an internal electrochemical state, so every SOC value you see is *estimated*.

This is why the range meter jumps around, especially in cold weather or after hard acceleration: the BMS is constantly updating a best guess using imperfect data.

---

## What SOC Actually Means

SOC is defined as:

```
SOC = (Remaining Capacity / Full Capacity) x 100%
```

- 0% is “empty” by convention, not by physics
- 100% is “fully charged,” but often limited by the OEM for longevity
- SOC is not voltage; a 4.2 V cell is not always at 100%

Many EVs operate in a usable window (for example 10–90%) to protect cycle life, which is why advertised capacity and “usable capacity” differ.

---

## OCV–SOC: The Best Sensor (When You Can Use It)

At rest, a cell’s **open-circuit voltage (OCV)** is a known function of SOC. This is the most accurate SOC method — *but only after the cell has rested for hours*.

- NMC has a sloped OCV curve → easier to infer SOC
- LFP has a flat OCV plateau → SOC from voltage becomes unreliable
- Temperature shifts the curve → cold cells read lower voltage at the same SOC

That is why SOC estimation is harder for LFP, and why a cold battery looks “empty” until it warms up.

---

## Coulomb Counting — The Workhorse

Coulomb counting integrates current over time:

```
Delta SOC = (Integral of I dt) / Q_nominal
```

It is intuitive and works in real time, which is why almost every production BMS uses it. But it drifts:

- Current sensors have offset error
- Q_nominal changes with aging
- Coulombic efficiency < 100%

If you never correct it, the SOC estimate eventually walks away from reality.

---

## Model-Based Estimation — Fusing Physics with Data

An **Equivalent Circuit Model (ECM)** predicts terminal voltage from SOC and current. The BMS compares predicted voltage to measured voltage and corrects SOC when it can.

The common estimator is the **Extended Kalman Filter (EKF)**:

- Coulomb counting provides the “prediction” (dead reckoning)
- Voltage provides “correction” (landmark fix)
- The Kalman gain decides how much to trust each

The analogy is GPS: dead reckoning drifts; landmark fixes re-anchor it.

More advanced filters (UKF, particle filter) exist, but EKF is the most common in production.

---

## Data-Driven Methods (Brief)

Neural nets (LSTM, CNN) can learn voltage-current-temperature dynamics and sometimes outperform classical models. The tradeoffs:

- High data requirements
- Harder validation for safety
- Greater embedded compute cost

Most production systems are still physics-based with data-driven augmentation.

---

## Practical Challenges

- **Temperature**: capacity shrinks in the cold
- **Aging**: Q_nominal drifts down (link to SOH)
- **Cell-to-cell variation**: weakest cell limits pack SOC
- **Noise and quantization**: small sensor errors integrate over time
- **High C-rate transients**: voltage-based correction is harder during heavy load

---

## How the BMS Uses SOC

SOC drives almost every higher-level decision:

- Remaining range estimate
- Charge and discharge power limits
- Balancing triggers
- Deep-discharge cutoffs

If SOC is wrong, everything downstream is wrong.

---

## Takeaways

- SOC is an estimate, not a measurement.
- Accurate SOC needs good sensors, a sound model, and frequent recalibration.
- Next: **SOH** explains why full capacity changes over time.

---

## Experiments

### Experiment 1: Build an OCV–SOC Curve
**Materials**: 18650 cells (NMC and LFP if possible), charger, DMM, Arduino + current shunt.

**Procedure**:
1. Fully charge, rest 2 hours.
2. Discharge in 10% steps, rest 30 minutes at each step.
3. Record OCV at each step.

**What to observe**: LFP’s flat region vs NMC’s sloped curve.

### Experiment 2: Coulomb Counting Drift Demo
**Materials**: Arduino + INA219, load resistor, 18650 cell.

**Procedure**:
1. Start at 100% SOC.
2. Discharge and integrate current.
3. Repeat multiple cycles and observe drift.

**What to observe**: SOC drift without a voltage-based reset.

### Experiment 3: Temperature Effect on SOC
**Materials**: Same setup, fridge or temperature chamber.

**Procedure**:
1. Record OCV at 25 C.
2. Record OCV at 5 C and 45 C for the same cell.

**What to observe**: Temperature-induced OCV shift and its effect on SOC.

---

## Literature Review

### Core Textbooks
- Plett, G.L. — *Battery Management Systems Vol. 1 & 2*
- Linden & Reddy — *Handbook of Batteries*

### Key Papers
- Plett (2004) — EKF for SOC estimation
- Hu et al. (2012) — ECM comparison
- Chemali et al. (2018) — LSTM SOC estimation
- Ng et al. (2009) — Enhanced Coulomb counting

### Online Resources
- Battery University — Li-ion characteristics
- TI BQ-series application notes
- Orion BMS documentation
- CSS Electronics — CAN logging and BMS data tutorials

### Standards / App Notes
- USABC EV Battery Test Procedures Manual
- IEC 62660-1
- SAE J2288
