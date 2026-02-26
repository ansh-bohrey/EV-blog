# Why EV Range Drops in Winter — The Three‑Cause Breakdown

*Prerequisites: [SOC →](../bms_concepts/state-of-charge-soc.md), [SOP →](../bms_concepts/state-of-power-sop.md), [Cooling →](../battery/cooling.md)*

---

## The Winter Surprise

Most EV drivers see a 15–30% range drop in cold weather. This is not a software bug or a “weak battery.” It is three separate physics effects, each taking its own slice of range.

We will use a simple example:

- 60 kWh usable pack
- 250 km rated range at 25 C
- 0 C winter morning

---

## Cause 1: Reduced Usable Capacity (Typical 10–15%)

**What happens:** internal resistance rises sharply in the cold. Under load, voltage drops more, so the BMS hits V_min earlier and stops discharge while energy still remains in the cell.

Key chain:

- V_terminal = OCV - I x R
- Cold → higher R
- Higher voltage drop at same current
- Cell hits V_min earlier

**Outcome:** less usable capacity at the same SOC. The pack *contains* energy but cannot safely deliver it at the required current.

**Why LFP suffers more:** lower nominal voltage and flatter OCV curve reduce voltage headroom. Small voltage drops translate into large SOC uncertainty.

---

## Cause 2: SOP Derating (Typical 5–10%)

**What happens:** higher resistance reduces allowable power. The BMS publishes a lower max discharge current. The VCU obeys this limit.

**Why it affects range:**

- Higher resistance means more I^2R loss for the same power.
- The vehicle spends more time near power limits on hills, headwinds, or highway merges.
- Drivetrain efficiency shifts away from its optimal operating point.

**Recovery:** after 15–30 minutes of driving, the pack self‑heats and SOP improves. This is why winter performance often “wakes up” mid‑trip.

---

## Cause 3: Heating Energy Cost (Typical 10–25%, largest)

An ICE car uses waste heat. An EV must create heat.

- **Resistive heater:** 3–5 kW continuous in cold weather
- **Heat pump:** 2–4x more efficient (COP 2–4)

Example for a 1‑hour drive:

| Item | Energy |
|---|---|
| Propulsion (same as summer) | ~20 kWh |
| Cabin heating (resistive) | ~4 kWh |
| Battery heating | ~0.5–1 kWh |
| Cold rolling resistance | ~0.5 kWh |
| **Total** | **~25 kWh** |

That is a 25% energy increase for the same trip.

---

## What Preconditioning Fixes (and Doesn’t)

**Fixes:**

- Warms the pack → improves usable capacity and SOP
- Uses grid energy when plugged in → heating is “free” for the driver

**Doesn’t fix:**

- Tire stiffness and aero drag in cold air
- Heat loss once you start driving
- Regen limits at high SOC or very cold pack

Best practice: precondition while plugged in, especially before fast charging.

---

## Chemistry Differences

- **LFP:** more winter‑sensitive due to flat OCV curve and lower voltage headroom
- **NMC/NCA:** better winter performance but still derated at low temperature

---

## Practical Takeaways

- Plug in whenever possible so preconditioning is free.
- Avoid high SOC storage in cold weather.
- Expect the first 15 minutes to be the worst.
- Heat pump matters in cold climates.

---

## Experiments

### Experiment 1: Capacity vs Temperature
**Materials**: 18650 cell, constant current load, thermometer.

**Procedure**:
1. Discharge at 25 C, record Ah.
2. Repeat at 10 C and 0 C.

**What to observe**: Delivered capacity drops in the cold.

### Experiment 2: DCIR vs Temperature
**Materials**: Same setup, pulse load.

**Procedure**:
1. Apply a 1 A pulse at different temperatures.
2. Measure delta V, compute R.

**What to observe**: Resistance rises rapidly below 15 C.

### Experiment 3: Heating Power Budget
**Materials**: Small heater + power meter.

**Procedure**:
1. Measure heater power for 1 hour.
2. Convert kWh to “range” using 5–7 km/kWh.

**What to observe**: Heating alone can cost tens of km per hour of driving.

---

## Literature Review

### Core References
- Pesaran (NREL) — battery thermal management reports
- Waldmann et al. (2014) — temperature‑dependent aging

### Data Sources
- Recurrent Auto winter range analysis
- ADAC winter range tests
- Bjorn Nyland and Out of Spec winter range logs

### Standards
- IEC 62660‑1, SAE J1634
