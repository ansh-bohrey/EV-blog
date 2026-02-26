# Equivalent Circuit Model (ECM) Primer — The Battery as a Circuit

*Prerequisites: [Cell Fundamentals →](../battery/cell.md)*  
*Next: [OCV vs Terminal Voltage →](../bms_concepts/open-circuit-voltage-ocv-vs-terminal-voltage-logic.md)*

---

## One Model, Three Mysteries

Why does voltage dip instantly under load? Why does it recover slowly after you stop? Why can SOC be estimated from voltage only after resting? The **Equivalent Circuit Model (ECM)** explains all three.

---

## Why Model a Battery as a Circuit?

A real cell is electrochemistry. A BMS needs a model that runs in real time. ECM replaces the chemistry with a small set of components that reproduce terminal behavior well enough for estimation and control.

---

## Level 0: Ideal Voltage Source

Battery = OCV(SOC, T). Works only at rest. Under load, it’s wrong.

---

## Level 1: Add Ohmic Resistance (R0)

```
V_terminal = OCV - I x R0
```

R0 captures the instantaneous voltage drop. This is the DCIR measured from a current step.

---

## Level 2: Add One RC Pair

Add R1 || C1 in series with R0 to capture slow voltage dynamics.

- R1: charge transfer resistance
- C1: double-layer capacitance
- Time constant τ = R1 x C1

This explains the slow recovery after a current step.

---

## Level 3: Two RC Pairs (Standard BMS Model)

A second RC pair captures slower diffusion effects. Most production BMSs use a 2RC Thevenin model because it balances accuracy and complexity.

---

## Parameter Extraction (Pulse Test)

1. Rest at known SOC
2. Apply a current step
3. Instant drop → R0
4. Fit exponentials → R1, C1 (and R2, C2)

Parameters vary with SOC and temperature, so they are stored in lookup tables.

---

## Why ECM Matters for SOC and SOP

The ECM is the backbone of SOC estimation (EKF) and SOP limits (voltage headroom under load). Without it, the BMS cannot correct drift or predict safe power limits.

---

## What ECM Does Not Capture

- Long-term aging (SOH) unless parameters are updated
- Lithium plating and other side reactions
- Hysteresis (especially LFP)

---

## Takeaways

- R0 explains the instant voltage drop.
- RC pairs explain slow recovery.
- ECM is the shared foundation for SOC, SOP, and OCV logic.

---

## Experiments

### Experiment 1: RC Response Demo
**Materials**: 10k resistor, 1000 uF capacitor, 9 V source.

**Procedure**:
1. Charge/discharge the capacitor.
2. Log the exponential curve.

**What to observe**: The same shape as voltage recovery in a real battery.

### Experiment 2: Extract R0 from a Cell
**Materials**: 18650 cell, load, INA219.

**Procedure**:
1. Apply a current step.
2. Measure instantaneous delta V.

**What to observe**: R0 = delta V / delta I.

### Experiment 3: Simple ECM Simulation
**Materials**: Python.

**Procedure**:
1. Simulate 2RC response to a current pulse.
2. Compare to measured voltage.

---

## Literature Review

### Core References
- Plett — *Battery Management Systems Vol. 1*
- Hu et al. (2012) — ECM comparison
- Chen & Rincon-Mora (2006) — classic ECM model
