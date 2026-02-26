# BMS During a Drive — 30 Minutes, Hundreds of Decisions

*Prerequisites: [OCV vs Terminal Voltage](./ocv-vs-terminal-voltage.md) · [SOC](./state-of-charge-soc.md) · [SOP](./state-of-power-sop.md) · [Ignition Handling](./ignition-handling.md) · [Error Handling](./error-handling-fault-reporting.md)*
*Next: [Cell Balancing](./cell-balancing.md) · [Charging Algorithm](./charging-algorithm.md)*

---

## 30 Minutes, Hundreds of Decisions

In the next 30 minutes, the BMS will read cell voltages approximately 18,000 times, update the SOC estimate more than 3,600 times, and send roughly 18,000 CAN messages to other nodes on the vehicle network (illustrative counts for a 10 ms scan / 100 ms SOC and CAN cycle implementation; actual rates are design-specific). It will make protection decisions, recalculate power limits, respond to a thermal anomaly, log fault data to non-volatile memory, and execute a controlled shutdown — all without the driver noticing most of it.

This post follows one commute, start to finish: a cold winter morning, 30 minutes, a minor thermal event, no catastrophes. No equations. Just the BMS doing its job, and the reasoning behind each step.

The hardware kit: a 96-cell NMC pack at 400 V nominal, 60 kWh usable, in a mid-size EV. Outside temperature: 5°C.

---

## T = 0:00 — Key On

The driver presses the start button.

### What the Driver Sees
Nothing, for about two seconds. Then the instrument cluster lights up and shows "Ready."

### What the BMS Is Doing

The ignition signal — a 12 V discrete line from the body control module — arrives at the BMS microcontroller's wake pin. The BMS has been in deep sleep for the past eight hours, drawing a small standby current from the 12 V aux battery (typically 1–5 mA; implementation-dependent). The wake pin triggers an interrupt, the CPU core starts executing from reset.

**Initialization**: the BMS loads calibration data from non-volatile flash memory — the OCV-SOC lookup table for this specific cell chemistry, the internal resistance model parameters, fault threshold tables, the saved SOC from the last shutdown.

**AFE startup**: the analog front-end chip (BQ76940 or similar) initializes its cell-voltage measurement channels. The first voltage scan completes within 50–100 ms. All 96 cell voltages are now available.

**Self-check**: the BMS runs through its startup verification list:
- Are all cell voltages within power-on limits? (Not below 3.0 V, not above 4.2 V)
- Are all temperatures within operating range? (Not below −20°C, not above 60°C for power-on)
- Is the High Voltage Interlock Loop continuous? (Service plugs seated, all connectors latched)
- Is the isolation resistance above the minimum threshold?

**SOC initialization**: the car has been parked for eight hours. That is more than enough time for cell voltages to settle to their open-circuit voltage — the transient RC pair voltages have decayed to zero, concentration gradients have equalized. The BMS reads all 96 OCVs, looks each one up on the OCV-SOC curve (the table it loaded from flash), and averages the results. This is the most accurate SOC reading the BMS will achieve all day. When you are driving, the terminal voltage is depressed by IR drop and the SOC must be inferred from Coulomb counting; when you have been parked for hours, the cells simply tell you.

SOC initialized: 81%. The BMS stores this in RAM and begins Coulomb counting from here.

**Pre-charge sequence**: the main negative contactor closes. The pre-charge contactor closes. The inverter's large DC bus capacitors — which were completely discharged — begin charging through the pre-charge resistor (typically 15–30 Ω in this example; actual value depends on DC bus capacitance and maximum inrush current spec). The BMS watches the HV bus voltage sensor: it rises from 0 V toward pack voltage (about 395 V for an 81% SOC pack). When the bus voltage reaches within 5% of pack voltage — about 375 V — the pre-charge is complete. The main positive contactor closes, the pre-charge contactor opens, and the HV bus is live.

The whole pre-charge takes 200–500 ms depending on the resistor value and the capacitor bank size.

**CAN announcements**: the BMS publishes its first "running" messages:
- SOC: 81%
- Pack voltage: 395 V
- Max discharge current: 180 A (OEM-defined example; reduced at 5°C due to elevated cell resistance)
- Max charge current: 80 A (OEM-defined example)
- Charge enable: true
- Fault status: 0x00 (no faults)

*Current limits and voltage values above are illustrative example outputs for this scenario; actual BMS message content is OEM-defined.*

The VCU reads these, confirms the BMS is ready, sends a "ready" flag to the instrument cluster. The cluster's "Ready" indicator illuminates.

**Duration**: 1.8 seconds from button press to "Ready" on the cluster. This is intentional. Skipping the self-check would be faster; it would also mean connecting 400 V to the inverter without knowing if every cell is healthy. The 1.8 seconds is the cost of safety.

---

## T = 0:02 — Pulling Out of the Driveway

The driver selects drive, lifts off the brake. Light accelerator pressure.

### What the BMS Is Doing

Current begins flowing. The pack current sensor — a precision shunt at the negative terminal — reads 45 A discharge.

**Cell voltage response**: each cell's terminal voltage drops by I × R_total. At 5°C, R₀ is approximately 4–5 mΩ per cell (roughly 2× its 25°C value). At 45 A, the terminal voltage of each cell drops about 0.2 V below its OCV. The BMS measures this and knows it is IR drop — not an actual SOC change. The SOC model does not confuse voltage sag with capacity loss.

**Coulomb counting begins**: SOC = SOC_init − (∫I dt) / Q_nominal. Every Coulomb of charge that flows out of the pack decrements the SOC estimate. At 45 A, the pack loses 45 Ah per hour of continuous discharge — at 60 kWh usable and a 150 Ah nominal pack, that is 0.5% SOC per minute at this current.

**Temperature note**: 5°C is cold enough to matter. The BMS has already flagged to itself that R₀ is elevated, which reduces the safe current ceiling. The published max discharge current of 180 A reflects this — down from roughly 350 A at 25°C.

**Balancing**: passive cell balancing does not run during discharge. It only activates during charging (specifically during the constant-voltage phase when the pack is nearly full and there is time to bleed down the higher-voltage cells). During discharge, the BMS monitors cell voltage spread but takes no action yet.

---

## T = 0:05 — Highway On-Ramp, Full Throttle

The driver needs to merge. Full accelerator pedal. The VCU sends a maximum torque request to the motor controller.

### What the BMS Is Doing

Current spikes: the pack current sensor reads 220 A. 220 A × 395 V = 87 kW. The car accelerates hard.

**Voltage check**: terminal voltage of each cell drops sharply. With R₀ at 5 mΩ and current at 220 A, each cell's terminal voltage is OCV − (220 × 0.005) = OCV − 1.1 V. If the weakest cell had OCV at 3.8 V (consistent with 81% SOC), its terminal voltage is now 2.7 V — approaching the 2.8 V cutoff.

The BMS catches this immediately. It does not wait for the next 100 ms reporting cycle — cell voltage checks happen every millisecond. If any cell hits V_min, the BMS reduces the max discharge current published on CAN within one control cycle. The VCU receives the updated limit, scales the torque request down, the motor controller reduces current. The driver may feel a momentary hesitation — a brief power curtailment — before the current settles to a safe level.

In this case, the weakest cell holds above 2.8 V. The merge completes without intervention.

**Temperature update**: after three minutes of moderate driving followed by a hard acceleration event, cell temperatures have risen from 5°C to about 9°C. R₀ has dropped slightly. The BMS recalculates SOP: max discharge current is now 195 A, relaxed slightly from the 180 A at startup.

---

## T = 0:10 — Steady Highway Cruise at 110 km/h

Cruise control engaged. The road is flat. Current is steady.

### What the BMS Is Doing

This is the BMS at its most comfortable. Nothing is at a limit, nothing is changing rapidly. But the BMS is not idle.

**Steady-state monitoring**: pack current holds at 65 A (25 kW). SOC is counting down at a predictable rate. Cell temperatures are now 18°C — well into the comfortable operating range. The coolant pump runs at low speed.

**Cell voltage surveillance**: every 10 ms, the AFE scans all 96 cell voltages. The BMS compares each cell to the others. Today's spread: the highest cell is at 3.71 V, the lowest at 3.68 V — a 30 mV spread. This is normal. If any cell dips 80 mV below the pack average during a steady cruise, that is a flag for elevated internal resistance — potentially an early SOH indicator. The BMS logs it with a timestamp; it will not trigger a fault today, but it becomes part of the vehicle's battery health history.

**SOC refinement**: Coulomb counting has been running for 10 minutes. The accumulated Ah are precise — the INA219-class shunt sensor the BMS uses measures current to ±0.1% accuracy. The SOC estimate is drifting from 81% toward 74%. At this rate, the car has roughly 220 km of remaining range at this cruise power.

**CAN traffic**: the BMS sends its standard 100 ms frame with SOC, pack voltage, current, temperatures, and power limits. The VCU is reading it. The instrument cluster is displaying 74% SOC and a range estimate. The OBC is listening but inactive (not plugged in). The thermal management controller is reading battery temperature and keeping the pump at minimum speed.

**Isolation monitoring**: running continuously in the background. The BMS periodically applies a small test signal to the HV bus and measures the leakage to chassis ground. The result: 850 kΩ isolation resistance — well above the 100 kΩ fault threshold. Normal.

---

## T = 0:18 — Traffic Ahead, Regenerative Braking

The driver sees brake lights on the highway. Lifts the throttle. The car begins to slow via regen.

### What the BMS Is Doing

Current reverses: the pack current sensor now reads −40 A. The negative sign means charging. The traction motor is acting as a generator, converting the car's kinetic energy to electrical energy and pushing it back into the pack.

**Charge acceptance check**: the BMS checks whether the pack can accept this charge current. SOC is at 73%. The max charge current published earlier was 80 A; the regen is only 40 A. No limit needed. The driver gets full regen deceleration.

**Cell voltage response**: terminal voltage rises under charging current. Each cell: OCV + (40 × 0.005) = OCV + 0.2 V. At 73% SOC, OCV is approximately 3.75 V; terminal voltage rises to 3.95 V. Well below the 4.2 V max. Safe.

**SOC climbs**: SOC increments as charge flows back in. It rises from 73% to about 74% during this braking event — not much, but real.

**Range estimate update**: the energy recovered from regen improves the efficiency figure for the trip. The BMS does not calculate this directly — it just maintains an accurate SOC. The VCU or instrument cluster integrates energy-per-km over the recent drive history to compute the range estimate.

---

## T = 0:22 — Thermal Anomaly: Cell Group 7

Something unexpected.

### What the BMS Is Doing

The AFE scans temperature sensors every 200 ms. Twelve thermistors, distributed across the pack, each measuring a group of 8 cells.

Temperature scan result:
- Groups 1–6: 22–24°C
- **Group 7: 38°C**
- Groups 8–12: 22–24°C

This is a 14°C jump relative to adjacent groups. The BMS has an algorithm for this. A sensor fault (open circuit, short to ground, or intermittent connection) produces a reading that is typically at an extreme — near −40°C or near 150°C — not a plausible but anomalous mid-range value. A 38°C reading is physically plausible. That makes it more likely to be a real thermal event than a sensor fault.

**Cross-check**: adjacent groups 6 and 8 are at 23°C. The temperature gradient — jumping 15°C over a group boundary — is larger than any normal thermal gradient in a well-designed pack with active cooling.

**Debounce**: the BMS does not act on a single anomalous reading. False positives from sensor noise or EMI transients are common. The BMS applies a debounce filter: the condition must persist for N consecutive scans (typically 3–5 scans, equivalent to 600 ms–1 second at 200 ms scan rate). After 3 scans, the anomaly is confirmed as persistent. The BMS escalates.

**Response — Level 1 Warning**:
- Max discharge current reduced by 20%: from 210 A (now that the pack is warm) to 168 A
- CAN command to thermal management controller: increase coolant pump to maximum speed
- Fault flag bit 4 set in the BMS status byte: "thermal warning — cell group over-temperature"
- Event logged to EEPROM with freeze-frame: all 96 cell voltages, all 12 temperatures, pack current, SOC at the moment of detection

**CAN propagation**:
- VCU reads updated fault status and reduced current limit. Scales torque request down.
- Gateway routes the fault flag to the instrument cluster.
- Instrument cluster illuminates an amber thermal warning icon. Plays a soft chime.

**What the driver experiences**: a slight reduction in acceleration response. An amber icon on the dash. The car is still fully drivable. This is a Level 1 event — warn and reduce, not shutdown.

**Resolution**: over the next 90 seconds, maximum coolant flow through group 7 begins to pull heat away. The temperature drops from 38°C to 31°C, then 27°C, then 24°C — back within the normal range. The BMS clears the active fault flag. The amber icon on the cluster extinguishes. Max discharge current returns to full.

The freeze-frame log remains in EEPROM. The next time a technician connects a diagnostic tool, the DTC (Diagnostic Trouble Code) and its freeze-frame data will be visible. The BMS remembers what happened even though the current drive completed normally.

**What caused it?** Could be a local hotspot from a higher-resistance cell in that group, a poorly seated cell tap connection creating extra resistance, or a brief coolant flow restriction in that section of the cooling loop. The freeze-frame data and the resolution pattern give the diagnostic team data to narrow it down.

---

## T = 0:28 — City Streets, Approaching Destination

Off the highway, navigating through local streets. Stop-start driving. Frequent short regen pulses at traffic lights.

### What the BMS Is Doing

Current oscillates between light discharge (10–30 A during coasting) and regen pulses (−20 to −40 A at traffic lights). The BMS updates SOC with each Coulomb, in both directions.

**Current SOC**: 64%. The pack has delivered about 10 kWh over the 28-minute drive. Energy consumption: approximately 20 kWh/100 km for this vehicle type — consistent with 110 km/h highway and some city driving.

**Range recalculation**: based on the last 10 km of energy consumption, the BMS (or the VCU using BMS data) updates the range estimate. The range estimate for a given SOC is not fixed — it adapts to recent driving style and conditions. Heavy highway driving lowers the per-km range estimate; city regen improves it.

**Cell voltage spread**: after 28 minutes of driving, the spread between highest and lowest cell voltage has grown slightly — from 30 mV at the start of cruise to 45 mV now. Still within acceptable limits (a typical fault threshold is 150 mV spread). The BMS logs the spread. When the car is next charged, cell balancing during the CV phase will bleed down the highest cells slightly to reduce this spread.

---

## T = 0:30 — Parked

The driver pulls into a space, selects Park, presses the power button. The car powers off.

### What the BMS Is Doing

The ignition signal goes low. The BMS begins its shutdown sequence — the reverse of startup, in the right order.

**HV disconnect sequence**:
1. The BMS ramps down its published max discharge current to 0 A (soft warning to other nodes that HV is about to drop)
2. Main positive contactor opens
3. Brief wait (20 ms) — verifies current has ramped to zero and no arc is sustained
4. Main negative contactor opens
5. HV bus is dead

**Final state logging**: the BMS writes to non-volatile memory:
- Final SOC: 64%
- Last cell voltage readings (all 96)
- Last temperature readings
- Odometer-equivalent accumulated Ah (for SOH tracking)
- The DTC from the thermal event at T = 0:22 (already logged during the event; now confirmed)

If the car is restarted within the next 30 minutes, the BMS will initialize SOC from the stored 64% rather than attempting an OCV measurement (the cells have not had time to settle). If the car sits for 8+ hours, the next OCV measurement will re-anchor the SOC estimate.

**Transition to standby**: the BMS microcontroller drops most of its peripherals. AFE continues running in low-power scan mode: a single voltage scan every 30 seconds, checking whether any cell is approaching a deep-discharge threshold. Power draw drops from approximately 500 mA (active mode) to 2 mA (standby mode).

The car is off. The BMS is watching.

---

## What the CAN Bus Looked Like During This Drive

Looking at the raw CAN traffic (logged via OBD-II adapter):

- **BMS → VCU**: SOC, voltage, current, power limits — every 100 ms, all 30 minutes. 18,000 frames.
- **BMS → Cluster (via gateway)**: SOC %, range estimate — every 500 ms. 3,600 frames.
- **BMS → TMC**: temperatures, cooling request — every 200 ms. 9,000 frames.
- **Thermal event at T = 0:22**: burst of messages at elevated rate as fault status changes are broadcast immediately (0 ms latency for fault flag updates)
- **MCU → VCU**: torque feedback, motor speed — every 10 ms (fastest bus on the network). 180,000 frames.

The BMS traffic is a steady rhythm of 100 ms heartbeats, punctuated by the brief burst at the thermal event. If you captured this on a logic analyzer and plotted the fault byte over time, you would see it change at exactly T = 0:22:00 and clear at approximately T = 0:23:30. The freeze-frame data tells the complete story of that 90-second event.

---

## Mapping Each Moment to Its Post

This drive touched almost every topic in the series:

| Event | Covered in Detail by |
|---|---|
| BMS wake, self-check, pre-charge | [Ignition Handling](./ignition-handling.md) |
| SOC initialization from OCV | [OCV vs Terminal Voltage](./ocv-vs-terminal-voltage.md) · [SOC](./state-of-charge-soc.md) |
| Pre-charge sequence, contactor management | [HV Safety Architecture](./hv-safety-architecture.md) |
| SOP reduction at 5°C | [SOP](./state-of-power-sop.md) · [Why Range Drops in Winter](../ev/why-range-drops-in-winter.md) |
| Coulomb counting | [SOC](./state-of-charge-soc.md) |
| Cell voltage surveillance, cell spread | [AFE](./analog-front-end-afe.md) |
| Regen braking, charge acceptance | [Charging Algorithm](./charging-algorithm.md) |
| Thermal event, debounce, freeze-frame | [Thermal Runaway Detection](./thermal-runaway-detection-handling.md) · [Error Handling](./error-handling-fault-reporting.md) |
| Cell balancing flag for next charge | [Cell Balancing](./cell-balancing.md) |
| CAN traffic to all nodes | [CAN Bus](../interfaces/can.md) · [EV Nodes](../ev/ev-nodes.md) |
| Shutdown sequence | [Ignition Handling](./ignition-handling.md) |
| Standby SOH tracking | [SOH](./state-of-health-soh.md) |

---

## The Takeaways

**The 2-second startup delay is the BMS running its safety sequence.** Every step in those two seconds — self-check, OCV measurement, pre-charge — is there for a reason. Skipping any of them would allow the possibility of connecting a damaged or imbalanced pack to the inverter at full voltage.

**The reduced power on a cold morning is the BMS protecting the cells.** Lithium plating occurs when lithium ions cannot intercalate into the graphite anode fast enough — this happens when the cell is cold and internal resistance is high. The SOP derating is not conservative engineering being overcautious. It is preventing a failure mode that permanently damages the anode, reducing SOH after every cold-weather high-power event.

**The range estimate changes after parking because the BMS is getting a better SOC reading.** While driving, terminal voltage is depressed by IR drop and the SOC estimate depends on Coulomb counting. After parking and resting, the OCV settles to a more accurate voltage, and the SOC estimate updates. A higher SOC after parking is not the battery "recovering" — it is the measurement becoming more accurate.

**Every dashboard warning has a specific trigger, debounce timer, severity level, and response.** The amber thermal icon at T = 0:22 was not a random event. It required 600 ms of sustained anomaly, two adjacent sensors reading normal, a temperature above a defined threshold, and an escalation protocol that reduced power but kept the car drivable. A different temperature value or different duration would have produced a different response.

**The BMS is never "just watching."** In this 30-minute drive, the BMS executed its monitoring loop approximately 18,000 times, updated SOC 3,600+ times, communicated with 6 other vehicle nodes, detected and responded to a thermal event, and completed a safe shutdown. None of it required driver intervention. All of it was necessary.

---

## Logging Your Own Drive

You can observe BMS CAN traffic using an OBD-II to USB CAN adapter (CANtact, OBDLink SX, or similar) and SavvyCAN or python-can. Many EVs expose BMS frames on the OBD-II port through the gateway — at minimum, SOC, pack voltage, and current are usually accessible.

Log a commute. Plot SOC and current against time. Annotate the plot with the events in this post — acceleration, regen, any thermal events. The shape of the current trace tells the story of the drive; the SOC trace shows what the BMS concluded from it. Cross-reference with the [CAN bus post](../interfaces/can.md) for how to decode the raw frames, and the [EV Nodes post](../ev/ev-nodes.md) for understanding which ECU is sending what.

---

## Further Reading

**For the algorithms behind this narrative**
- Plett, G.L. — *Battery Management Systems, Vol. 2* — SOC estimation, SOH tracking, SOP calculation in rigorous mathematical form
- Andrea, D. — *Battery Management Systems for Large Lithium-Ion Battery Packs* — operational state machine and drive-cycle BMS behavior

**For real-world data**
- Orion BMS User Manual — Section on normal operation; describes exactly this kind of drive-cycle behavior from a production BMS perspective
- CSS Electronics — "CAN Bus Data Logger" guide — how to capture and visualize the CAN data described in this post
- Recurrent Auto — published fleet battery data — real SOC, temperature, and range data from thousands of EVs in real conditions
