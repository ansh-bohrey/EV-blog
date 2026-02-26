# Cell Balancing — Keeping the Pack Even

*Prerequisites: [Analog Front End (AFE) →](./analog-front-end-afe.md)*

---

## The Weakest Link Problem

A pack of 100 cells is limited by the single weakest cell. If one cell reaches V_max early, charging stops. If one cell hits V_min early, discharge stops. That’s why **cell balancing** exists: keep cells aligned so the pack can use its full capacity safely.

---

## Why Cells Go Out of Balance

- **Manufacturing variation**: small capacity and impedance differences
- **Thermal gradients**: cells in warmer spots age faster
- **Self-discharge differences**: slight leakage variation accumulates over months
- **Differential aging**: each cell’s SOH diverges over time

Imbalance starts small and grows unless managed.

---

## Why Imbalance Matters

- **Capacity loss**: pack stops when the first cell hits a limit
- **Safety risk**: overcharged cells risk thermal runaway; over-discharged cells risk copper dissolution
- **Performance loss**: the BMS becomes conservative to protect outliers

Even 20–30 mV spread can cost usable Ah in a large pack.

---

## Passive Balancing — Burn the Excess

**How it works**: a resistor and MOSFET bleed energy from high cells until they match the rest.

- Simple and cheap
- Wastes energy as heat
- Typical balancing currents: 50–200 mA
- Usually enabled during the CV phase of charging

This is the dominant approach in most production EVs because it’s robust and low cost.

---

## Active Balancing — Move the Energy

**How it works**: transfer charge from high cells to low cells.

Common topologies:

- **Capacitor shuttling**: simple, slower, moderate efficiency
- **Inductor / flyback**: faster, higher efficiency, more complex
- **Transformer-based**: can move energy across distant cells
- **Cell-to-pack / pack-to-cell**: DC-DC converters at the pack level

Active balancing is 85–95% efficient, but costs more and adds complexity.

---

## Top vs Bottom Balancing

- **Top balancing**: equalize at high SOC; most EVs use this because they often charge to high SOC
- **Bottom balancing**: equalize at low SOC; useful in systems that regularly deep discharge

There is no universal “best” — it depends on the use case and chemistry.

---

## Balancing Algorithm (BMS Logic)

Typical flow:

1. Measure all cell voltages
2. Identify cells above a threshold (e.g., +20 mV)
3. Enable balancing FETs on those cells
4. Stop when delta drops below a lower threshold (hysteresis)
5. Disable balancing if temperature is too high

Balancing is slow relative to charge/discharge, so it needs to run for hours, not minutes.

---

## Practical Considerations

- Balancing generates heat (passive)
- Big packs may balance at module level to reduce wiring
- Good cell matching at manufacturing reduces balancing burden

---

## Takeaways

- Imbalance is inevitable; balancing manages it.
- Passive balancing is simple and dominant; active balancing is efficient but expensive.
- Good thermal design and cell matching reduce how hard balancing must work.

---

## Experiments

### Experiment 1: Create and Observe Imbalance
**Materials**: 4 cells, DMM/AFE, small load.

**Procedure**:
1. Slightly discharge one cell.
2. Connect in series.
3. Charge the string.

**What to observe**: The weakest cell hits V_max first and limits the pack.

### Experiment 2: Passive Balancing in Action
**Materials**: 4 cells, 100 Ohm resistors, MOSFETs, Arduino.

**Procedure**:
1. Enable bleed on the highest cell.
2. Log voltages over time.

**What to observe**: High cell drops slowly; resistor heats up.

### Experiment 3: Capacity Before vs After Balancing
**Materials**: Same pack.

**Procedure**:
1. Measure pack capacity before balancing.
2. Balance to within 10 mV.
3. Measure again.

**What to observe**: Usable capacity increases after balancing.

---

## Literature Review

### Core References
- Plett — *Battery Management Systems Vol. 1*
- Andrea — *Battery Management Systems for Large Li-ion Battery Packs*

### Key Papers / Notes
- TI SLVA521 — Cell balancing basics
- Analog Devices balancing app note
- Baronti et al. (2014) — active balancing
