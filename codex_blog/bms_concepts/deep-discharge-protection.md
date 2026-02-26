# Deep Discharge Protection — The Battery That Won’t Wake Up

*Prerequisites: [SOC →](./state-of-charge-soc.md)*

---

## The Battery That Won’t Wake Up

Everyone has seen a phone left dead too long that won’t turn on. In EVs, the same thing happens when cells are discharged **below their minimum voltage**. That damage can be permanent. Deep discharge is not “0% SOC” — it is below the safe cutoff.

---

## What Is Deep Discharge?

Normal Li-ion operation is roughly:

- NMC/NCA: ~4.2 V full to ~2.5–3.0 V empty
- LFP: ~3.6 V full to ~2.5 V empty

Deep discharge is **below V_min**. Below ~2.0 V, copper dissolution starts and the cell is permanently compromised.

---

## What Happens Inside

- **Copper dissolution**: the anode current collector dissolves into the electrolyte below ~2.0 V
- **Dendrite risk on recharge**: copper can plate unevenly and short the cell
- **SEI instability**: protective layers degrade

This is irreversible damage. Recovery does not restore original capacity or safety margin.

---

## How the BMS Prevents It

- Monitors every cell voltage
- Opens contactors if any cell drops below UV threshold
- Uses debounce logic to avoid false UV from transient IR drop
- Logs UV faults with cell ID and timestamp

Thresholds are set high enough to avoid copper dissolution, but low enough to avoid nuisance trips under load.

---

## Long-Term Storage Risk

Cells self-discharge 1–3% SOC per month at room temperature. Left for months, a pack can drift into deep discharge if the BMS or 12 V system is down.

**Best practice**: store at 40–60% SOC and top-up periodically.

---

## Recovery Charging (If It’s Not Too Late)

If a cell is below cutoff but above the irreversible zone:

1. Apply very low current (C/20 to C/10)
2. Raise voltage to ~3.0 V
3. Only then switch to normal CC–CV

If voltage doesn’t recover or temperature rises abnormally, the cell is unsafe.

---

## Takeaways

- Deep discharge is preventable and often permanent if it happens.
- UV thresholds and recovery charge logic are core safety features.
- Long-term storage should be at mid-SOC, not full or empty.

---

## Experiments

### Experiment 1: Controlled Deep Discharge (Sacrificial)
**Materials**: 18650 cell, load, DMM.

**Procedure**:
1. Discharge to V_min, record recovery.
2. (Optional) continue to 2.0 V and compare capacity after recovery.

**What to observe**: Capacity loss and slower voltage recovery after deep discharge.

### Experiment 2: Self-Discharge Rate
**Materials**: 4 identical cells, DMM.

**Procedure**:
1. Store at room temperature.
2. Measure OCV weekly for 8 weeks.

**What to observe**: Cell-to-cell spread and long-term drift.

### Experiment 3: Recovery Charge Demo
**Materials**: Current-limited supply.

**Procedure**:
1. Pre-charge at C/20 from ~2.2 V.
2. Switch to CC–CV at 3.0 V.

**What to observe**: Slow recovery and increased internal resistance.

---

## Literature Review

### Core References
- Linden & Reddy — *Handbook of Batteries*
- Arora et al. (1998) — capacity fade mechanisms

### Standards / Notes
- IEC 62133 — over-discharge testing
- TI SLUA961 — low-voltage recovery charging
