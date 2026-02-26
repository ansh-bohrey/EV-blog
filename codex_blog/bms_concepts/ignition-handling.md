# Ignition Handling — Pre-Charge, Contactors, and Safe Startup

*Prerequisites: [Battery Pack Architecture →](../battery/battery.md)*

---

## It’s Not Like Turning on a Lightbulb

In an EV, "ignition" is a controlled sequence: wake the BMS, run checks, pre-charge the HV bus, and only then close the main contactors. The short delay you feel is deliberate—get the sequence wrong and you weld contactors or blow capacitors.

---

## BMS Power States (High-Level)

- **Sleep**: ultra-low power, waiting for ignition/CAN wake
- **Standby**: measurements and checks, HV isolated
- **Pre-charge**: resistor limits inrush to inverter capacitors
- **Run**: contactors closed, HV bus active
- **Charge**: charging-specific limits and contactor states
- **Fault**: contactors open, HV isolated

---

## Why Pre-Charge Exists

Inverter DC-link capacitors look like a short circuit when uncharged. Closing a contactor directly onto them causes a huge inrush spike.

Pre-charge uses a resistor and contactor to charge the capacitors gradually:

```
V(t) = V_batt x (1 - e^(-t/RC))
```

Once the bus voltage is within ~5% of pack voltage, the main contactor closes and the pre-charge path opens.

---

## Typical Contactor Sequence

**Startup:**
1. Close negative contactor
2. Close pre-charge contactor (through resistor)
3. Wait until HV bus rises
4. Close positive contactor
5. Open pre-charge contactor

**Shutdown:**
1. Reduce load
2. Open main contactors
3. Allow capacitor discharge

Sequence matters because opening or closing under load damages contacts.

---

## HVIL (High Voltage Interlock Loop)

HVIL is a low-voltage loop through all HV connectors. If any connector opens, HVIL breaks and the BMS opens contactors immediately. It’s the simplest and most important service safety mechanism.

---

## Sleep and Wake

The BMS must draw almost no current when parked to avoid draining the 12 V battery. Wake can be triggered by ignition, CAN, or charge plug-in.

---

## Takeaways

- Ignition is a state machine, not a single switch.
- Pre-charge protects contactors and capacitors.
- HVIL is critical for service safety.

---

## Experiments

### Experiment 1: Pre-Charge RC Curve
**Materials**: 9–12 V source, resistor, capacitor, Arduino.

**Procedure**:
1. Log capacitor voltage vs time.
2. Compare to RC time constant.

### Experiment 2: Contactor Sequencing Demo
**Materials**: Arduino + relays + LEDs.

**Procedure**:
1. Implement startup sequence.
2. Add HVIL input that forces immediate open.

### Experiment 3: Sleep/Wake Latency
**Materials**: Arduino sleep library.

**Procedure**:
1. Sleep MCU.
2. Trigger wake pin and measure latency.

---

## Literature Review

### Core References
- Andrea — *Battery Management Systems for Large Li-ion Packs*
- Ehsani — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles*

### Standards / Notes
- ISO 6469-3, FMVSS 305, SAE J1772
