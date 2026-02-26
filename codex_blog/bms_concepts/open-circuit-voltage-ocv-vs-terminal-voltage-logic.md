# OCV vs Terminal Voltage: Why Voltage Alone Misleads Under Load

Open-circuit voltage (OCV) and terminal voltage are not the same during dynamic operation.

![Voltage under load vs rest](../../assets/codex_assetsplan/ocv-vs-terminal-voltage/voltage-under-load.svg)

## OCV vs Measured Terminal Voltage

- OCV represents equilibrium after rest
- Terminal voltage includes load-induced drops/rises and transient polarization

![ECM diagram for terminal behavior](../../assets/codex_assetsplan/ocv-vs-terminal-voltage/ecm-diagram.svg)

## Relaxation and Rest Time

After load removal, voltage relaxes toward OCV over time. Short rest gives biased SOC inference.

![Voltage relaxation curve](../../assets/codex_assetsplan/ocv-vs-terminal-voltage/relaxation-curve.svg)
![Rest time vs SOC accuracy](../../assets/codex_assetsplan/ocv-vs-terminal-voltage/rest-time-vs-accuracy.svg)

## Chemistry Nuance: LFP Hysteresis

For LFP, charge/discharge path history affects OCV relationship.

![LFP hysteresis curves](../../assets/codex_assetsplan/ocv-vs-terminal-voltage/lfp-hysteresis-curves.svg)

## Takeaways

- Terminal voltage is context-dependent.
- Reliable SOC uses model + current integration + temperature compensation.
- Rest-based OCV correction is useful, but only with proper settling context.
