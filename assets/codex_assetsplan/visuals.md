# Visual Opportunities by Topic

## Progress Summary

| # | Topic | Planned | Created |
| --- | --- | --- | --- |
| 1 | Series Overview | 4 | 4 |
| 2 | ECM Primer | 5 | 5 |
| 3 | Cell | 7 | 6 |
| 4 | Battery / Pack | 9 | 9 |
| 5 | Cooling / Thermal | 9 | 9 |
| 6 | SOC | 5 | 5 |
| 7 | SOH | 6 | 5 |
| 8 | SOP | 5 | 5 |
| 9 | OCV vs Terminal Voltage | 5 | 5 |
| 10 | Cell Balancing | 6 | 6 |
| 11 | AFE | 6 | 6 |
| 12 | Charging Algorithm | 5 | 5 |
| 13 | Ignition Handling | 5 | 5 |
| 14 | HV Safety Architecture | 6 | 6 |
| 15 | Deep Discharge Protection | 4 | 4 |
| 16 | Thermal Runaway | 5 | 5 |
| 17 | Error Handling / Fault Reporting | 5 | 5 |
| 18 | BMS During a Drive | 4 | 4 |
| 19 | BMS Validation | 5 | 5 |
| 20 | Battery Paralleling | 5 | 5 |
| 21 | Communication Interface | 4 | 4 |
| 22 | CAN | 6 | 6 |
| 23 | RS-485 / RS-232 | 5 | 5 |
| 24 | EV Nodes | 5 | 5 |
| 25 | Why Range Drops in Winter | 6 | 6 |
| 26 | Standards (if expanded) | 3 | 3 |

Legend: `diagram` = original SVG/Illustrator/mermaid, `chart` = plot or table, `animation` = simple JS/SVG/Canvas, `photo` = teardown/real hardware, `sourced` = from datasheet/paper/publication.

## Series Overview (`topics/intro/series-overview.md`)
- Series roadmap as a dependency flowchart. `diagram`
- Three reading paths as a simple lane chart (Path A/B/C). `diagram`
- “What you need to know” as a skills checklist graphic. `diagram`
- Post structure template as a one-page visual card. `diagram`

## ECM Primer (`topics/intro/equivalent-circuit-model.md`)
- Stepwise ECM build: Level 0→1→2→3 circuit diagrams. `diagram`
- Current step response with voltage waveform (instant drop + RC recovery). `chart`
- Animation of current step and terminal voltage recovery. `animation`
- Parameter extraction flow (HPPC → R0, R1/C1, R2/C2). `diagram`
- ECM state-space block diagram (inputs/outputs/states). `diagram`

## Cell (`topics/battery/cell.md`)
- Li-ion cell cross-section with anode/cathode/separator. `diagram`
- Li-ion shuttle animation (charge vs discharge). `animation`
- Chemistry comparison table visual (already in plan, styled). `chart`
- Cell formats comparison (cylindrical/prismatic/pouch/blade). `diagram`
- Datasheet excerpt plots: discharge curves, capacity vs C-rate. `chart` `sourced`
- Formation cycling timeline. `diagram`
- Aging mechanisms cross-section (SEI, plating, cracking). `diagram`

## Battery / Pack (`topics/battery/battery.md`)
- Series vs parallel vs xSyP schematic. `diagram`
- 400V vs 800V tradeoff chart (current vs power). `chart`
- Cell→Module→Pack hierarchy diagram. `diagram`
- Pack components exploded view (contactors, MSD, IMD, cooling). `diagram`
- CTP vs module design comparison. `diagram`
- Busbar sizing/heat path illustration. `diagram`
- Pack parameter example (voltage/capacity/energy table). `chart`
- Repairability vs efficiency tradeoff chart. `chart`
- Isolation monitoring concept visual. `diagram`

## Cooling / Thermal (`topics/battery/cooling.md`)
- Temperature “Goldilocks” band chart. `chart`
- Heat generation split: I²R vs entropic heat. `chart`
- Thermal resistance network (cell→TIM→plate→coolant). `diagram`
- Cooling architectures: passive/air/liquid/immersion. `diagram`
- Cooling plate channel layouts (serpentine vs parallel). `diagram`
- Heat pump loop schematic. `diagram`
- Real-world pack comparison table (already listed). `chart`
- Temperature gradient heatmap across cells. `chart`
- Animation: coolant flow and temperature drop along plate. `animation`

## SOC (`topics/bms_concepts/state-of-charge-soc.md`)
- OCV-SOC curves (NMC vs LFP). `chart`
- Coulomb counting drift over cycles. `chart`
- EKF block diagram (model + sensor fusion). `diagram`
- Temperature shift effect on OCV-SOC curve. `chart`
- SOC error vs voltage error (LFP vs NMC). `chart`

## SOH (`topics/bms_concepts/state-of-health-soh.md`)
- Capacity fade vs cycle count. `chart`
- Resistance growth vs cycle count. `chart`
- Aging mechanisms inside a cell cross-section. `diagram`
- Stress factor table (already in plan, styled). `chart`
- ICA dQ/dV plot example. `chart` `sourced`
- EIS Nyquist plot with labeled regions. `chart` `sourced`

## SOP (`topics/bms_concepts/state-of-power-sop.md`)
- SOP envelope vs SOC and temperature. `chart`
- R_internal vs temperature curve. `chart`
- HPPC pulse profile diagram. `diagram`
- Derating curve (power vs temperature, SOC). `chart`
- Regen acceptance vs SOC/temperature. `chart`

## OCV vs Terminal Voltage (`topics/bms_concepts/open-circuit-voltage-ocv-vs-terminal-voltage-logic.md`)
- OCV vs terminal voltage under load (V-I plot). `chart`
- Voltage relaxation curve after load removal. `chart`
- ECM diagram with labeled R0/RC. `diagram`
- LFP hysteresis charge vs discharge curves. `chart`
- “Rest time vs SOC accuracy” curve. `chart`

## Cell Balancing (`topics/bms_concepts/cell-balancing.md`)
- Series string with one weak cell limiting pack. `diagram`
- Passive balancing circuit schematic. `diagram`
- Active balancing topology comparison (cap shuttle / inductor / transformer). `diagram`
- Balancing timeline (cell voltages converging). `chart`
- Top vs bottom balancing concept graphic. `diagram`
- Energy lost as heat vs active transfer efficiency. `chart`

## AFE (`topics/bms_concepts/analog-front-end-afe.md`)
- AFE placement in pack architecture. `diagram`
- Differential cell measurement concept (floating nodes). `diagram`
- Delta-sigma ADC block diagram. `diagram`
- SPI transaction timing diagram. `diagram`
- Daisy-chain isoSPI schematic. `diagram`
- Register map “zoom-in” visual (address→data). `diagram`

## Charging Algorithm (`topics/bms_concepts/charging-algorithm.md`)
- CC-CV current/voltage vs time graph. `chart`
- Charge power vs SOC (the “80% slow-down” curve). `chart`
- Temperature derating curve. `chart`
- Charging protocol comparison (CC-CV vs multi-stage vs pulse). `chart`
- Charger↔BMS communication flow (J1772/CHAdeMO/CCS). `diagram`

## Ignition Handling (`topics/bms_concepts/ignition-handling.md`)
- BMS state machine (sleep→pre-charge→run→fault). `diagram`
- Pre-charge RC curve and equation. `chart`
- Contactor sequencing timeline. `diagram`
- HVIL loop schematic. `diagram`
- Sleep vs wake current budget bar. `chart`

## HV Safety Architecture (`topics/bms_concepts/hv-safety-architecture.md`)
- “Defense in depth” layered safety stack. `diagram`
- Contactor weld detection logic diagram. `diagram`
- Isolation monitoring principle (HV to chassis). `diagram`
- MSD split schematic. `diagram`
- Pyro-fuse cutaway illustration. `diagram`
- Fault scenario timeline (leak → IMD → contactor open). `diagram`

## Deep Discharge Protection (`topics/bms_concepts/deep-discharge-protection.md`)
- Voltage vs time into deep discharge. `chart`
- Copper dissolution & dendrite formation cross-section. `diagram`
- Recovery charge profile (low-current pre-charge). `chart`
- Chemistry comparison table (already listed). `chart`

## Thermal Runaway (`topics/bms_concepts/thermal-runaway-detection-handling.md`)
- Temperature vs time runaway curve with stages. `chart`
- Reaction cascade timeline (SEI→separator→cathode). `diagram`
- ARC “heat-wait-seek” curve. `chart` `sourced`
- Sensor placement on module (temp, gas, pressure). `diagram`
- Propagation barriers between cells. `diagram`

## Error Handling / Fault Reporting (`topics/bms_concepts/error-handling-fault-reporting.md`)
- Fault taxonomy tree. `diagram`
- Threshold + debounce timing diagram. `diagram`
- Severity ladder (warning→fault→critical). `diagram`
- DTC table example (code/level/clear). `chart`
- CAN fault bitmask visualization (byte to flags). `diagram`

## BMS During a Drive (`topics/bms_concepts/bms-during-a-drive.md`)
- 30-minute timeline with events and BMS actions. `diagram`
- SOC/current/temperature plots aligned to timeline. `chart`
- CAN message rate “density” visualization. `chart`
- Decision flow: BMS→VCU→MCU loop. `diagram`

## BMS Validation (`topics/bms_concepts/bms-validation.md`)
- V-model diagram. `diagram`
- MiL/SiL/HIL architecture blocks. `diagram`
- DFMEA→test-case mapping matrix. `chart`
- Validation pipeline timeline (step 0→5). `diagram`
- Pass/fail regression dashboard mock. `diagram`

## Battery Paralleling (`topics/bms_concepts/battery-paralleling.md`)
- Two-pack parallel connection schematic. `diagram`
- Inrush current waveform with/without pre-charge. `chart`
- Pre-charge sequence timeline. `diagram`
- Current sharing vs internal resistance curve. `chart`
- Voltage match tolerance band graphic. `diagram`

## Communication Interface (`topics/interfaces/communication-interface.md`)
- Layered comms block diagram (AFE→MCU→CAN→UDS/charger). `diagram`
- CAN frame anatomy with labeled fields. `diagram`
- Example DBC signal decoding (hex→value). `diagram`
- UDS service flow (request/response). `diagram`

## CAN (`topics/interfaces/can.md`)
- Differential signaling waveforms (CAN_H/L). `diagram`
- Bus topology with termination. `diagram`
- Arbitration animation (two IDs, one wins). `animation`
- Bit stuffing illustration. `diagram`
- Error frame and bus-off state diagram. `diagram`
- CAN FD frame size comparison. `chart`

## RS-485 / RS-232 (`topics/interfaces/rs-485-232.md`)
- UART frame (start/data/parity/stop). `diagram`
- RS-232 voltage levels vs RS-485 differential. `diagram`
- RS-485 bus termination/biasing schematic. `diagram`
- Modbus RTU frame layout. `diagram`
- RS-232 vs RS-485 vs CAN comparison table (already listed). `chart`

## EV Nodes (`topics/ev/ev-nodes.md`)
- ECU architecture map (VCU/BMS/MCU/OBC/DCDC/TMC). `diagram`
- Multi-bus network topology (powertrain/body/chassis). `diagram`
- Startup sequence timeline. `diagram`
- Data flow diagram (BMS↔VCU↔MCU↔cluster). `diagram`
- Zonal vs distributed architecture comparison. `diagram`

## Why Range Drops in Winter (`topics/ev/why-range-drops-in-winter.md`)
- Energy budget stacked bar (summer vs winter). `chart`
- DCIR vs temperature curve. `chart`
- Usable capacity vs temperature curve. `chart`
- Heating load vs range loss graph. `chart`
- Preconditioning effect (before/after curves). `chart`
- Real-world data comparison table. `chart` `sourced`

## Standards (`topics/standards/*.md`)
- These are status-only right now. If expanded later, the obvious visuals are:
- Compliance workflow (tests → approval). `diagram`
- Requirement summary table. `chart`
- Test timeline. `diagram`
