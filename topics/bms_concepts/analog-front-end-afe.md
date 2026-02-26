# Analog Front End (AFE) — Blog Plan

## Goal
Explain what an AFE chip is, what it measures and how, why it is the eyes and ears of the BMS, and how to interface with one — from "what is an ADC" to understanding a BQ76940 register map.

## Audience Angles
- **Engineers / students**: Delta-sigma ADC architecture, current measurement techniques, daisy-chain isolation, register-level interface
- **EV enthusiasts**: "How does the BMS actually read each cell's voltage without getting fried?", why measurement accuracy matters for SOC precision

---

## Subtopic Flow

### 1. Hook — The BMS's Sensory System
- A BMS without accurate measurements is like a pilot flying blind
- A 10mV voltage measurement error can translate to a 2–3% SOC error — leading to premature cutoffs or unreported overcharges
- The AFE chip is the hardware that sits between the raw electrochemical world of the cells and the digital BMS microcontroller
- It handles: voltage that can range from 0 to 800V, current up to 1000A, temperatures from -40 to +85°C — and reports all of this digitally to the MCU

### 2. What is an AFE?
- Definition: an Analog Front End (AFE) is an integrated circuit that conditions, measures, and digitizes analog signals from the battery cells
- Contrast with general-purpose ADCs: AFE chips are purpose-built for battery monitoring — they include cell voltage multiplexing, built-in reference voltages, CRC-protected digital output, and often built-in balancing FET drivers
- Examples of common AFE chips: TI BQ76920 (5-cell), BQ76930 (10-cell), BQ76940 (15-cell), BQ769x0 series; Analog Devices LTC6804, LTC6811, LTC6812; Renesas RAA489100; Maxim MAX17843; NXP MC33771

### 3. Cell Voltage Measurement
- **The challenge**: cells in a series string have voltages that stack — cell 10 in a 15S pack sits at ~36V above ground. You cannot directly connect a standard ADC referenced to ground.
- **Solution**: differential measurement — measure V+ minus V- of each cell, independent of its absolute voltage relative to ground
- **Architecture**: flying capacitor multiplexer or direct delta-sigma conversion per channel
- **Delta-sigma ADC**: oversampled, high-resolution (16-bit typical), trades conversion speed for noise rejection — ideal for battery voltage (slow-changing, need accuracy over speed)
- Accuracy: typically ±1–5 mV cell voltage measurement accuracy
- Measurement rate: all cells measured in a round-robin, full scan time ~1–10ms for 15 cells

### 4. Current Measurement
- Pack current flows through a shunt resistor (e.g., 0.5–2 mΩ) — voltage across shunt = I × R_shunt
- AFE includes a high-side current sense amplifier to measure this small differential voltage (µV to mV range) against the large common-mode voltage
- Alternatively: Hall-effect current sensor — contactless, galvanically isolated, but less accurate
- Accuracy matters: 1% current sensor error → 1% Coulomb counting error → SOC drift
- Some AFEs integrate the current sense amp (TI BQ34z100-G1 series); others expect external current sense IC

### 5. Temperature Measurement
- NTC (Negative Temperature Coefficient) thermistors are the standard: resistance decreases as temperature rises
- AFE provides excitation current/voltage to NTC, measures resulting voltage, converts to temperature via Steinhart-Hart equation or lookup table
- Placement: one thermistor per module or every N cells — strategic placement matters for hotspot detection
- Accuracy: ±1–2°C typical, adequate for thermal management thresholds

### 6. Balancing Control
- AFE chips include built-in MOSFET gate drivers for passive balancing
- Each cell has a corresponding control bit in an AFE register — BMS software writes to this register to enable/disable balancing for each cell
- Maximum balancing current determined by external bleed resistor
- Some AFEs include balancing FETs on-chip (less common for high-current applications)

### 7. Communication to the MCU
- Most AFEs use SPI (2–4 MHz, full-duplex)
- Register map: BMS software sends read/write commands to specific register addresses
  - Configuration registers: set OV/UV thresholds, enable balancing, enable protection
  - Status registers: read fault flags, alert bits
  - Data registers: read cell voltages, temperatures, current
- CRC protection: responses include a checksum so MCU can detect communication errors
- Show a simplified read transaction: CS low → send command byte → receive data bytes → CS high → verify CRC

### 8. Daisy-Chain Topology for Large Packs
- A 96S pack (e.g., ~350V) cannot use a single AFE chip (max ~15–20 cells per chip)
- Solution: daisy-chain multiple AFEs — each chip monitors its group of cells, passes data up or down the chain
- Isolation challenge: each module's AFE is at a different HV potential relative to the BMS MCU
- isoSPI (LTC6804/LTC6811): transformer-isolated differential communication — each AFE uses small pulse transformer to pass data across isolation barrier while floating at its module's HV potential
- BMS MCU sends a broadcast command; data propagates down the chain; responses propagate back
- Show block diagram of 6× LTC6804 daisy chain for a 90S (6 modules × 15 cells) pack

### 9. Protection Functions in Hardware
- Many AFEs include hardware-speed protection: OV/UV comparators that trigger a protection FET or alert pin within microseconds, independent of MCU software
- This is the last-resort hardware protection layer: even if the MCU hangs or is too slow, the AFE can cut off a dangerous cell
- Protection thresholds are programmed into AFE registers by BMS firmware during initialization

### 10. Takeaways
- The AFE is doing the hard electrical engineering work of bridging the analog, high-voltage battery world with the digital MCU world
- Measurement accuracy directly limits SOC accuracy — this is where hardware quality shows up in software performance
- Understanding AFE register maps is the first step to writing real BMS firmware

---

## Experiment Ideas

### Experiment 1: Interface with a BQ76940 (or BQ76920) Eval Board
**Materials**: TI BQ76940EVM or breakout board, Arduino, 15× (or 5×) Li-ion cells, SPI wires, serial monitor
**Procedure**:
1. Wire up eval board per TI reference schematic (SPI, ALERT pin, 12V supply)
2. Write Arduino SPI driver: send read cell voltage command, parse response for all 15 cells
3. Display all cell voltages on serial monitor, update every 1s
4. Compare readings against precision DMM on each cell

**What to observe**: SPI transaction structure, register map navigation, measurement accuracy, effect of EMI/noise on readings.

### Experiment 2: Measure the Effect of Measurement Accuracy on SOC
**Materials**: Same setup + known reference voltage source (e.g., precision voltage reference IC)
**Procedure**:
1. Apply known reference voltages to AFE inputs (instead of real cells)
2. Read AFE output and compare to known truth
3. Compute measurement error in mV
4. Calculate implied SOC error using OCV-SOC curve slope (Δ SOC / Δ V)

**What to observe**: How mV-level measurement error translates to meaningful SOC error, especially in flat OCV-SOC regions like LFP.

### Experiment 3: Daisy-Chain Simulation (Two BQ76920 or LTC6804 chips)
**Materials**: 2× BQ76920 breakout boards, 10× cells, Arduino
**Procedure**:
1. Chain two BQ76920 boards (each monitors 5 cells)
2. Implement broadcast read that polls both chips sequentially using their SPI chip-select lines
3. Display all 10 cell voltages in one serial report

**What to observe**: Multi-chip coordination, the daisy-chain concept, and the increased software complexity vs single-chip designs.

---

## Literature Review

### Core Textbooks
- **Razavi, B.** — *Design of Analog CMOS Integrated Circuits* — for understanding the delta-sigma ADC architecture (advanced)
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* — AFE chip selection and interface

### Key References
- **TI BQ76940 Datasheet** — complete register map, timing diagrams, application schematics — the primary reference for BQ-series BMS firmware development
- **Analog Devices LTC6804 Datasheet + Application Notes** — isoSPI daisy-chain details; comprehensive
- **TI BQ34z100-G1 Technical Reference Manual** — integrated gauge with current sensing — shows how measurement feeds estimation
- **Maxim MAX17843 Datasheet** — automotive-grade AFE for large packs

### Application Notes
- TI Application Report SLUAA14 — "BQ76940 Firmware Development Guide" — step-by-step SPI register access
- Analog Devices AN-2394 — "LTC6804 Battery Stack Monitor Demonstration System"
- TI Application Report SLVA729 — "Li-Ion Battery Pack Protection Fundamentals"

### Online Resources
- Battery Mangement Solutions YouTube channel — TI AFE demo and explanation videos
- DigiKey Electronics blog — "How to Choose a Battery Management IC"
- GitHub: nwesem/bq76940_arduino — open-source Arduino BQ76940 library (good code reference)
- GitHub: analogdevicesinc/Linduino — LTC6804 Arduino examples
