# State of Power (SOP) — The Instant Performance Budget

*Prerequisites: [State of Charge (SOC) →](./state-of-charge-soc.md), [State of Health (SOH) →](./state-of-health-soh.md)*

---

## You Can’t Always Get What You Want

SOC tells you how much energy is stored. **SOP** tells you how much power you can safely deliver or absorb **right now**. That’s why a cold battery feels sluggish at 50% SOC and why regen weakens when the pack is near full.

---

## What SOP Means

- **SOP_discharge**: maximum power the pack can deliver for a given pulse duration (often 10 s)
- **SOP_charge**: maximum power the pack can absorb (regen / fast charge)

SOP depends on **SOC, SOH, temperature, and pulse duration**. It changes minute by minute.

---

## What Limits Power

- **Voltage limits**: under load, V = OCV - I x R. Too much current drops below V_min.
- **Current limits**: electrode and electrolyte limits (C-rate)
- **Temperature limits**: cold raises resistance; hot accelerates aging
- **Aging (SOH)**: higher resistance = less voltage headroom

---

## Internal Resistance Is the Key Parameter

The simplest SOP estimate:

```
I_max_discharge = (OCV - V_min) / R_internal
I_max_charge = (V_max - OCV) / R_internal
```

R_internal rises sharply in the cold and with aging. That’s why SOP collapses in winter or with a high-mileage pack.

---

## HPPC — The Standard Characterization Test

**Hybrid Pulse Power Characterization (HPPC)** measures resistance and power vs SOC and temperature.

- 10 s discharge pulse → rest → 10 s charge pulse
- Repeat at SOC steps (10% increments)
- Build a lookup table: SOC x temperature → allowable current

These maps get embedded in BMS firmware as a baseline. Real-time SOP then adapts for aging and dynamic conditions.

---

## How a BMS Estimates SOP

Common approaches:

- **Lookup tables** from HPPC data
- **Model-based**: ECM predicts voltage response, choose current that stays within V_min/V_max
- **Adaptive**: track resistance with rolling measurements and update limits

The BMS publishes max charge/discharge limits over CAN; the motor controller scales torque accordingly.

---

## SOP and Regen Braking

Regen is charging. If the pack is:

- **Near full SOC** → little charge headroom → weak regen
- **Cold** → high resistance → voltage spikes → regen limited

That’s why you feel weaker regen in winter or at 95–100% SOC.

---

## Takeaways

- SOP is the real-time performance envelope.
- Cold + full pack = minimal SOP.
- Warm + mid-SOC = maximum SOP.
- Accurate resistance tracking is the heart of SOP estimation.

---

## Experiments

### Experiment 1: DCIR vs Temperature
**Materials**: 18650 cell, load, DMM/INA219, fridge and warm bath.

**Procedure**:
1. Bring cell to 50% SOC.
2. At each temperature, apply 1 A pulse and measure delta V.
3. Compute DCIR and estimate SOP.

**What to observe**: DCIR increases sharply at low temperature → SOP drops.

### Experiment 2: Mini-HPPC
**Materials**: Arduino load + INA219.

**Procedure**:
1. Apply 10 s discharge pulse, rest 40 s, 10 s charge pulse.
2. Repeat at SOC steps.

**What to observe**: Voltage dip grows at low SOC, limiting SOP.

### Experiment 3: Derating Demo
**Materials**: Small motor + pack + thermistor.

**Procedure**:
1. Run motor at 25 C, log speed and current.
2. Repeat at 5 C and impose a current limit.

**What to observe**: Derating is a BMS safety feature, not a bug.

---

## Literature Review

### Core References
- Plett — *Battery Management Systems Vol. 2*
- Linden & Reddy — *Handbook of Batteries*

### Key Papers / Standards
- USABC HPPC Test Manual
- IEC 62660-1 power characterization
- Waag et al. (2013) — SOP review
