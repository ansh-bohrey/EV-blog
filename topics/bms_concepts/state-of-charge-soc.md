# State of Charge (SOC) — Blog Plan

## Goal
Explain what SOC is, why it is hard to measure, and how a BMS estimates it — from fuel-gauge intuition to Kalman filter concepts.

## Audience Angles
- **Engineers / students**: Dig into the math of Coulomb counting, OCV-SOC curve physics, Extended Kalman Filter structure
- **EV enthusiasts**: "Why does my range estimate jump around?" — answered through estimation uncertainty and temperature effects

---

## Subtopic Flow

### 1. Hook — The Fuel Gauge Problem
- Your phone battery percentage is a lie — and so is your EV range estimate
- Unlike a fuel tank (volume = energy), a battery's "fullness" is an internal electrochemical state with no direct sensor
- Introduce the central challenge: SOC is unobservable directly

### 2. What is SOC? — The Formal Definition
- SOC = (Remaining Ah capacity) / (Full Ah capacity) × 100%
- 0% = empty by convention, 100% = fully charged
- Distinguish: SOC is not voltage (a 4.2V Li-ion cell is not always at 100%)
- Note that "usable SOC" window is often 20–80% in practice (longevity reason — link to SOH post)

### 3. The OCV–SOC Relationship
- At rest, a cell's open-circuit voltage (OCV) is a known function of SOC
- Explain the OCV-SOC curve: flat region in LFP (why LFP SOC is so hard), steep region in NMC
- Temperature shifts the curve — cold battery reads artificially low voltage
- This is the most accurate method but only works at equilibrium (rest > 2h)

### 4. Coulomb Counting — The Simple Approach
- Integrate current over time: ΔSOC = (∫ I dt) / Q_nominal
- Intuitive — like tracking fuel flow with a flow meter
- Problem 1: Current sensor has offset error → drift accumulates
- Problem 2: Q_nominal changes with aging (link to SOH post)
- Problem 3: Coulombic efficiency is not 100% — some charge is lost to side reactions
- Still the backbone of most production BMS systems

### 5. Model-Based Estimation — Getting Smarter
- Equivalent Circuit Model (ECM): R0 + RC pairs → models voltage response to current
- The ECM lets us predict terminal voltage given SOC and current
- Extended Kalman Filter (EKF): fuse Coulomb counting + voltage model to correct drift
- Intuition: EKF = GPS analogy (dead reckoning + landmark fix)
- Mention Particle Filter, Sigma-Point KF as more accurate alternatives
- Keep math conceptual — show state equation structure, not derivation

### 6. Data-Driven Approaches (Brief)
- LSTM / Neural nets trained on voltage-current-temperature data
- Advantages: captures nonlinear aging effects
- Disadvantages: black box, training data requirements, embedded deployment cost
- Emerging research area, not yet dominant in production

### 7. Challenges in Practice
- Temperature: cold battery shrinks usable capacity, SOC estimate must adapt
- Aging: Q_nominal drifts down over time — needs periodic recalibration
- Cell-to-cell variation in a pack: pack SOC ≠ cell SOC, weakest cell limits
- Sensor noise, offset, and quantization errors
- High C-rate transients make voltage-based correction harder

### 8. How the BMS Uses SOC
- SOC is the primary input for: remaining range estimate, charge/discharge current limits, cell balancing trigger
- Low SOC → trigger deep-discharge protection cutoff
- High SOC → taper charge current, enable balancing

### 9. Takeaways
- SOC is always an estimate, never a measurement
- Good BMS = good sensor quality + good algorithm + calibration strategy
- Next: SOH explains why Q_nominal changes over time

---

## Experiment Ideas

### Experiment 1: Build the OCV–SOC Curve
**Materials**: 2–4 Li-ion 18650 cells (mix of NMC and LFP if possible), bench charger, precision DMM, Arduino + current shunt
**Procedure**:
1. Fully charge cell, rest 2h
2. Discharge in 10% SOC steps using known constant current, rest 30 min at each step
3. Record resting voltage (OCV) at each step
4. Plot OCV vs SOC

**What to observe**: The flat plateau of LFP vs the sloped curve of NMC. Show why LFP SOC is hard to estimate from voltage alone.

### Experiment 2: Coulomb Counting Drift Demo
**Materials**: Arduino, ACS712 or INA219 current sensor, 18650 cell, load resistor
**Procedure**:
1. Fully charge cell, set SOC = 100%
2. Discharge at constant current, track SOC via Coulomb counting
3. Recharge, repeat 10 cycles
4. Compare estimated SOC at full charge (should drift from 100% over cycles)

**What to observe**: Accumulated integration error, and how a voltage reset at full charge re-anchors the estimate.

### Experiment 3: Temperature Effect on Apparent SOC
**Materials**: Same setup + temperature chamber or fridge
**Procedure**:
1. Charge cell fully, rest 1h at 25°C, record OCV
2. Cool to 5°C, rest 1h, record OCV
3. Heat to 45°C, rest 1h, record OCV
4. Compare OCV at same true SOC across temperatures

**What to observe**: OCV shifts with temperature → naive OCV lookup gives wrong SOC at cold temperatures.

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 1: Battery Modeling* (2015, Artech House) — the definitive reference; Ch. 3–5 directly cover OCV, Coulomb counting, ECM
- **Plett, G.L.** — *Battery Management Systems, Vol. 2: Equivalent-Circuit Methods* (2015) — EKF and SOC estimation in depth
- **Linden & Reddy** — *Handbook of Batteries* (4th ed.) — cell chemistry background

### Key Papers
- Plett, G.L. (2004) — "Extended Kalman filtering for battery management systems" — *J. Power Sources* 134(2) — foundational EKF SOC paper
- Hu, X. et al. (2012) — "A comparative study of equivalent circuit models for Li-ion batteries" — *J. Power Sources* 198
- Chemali, E. et al. (2018) — "Long short-term memory networks for accurate SOC estimation" — *IEEE Trans. Industrial Electronics*
- Ng, K.S. et al. (2009) — "Enhanced Coulomb counting method for estimating SOC" — *J. Power Sources* 182

### Online Resources
- Texas Instruments Application Notes on BQ series BMS chips (bq76940, bq34z100) — practical SOC implementation
- Battery University (batteryuniversity.com) — Sections on Li-ion characteristics and charging
- Orion BMS documentation — real-world SOC calibration strategy
- CSS Electronics — CAN bus and BMS data logging tutorials

### Standards / Application Notes
- USABC Electric Vehicle Battery Test Procedures Manual — defines SOC test methodology
- IEC 62660-1 — Secondary lithium-ion cells for EVs, capacity and power testing
- SAE J2288 — Life cycle testing of EV battery modules
