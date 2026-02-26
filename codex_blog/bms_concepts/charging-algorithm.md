# Charging Algorithm — Why Fast Charging Slows Down

*Prerequisites: [Cell Fundamentals →](../battery/cell.md), [SOC →](./state-of-charge-soc.md)*

---

## Why Not Just Dump Current In?

Charging a Li-ion battery is a controlled electrochemical process. Push too hard and lithium plates on the anode, risking capacity loss or dendrites. Push too soft and charging becomes impractical. The charging algorithm balances speed, safety, and longevity.

---

## The Electrochemistry (Accessible Version)

During charge, Li+ ions move from cathode to anode and intercalate into graphite. At high current, low temperature, or high SOC, the anode cannot accept ions fast enough. The excess lithium plates as metal. That’s the root reason charging must slow down.

---

## CC–CV: The Standard Protocol

**Constant Current (CC):** charge at a fixed current until cell voltage reaches V_max.

**Constant Voltage (CV):** hold V_max and let current taper naturally.

Most of the charge (often 70–80%) happens during CC. The last 20% is CV, which is why fast charging slows down after ~80%.

---

## Temperature-Adaptive Charging

- **Cold (<10 C):** reduce current or stop (plating risk)
- **Moderate (15–45 C):** normal charge rate
- **Hot (>45 C):** reduce current and prioritize cooling

Modern EVs precondition the pack before fast charging to move into the safe temperature window.

---

## Charge Rate vs Battery Health

- Lower C-rate = less plating risk and slower aging
- Fast charging is fine occasionally; daily high-rate fast charging accelerates SOH loss
- OEMs often limit fast charge rates below absolute hardware limits to protect longevity

---

## Multi-Stage and Advanced Charging

- **Multi-stage CC–CV**: step down current as SOC rises
- **Pulse charging**: alternating charge/rest pulses (mixed evidence)
- **Optimized protocols**: Attia et al. showed ML-optimized profiles can reduce degradation without huge time penalties

---

## Charger ↔ BMS Communication

- **AC (J1772 / IEC Type 2):** pilot signal sets max current; BMS controls the charge profile
- **DC fast charge (CHAdeMO, CCS):** BMS requests voltage/current targets and can reduce them in real time

The BMS is always the final authority because it sees individual cell voltages and temperatures.

---

## Charging Safety Functions

- Monitor each cell voltage during charge
- Stop charge on OV, OT, or over-current
- Pre-charge gently from very low SOC
- Monitor isolation resistance during DC fast charging

---

## Takeaways

- CC–CV slows at high SOC for chemistry reasons, not charger limits.
- Temperature control is essential; charging cold is the biggest risk.
- BMS and charger must operate as a closed control loop.

---

## Experiments

### Experiment 1: Log a CC–CV Cycle
**Materials**: CC–CV charger, 18650 cell, INA219.

**Procedure**:
1. Charge at 0.5C to 4.2 V with 0.05C termination.
2. Log V and I over time.

**What to observe**: CC phase dominates energy delivery; CV is the slow tail.

### Experiment 2: Temperature vs Charge Rate
**Materials**: Same setup, cold environment.

**Procedure**:
1. Charge at 25 C and 10 C.
2. Compare CC phase length and taper behavior.

**What to observe**: Cold shortens CC and forces earlier taper.

### Experiment 3: Partial vs Full Charge
**Materials**: Same setup.

**Procedure**:
1. Charge to 4.2 V.
2. Repeat with 4.1 V and 4.05 V limits.

**What to observe**: Partial charge saves time and reduces stress.

---

## Literature Review

### Core References
- Plett — *Battery Management Systems Vol. 1*
- Linden & Reddy — *Handbook of Batteries*

### Key Papers / Standards
- Zhang (2006) — charging protocol impact
- Attia et al. (2020) — optimized fast charging
- SAE J1772, IEC 62196, ISO 15118, CHAdeMO specs
