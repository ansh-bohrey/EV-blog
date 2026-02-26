# Charging Algorithm — Blog Plan

## Goal
Explain how Li-ion batteries are charged, why the CC-CV profile is shaped the way it is, what variations exist (multi-stage, fast charge, temperature-adaptive), and how the BMS controls the process and communicates with the charger.

## Audience Angles
- **Engineers / students**: Electrochemical basis of CC-CV, lithium plating limits on charge rate, charger-BMS communication protocols, thermal management during charging
- **EV enthusiasts**: "Why does fast charging slow down at 80%?", the real cost of frequent fast charging to battery health, why charging in the cold is slower

---

## Subtopic Flow

### 1. Hook — Why Not Just Dump Current In?
- Charging a Li-ion battery is not like filling a bucket — it is a delicate electrochemical process
- Push too hard: lithium deposits as metal (lithium plating) → dendrites → internal short → thermal runaway
- Push too soft: takes too long → impractical for EV use
- The charging algorithm is the BMS's choreography of current and voltage over time — balancing speed and safety

### 2. The Electrochemistry of Charging (Accessible Version)
- During charge: lithium ions migrate from cathode to anode, intercalate into graphite layers
- The graphite anode has a limited rate at which it can accept lithium ions
- Exceed this rate → lithium cannot intercalate fast enough → deposits as metallic lithium on the anode surface
- Lithium plating: irreversible capacity loss + dendrite growth risk
- Cold temperature: ion diffusion in electrolyte slows → plating risk increases dramatically → must reduce charge rate
- High SOC: fewer available intercalation sites in anode → limit charge rate as battery fills up

### 3. CC-CV — The Standard Protocol
- **Constant Current (CC) phase**: charge at a fixed current (e.g., 1C or 0.5C) from low SOC until cell voltage reaches V_max (e.g., 4.2V for NMC)
  - During CC: voltage rises steadily as SOC increases
  - Most of the charge (typically 70–80% of capacity) is delivered in this phase
- **Constant Voltage (CV) phase**: hold voltage at V_max, let current taper naturally as cell fills
  - Current decreases exponentially as the anode fills and concentration gradients equalize
  - Charge complete when current drops below a threshold (e.g., C/20, C/10)
  - This phase is slower but necessary to top off the cell safely
- Show V and I vs time plot — the signature CC-CV shape: current flat then falling, voltage rising then flat

### 4. Why CV Phase Slows Down at 80%
- The curve that fast chargers show (full speed to ~80%, then slow) is the transition from CC to CV
- At 80% SOC, the cell voltage hits V_max → charger transitions to CV → current tapers → power drops
- This is not a charger limitation — it is physics of the cell. Pushing more current at high SOC = lithium plating.
- Good for users to understand: the last 20% is always slower — plan around it, not against it

### 5. Temperature-Adaptive Charging
- Cold battery: reduce CC current significantly
  - Below 0°C: charge should be very limited or stopped entirely (plating risk)
  - 0–15°C: use reduced C-rate (e.g., C/4 instead of 1C)
  - 15–45°C: normal charge rate
  - Above 45°C: reduce charge rate, prioritize cooling
- BMS applies derating factor to max charge current based on temperature
- Modern EVs pre-heat the battery pack before DC fast charging — BMS-managed preconditioning
- Show charge current derating curve vs temperature

### 6. Charging Rate and Battery Health Trade-off
- Lower C-rate = less lithium plating risk = better SOH retention over lifetime
- The Severson et al. / Attia et al. research: fast charging protocols can be optimized (not just CC-CV) to reduce plating without sacrificing speed
- For EV enthusiasts: occasional fast charging is fine; daily 150kW fast charging is measurably more damaging than Level 2 AC charging
- Real-world: most EV OEMs limit fast charge C-rate below what the hardware could support, as a health-preserving design choice

### 7. Multi-Stage and Advanced Charging
- **Multi-stage CC-CV**: two or more CC steps (e.g., 1C to 70% SOC, then 0.5C to 90%, then CV to 100%)
  - Better balances speed and safety — reduces time in high-SOC fast-charge region
- **Pulse charging**: alternating charge/rest pulses — claimed to reduce concentration gradients, allow faster average C-rate
  - Evidence mixed; used in some portable device chargers; emerging research for EV fast charge
- **Negative pulse / depolarization**: brief discharge pulses during charge — claimed to reduce lithium plating
- **Optimal charging protocols**: Attia et al. 2020 Nature — used ML to find non-CC-CV protocols that minimize degradation at similar speed. Shows the design space is larger than CC-CV.

### 8. Upper Voltage Limit and Partial Charging
- Charging to 100% (V_max) vs 80%: cathode spends more time in a highly oxidized, strained state at high SOC
- BMS can offer "charge limit" setting: charge to 80% daily, 100% for long trips
- Real effect: charging to 80% instead of 100% meaningfully extends calendar and cycle life (reduced cathode stress)
- This is a BMS feature: user-configurable SOC target, not just chemistry

### 9. Charger — BMS Communication
- **AC Level 1/2 (J1772 / IEC Type 2)**: pilot signal in connector negotiates max current; BMS adjusts onboard charger accordingly; BMS controls the final current profile
- **DC fast charging (CHAdeMO)**: CAN bus messages — vehicle sends target voltage and current request; charger responds; BMS monitors and adjusts requests in real time; BMS can reduce demand anytime for safety
- **CCS Combo**: uses PLC (ISO 15118) for initial handshake, then a CAN-like protocol; similar dynamic request mechanism
- BMS publishes: max charge voltage, max charge current, target current; charger obeys; BMS independently monitors cells and overrides if needed

### 10. Charging Safety Functions
- BMS monitors every cell voltage during charging — not just pack voltage
- Stops charge immediately on: any cell OV, OT, or OCC
- Resumes (or reduces current) if condition clears
- Pre-charge from very deep discharge before applying full charge current
- Insulation resistance monitoring during charge (ground fault detection)

### 11. Takeaways
- CC-CV is elegant precisely because it automatically adapts: current is limited by chemistry at high SOC
- Temperature adaptation is not optional — it is the difference between a working battery and a plated one
- Engineers: the charger and BMS must work as a control loop, not independently; BMS is always the authority on cell limits
- Enthusiasts: charge to 80% daily, keep the battery warm, and the battery will last

---

## Experiment Ideas

### Experiment 1: Log a Complete CC-CV Cycle
**Materials**: Lab bench charger (CC-CV mode), 18650 cell, INA219 current sensor, Arduino, data logger
**Procedure**:
1. Set charger to CC = 0.5A, CV = 4.2V, termination at 50mA
2. Log voltage and current at 5s intervals throughout
3. Plot V(t) and I(t) on same graph
4. Identify CC phase end (when V reaches 4.2V) and CV phase (current tapering)
5. Integrate current in each phase to compute Ah delivered in CC vs CV

**What to observe**: The CC-CV signature. Quantify how much capacity is delivered in each phase. Repeat at 1C vs C/2 — show how higher C-rate ends CC phase sooner (voltage hits 4.2V earlier due to IR drop).

### Experiment 2: Temperature vs Charge Rate
**Materials**: Same + thermistor + temperature-controlled environment
**Procedure**:
1. Charge at C/2 rate at 25°C, log full profile
2. Cool cell to 10°C, charge at C/2 rate — observe: voltage hits 4.2V sooner, CC phase shorter, less capacity in CC
3. Repeat at 5°C — observe further degradation of CC phase
4. Demonstrate: at 5°C, reduce to C/10 rate — show normal-looking charge profile

**What to observe**: How temperature affects apparent charge rate limits. Visualize why BMS must derate at low temperature.

### Experiment 3: Partial vs Full Charge — Voltage Profile Difference
**Materials**: Same setup
**Procedure**:
1. Record full CC-CV cycle to 4.2V
2. Set charge limit to 4.10V (~90% SOC equivalent for NMC) — repeat charge
3. Set limit to 4.05V (~80% SOC) — repeat charge
4. Compare time, total Ah, and terminal voltage profile for each

**What to observe**: Time savings from partial charge. Platform for discussing SOH impact of upper voltage limit.

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 1* — CC-CV charging fundamentals and BMS charge control
- **Linden & Reddy** — *Handbook of Batteries* — Li-ion charging sections

### Key Papers
- **Cocconi, A. & Shuki, D.** (1995) — early fast-charge work referenced in automotive charging
- **Zhang, S.S.** (2006) — "The effect of the charging protocol on the cycle life of a Li-ion battery" — *J. Power Sources* 161
- **Attia, P.M. et al.** (2020) — "Closed-loop optimization of fast-charging protocols for batteries with machine learning" — *Nature* — landmark paper on optimized non-CC-CV charging
- **Notten, P.H.L. et al.** (2005) — "Boostcharging Li-ion batteries: A challenging new charging concept" — pulse charging evaluation
- **Collin, R. et al.** (2019) — "Advanced electric vehicle fast-charging technologies" — *Energies* — charging protocol survey for EVs

### Online Resources
- Battery University — "BU-409: Charging Lithium-Ion", "BU-702: How to Charge a Battery"
- Plug In America — real-world EV charging tips and range discussions
- Lucid Air / Tesla / Rivian charging curve documentation — real manufacturer charge curve data
- ChargePoint, IONITY — fast charger side perspective on negotiation protocols
- EV Database — comparative charging curves for different EV models

### Standards / Application Notes
- **IEC 62196** — EV charging connectors (Type 1, Type 2 pilot signal)
- **SAE J1772** — AC charging interface; pilot signal level ↔ current capability encoding
- **CHAdeMO 1.2 / 2.0 specification** — DC fast charge CAN protocol messages
- **ISO 15118** — V2G and smart charging communication standard
- TI Application Note SLUA967 — "Implementing CC-CV Charging with the BQ25703A"
