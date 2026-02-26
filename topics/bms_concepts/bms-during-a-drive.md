# BMS During a Drive — Blog Plan

## Goal
Walk through a single 30-minute commute as a narrative, showing exactly what the BMS is doing at each moment — tying together SOC, SOP, balancing, fault detection, thermal management, and communication into one coherent story, with no equations.

## Audience Angles
- **Engineers / students**: This post shows how all the BMS subsystems interact in real time — the sequence of events, the state machine transitions, the CAN messages being sent. A system-level view of what the firmware is actually executing.
- **EV enthusiasts**: This is the "making sense of it all" post. Every time your car does something you didn't understand — the 2-second delay at startup, the power cut when you accelerate hard in the cold, the range number changing after you park — this post explains it.

---

## Subtopic Flow

### 1. Hook — 30 Minutes, Hundreds of Decisions
- In the next 30 minutes, the BMS will read cell voltages ~18,000 times, update the SOC estimate ~3,600 times, send ~18,000 CAN messages, and make dozens of protection decisions — all without you noticing.
- This post follows one commute, start to finish. No equations. Just the BMS doing its job.

### 2. T = 0:00 — Key On
**What the driver does**: presses the start button.

**What the BMS does**:
- Ignition signal arrives at BMS microcontroller — it wakes from low-power sleep mode
- BMS boots: initializes RAM, loads calibration tables from flash (OCV-SOC curve, ECM parameters, fault thresholds)
- AFE chips start up: first voltage scan completes — all 96 (or however many) cell voltages are now available
- Self-check: are all cells within expected voltage range? Are temperatures within power-on limits? Is the CAN bus responding?
- **SOC initialization**: cells have been resting since last drive (say, 8 hours). Enough time for voltage to settle to OCV. BMS reads all cell OCVs, looks up the OCV-SOC table, initializes SOC estimate. This is the most accurate SOC reading it will get all day.
- Pre-charge sequence: main negative contactor closes → pre-charge contactor closes → inverter capacitors charge through pre-charge resistor → ~250ms → main positive contactor closes → pre-charge contactor opens → HV bus live.
- BMS publishes "Ready" on CAN: SOC, pack voltage, max discharge current, charge enable = true. VCU reads this, signals instrument cluster: "Ready to drive."

**Duration**: ~1.5–2.5 seconds. This is the delay between pressing start and seeing "Ready."

### 3. T = 0:02 — First Acceleration (Cold Morning, 5°C)
**What the driver does**: pulls out of the driveway, moderate acceleration.

**What the BMS does**:
- Current sensor reads discharge current: 80A from a 400V pack = 32 kW.
- Every cell voltage is measured: 96 cells, each drops by I × R₀ = 80A × 0.003Ω = 0.24V from their rest voltage. The BMS knows this is IR drop, not actual SOC change.
- Cell temperature: still cold from overnight. BMS notes: temperature = 5°C.
- SOP calculation: at 5°C, R₀ is 2–3× higher than at 25°C. BMS computes max safe current based on coldest cell voltage headroom. This morning it's lower than usual.
- BMS publishes updated max discharge current on CAN. VCU is reading this and has already capped the torque request accordingly — the car might feel slightly sluggish compared to a warm day.
- SOC update: Coulomb counting begins. SOC decrements by (∫I dt) / Q_nominal.
- Balancing: disabled during discharge (passive balancing only runs during charging). BMS monitors cell voltage spread — if it exceeds 50mV, it will flag an imbalance event for later.

### 4. T = 0:05 — Highway On-Ramp (Hard Acceleration)
**What the driver does**: full throttle merge.

**What the BMS does**:
- Current spikes: 250A (100 kW from the pack).
- Terminal voltage of each cell: OCV − 250A × 0.003Ω = OCV − 0.75V. Some cells are now near their minimum voltage threshold.
- BMS checks: is any cell below V_min? No — still safe. SOP was calculated with headroom for this.
- But: temperature has been rising. Cells are now at 12°C, up from 5°C. The BMS recalculates SOP — slightly higher than at startup. Current limit is relaxed a little.
- Thermal management controller: coolant pump running at medium speed, preemptively managing heat before it accumulates.

### 5. T = 0:10 — Steady Highway Cruise (110 km/h)
**What the driver does**: cruise control set.

**What the BMS does**:
- Current is steady: ~60A (24 kW).
- SOC is ticking down smoothly via Coulomb counting.
- Every cell voltage logged: the BMS is watching for the one cell that dips faster than others — a sign of higher internal resistance or lower capacity (early SOH flag).
- Temperature scan: cell temperatures are now 22°C — near optimal. Coolant pump at low speed.
- CAN traffic: BMS is sending SOC, pack voltage, temperatures, and max power limits every 100ms. Instrument cluster is displaying a range estimate. Nothing dramatic happening — this is the BMS at its most comfortable.
- Isolation monitoring running in background: continuously checking HV-to-chassis insulation resistance. All fine.

### 6. T = 0:18 — Traffic Braking (Regen)
**What the driver does**: lifts throttle, traffic ahead.

**What the BMS does**:
- Current reverses: now charging at −40A (regen braking, 16 kW back into the pack).
- SOC starts climbing.
- BMS checks charge acceptance: SOC is at 72% — plenty of headroom. BMS publishes max charge current = 100A. VCU can use up to 100A of regen. Driver gets strong regen feel.
- Cell voltages rise under charging current: V = OCV + I × R₀. BMS watches for any cell approaching V_max.
- Temperature check: charging generates less heat than discharging at the same |I| (different R₀ and entropic contribution). Temperature holding steady.

### 7. T = 0:22 — Unexpected Event: One Cell Temperature Spike
**What the driver does**: nothing different.

**What the BMS does**:
- Temperature sensor on cell group 7 reads 38°C — others are at 25°C. Anomaly.
- BMS: is this a sensor fault or real? Cross-check with adjacent sensors: cell group 6 at 27°C, group 8 at 26°C. The jump is too large — either a hotspot or sensor fault.
- Debounce timer: condition persists for 3 consecutive scans (300ms). Not a transient. BMS escalates.
- Level 1 warning: BMS reduces max discharge current by 20%, instructs thermal management controller to increase coolant pump to maximum.
- Flag logged to EEPROM with timestamp and freeze-frame: all cell voltages, temperatures, current at the moment of detection.
- CAN message updated: fault byte bit 4 set — "thermal warning." VCU receives it. Dashboard shows a thermal warning icon (amber, not red — Level 1, not critical).
- Driver notices: slight reduction in performance. Car still drivable.
- Over next 2 minutes: temperature on group 7 drops to 30°C with max cooling. BMS clears the warning but keeps the freeze-frame logged. Historical DTC now in memory.

### 8. T = 0:28 — Approaching Destination, Low Speed
**What the driver does**: navigating through streets.

**What the BMS does**:
- Low current, stop-start driving. Frequent regen pulses.
- SOC now at 61%.
- BMS recalculates range estimate based on recent energy consumption rate and current SOC. Publishes updated value.
- Cell voltage spread: after 28 minutes of driving, one cell is 8mV lower than the others — within acceptable limits, but logged. Balancing will address this during the next charge.

### 9. T = 0:30 — Parking
**What the driver does**: stops, switches off.

**What the BMS does**:
- Ignition signal goes low.
- BMS executes shutdown sequence: ramp down → open main positive contactor → open main negative contactor → HV bus dead.
- Final SOC logged to non-volatile memory: 61%. This will be the initialization value if the car is started immediately.
- BMS transitions to standby: most functions suspend. Only low-power cell monitoring remains active (scans cell voltages every 30 seconds to catch deep discharge from self-discharge during storage).
- BMS current draw: drops from ~500mA to ~2mA from the 12V aux battery.
- If voltage scan detects any cell below 3.3V during standby, BMS will trigger a wake-up alert via telematics.

### 10. What If We Plugged In Now?
- Brief preview of the charge session: BMS wakes fully, confirms charge enable, negotiates charge current with EVSE, applies balancing during CV phase, monitors every cell through the full cycle.
- Link to Charging Algorithm post.

### 11. Takeaways (for all audiences)
- The 2-second startup delay is the BMS running its safety sequence — not a software bug.
- The power reduction when cold is the BMS doing its job — protecting the cells from lithium plating.
- The range estimate changes after parking because the BMS gets a more accurate SOC fix from the rested OCV.
- Every dashboard warning has a specific trigger, a debounce, a severity level, and a response behind it.
- The BMS is never "just watching" — it is actively computing, communicating, and making decisions every 10–100ms.

---

## No Traditional Experiment (Narrative Post)

This is a narrative-first post and does not have build-it experiments. Instead:

**Interactive suggestion**: Log a real BMS CAN bus during a drive using an OBD-II adapter (if vehicle and adapter permit). Plot SOC, pack current, cell temperatures, and max discharge current against time. Annotate the plot with the events described in this post — acceleration, regen, thermal events. This turns the narrative into a real data analysis exercise.

Link to: CAN bus post (for how to log), Communication Interface post (for what messages to look for).

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 2* — the algorithms described in this post (SOC estimation, EKF correction, SOP calculation) are derived rigorously here
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* — state machine and operational sequence discussion

### Online Resources
- Orion BMS User Manual — Section on BMS operation during drive cycle; very practical description of real BMS behaviour
- CSS Electronics — "CAN Bus Data Logger" tutorial — how to capture and visualise the data described in this post
- Recurrent Auto — published EV battery data blog — real SOC, range, and temperature data from fleet vehicles

### Related Posts in This Series
Every section of this post links to a dedicated technical post:
- Startup → Ignition Handling, HV Safety Architecture
- SOC initialization → OCV vs Terminal Voltage, SOC
- SOP derating → SOP
- Thermal event → Thermal Runaway Detection, Cooling
- Fault logging → Error Handling / Fault Reporting
- CAN messages → CAN bus, EV Nodes
- Charging preview → Charging Algorithm, Cell Balancing
