# Ania Mitros BMS Course — PDF Topic Index

Source folder: `Literature/Ania mitros BMS course/`

## Mitros-BMS-Intro.pdf
- Introduction to BMS scope and course roadmap
- Rechargeable battery cell chemistries
- Energy density and OCV vs SOC curves
- Safety in lithium-ion battery design (mechanical and chemistry)
- Cell behavior basics: lifetime and charging (electrical and thermal)
- System architecture (electrical)
- Battery cost overview (finance)
- State estimation overview (algorithms)

## Mitros-BMS-functions.pdf
- Core BMS actions: battery switch open/close, system communication, cell balancing
- State estimation: SOC, SOH, available power estimation
- Fault detection: over/under-voltage, over-current, over-temperature, BMS fault, isolation detection
- Measurements: cell voltages, battery current, cell and board/chip temperatures, diagnostics
- Essential vs discretionary BMS functions

## Mitros-BMS-cell-behaviors.pdf
- Terminology for cell state and capacity
- OCV (open-circuit voltage) and SOC relationship
- Cell impedance and I×R voltage drop
- Time-dependent responses and hysteresis
- Aging effects
- Cell construction overview (pouch, prismatic, cylindrical)

## Mitros-BMS-Accuracy.pdf
- Systems engineering trade-offs and quantifying design variables in dollars
- Cell voltage measurement accuracy ($/mV)
- Methods for valuing accuracy (first-order vs improved analysis)
- BMS chip datasheet accuracy considerations
- Battery current measurement accuracy ($/A)

## Mitros-BMS-Algorithms.pdf
- Overview: SOC, SOH, and power estimation
- SOC estimation by current integration (coulomb counting)
- SOC estimation from OCV lookup and cell models
- Combining methods, including Kalman filter approaches
- Limitations when current is flowing and error accumulation

## Mitros-BMS-Algorithms (1).pdf
- Duplicate of `Mitros-BMS-Algorithms.pdf`

## Mitros-BMS-Balancing.pdf
- Introduction to cell balancing and balancing current sizing
- Passive vs active balancing
- Thermal considerations (PCB and BMS chip)
- When to balance (relative to voltage measurement and SOC)
- Drivers of imbalance: self-discharge, unequal load, faults/defects

## Mitros-BMS-Temperature.pdf
- Why measure temperature and what it enables (controls and safety)
- Sensor placement strategies
- Thermistor vs thermocouple trade-offs
- Thermistor circuits and equations
- Measurement limitations and error sources

## Mitros-BMS-Isolation-Detection.pdf
- Isolation in high-voltage systems and safety rationale
- Isolation requirements and system trade-offs
- Isolation detection ideas (multiple circuit approaches)
- Diagnostics: perturbing the system to a known state
- Impact of capacitance on isolation detection timing

## Mitros-BMS-Safety.pdf
- Battery safety for automotive and stationary systems
- Standards, terms, and key safety considerations
- Fault tolerance concepts and fault types
- Analysis tools: FTA and DFMEA
- Safety diagnostics and hardware-only protections

## Mitros-BMS-Reliability.pdf
- Reliability and accelerated lifetime testing
- Arrhenius equation and acceleration factor derivation
- AEC-Q100 reference context
- Caveats: mission profile and assumptions
- Design/test process and reliability test flow
- Over-design vs under-design trade-offs
