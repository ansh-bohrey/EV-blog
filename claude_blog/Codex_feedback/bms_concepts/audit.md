# Audit Feedback — Claude Blog / BMS Concepts

## Summary
The BMS concepts series is ambitious and generally strong. The structure is clear, the intuition is good, and the real‑world framing works. However, accuracy is uneven: several numerical claims are presented as precise but lack citations, and there are a few concrete factual errors in the AFE post. Tightening those will materially improve credibility.

## File-Specific Feedback

### claude_blog/bms_concepts/analog-front-end-afe.md
- Excellent overview and hierarchy; the “why it matters” framing is strong.
- **Concrete accuracy errors**: the BQ76920/30/40 interface and the example SPI transaction are incorrect (see corrections).
- Many performance numbers (accuracy, scan time, drift, balancing currents) need citations or “typical example” labels.

### claude_blog/bms_concepts/ocv-vs-terminal-voltage.md
- Very strong conceptual explanation and ECM linkage.
- Several numeric statements (rest time, hysteresis magnitudes, SOC error per mV) need evidence or should be labeled as illustrative.

### claude_blog/bms_concepts/thermal-runaway-detection-handling.md
- Clear and thorough; good cascade explanation.
- Temperature ranges and chemistry‑specific onset values should be cited and expressed as ranges rather than point numbers.

### claude_blog/bms_concepts/bms-during-a-drive.md and others
- The narrative approach works well.
- Many specific numbers (scan rates, currents, resistor values, timing) need sources or “example only” labels.

## Persona Evaluations

### A) A‑ Engineering Student
- Flow: High; the posts are logically sequenced.
- Ease of understanding: High; diagrams and examples help.
- Depth: Good; could add brief “assumptions + sources” callouts.
- Accuracy: Several unsourced quantitative claims; AFE interface error needs correction.
- What I learned: How AFE hardware, ECMs, and safety logic connect into a coherent system.

### B) EV Enthusiast
- Flow: Engaging and easy to follow.
- Ease of understanding: High.
- Depth: Just right for curiosity without overload.
- Accuracy: A few claims might undermine trust if checked (AFE protocol, runaway temperatures, detailed numeric thresholds).
- What I learned: Why the BMS is mostly about constraints and protection, not just “percent remaining.”

### C) Senior EV Industry Engineer
- Flow: Solid overall; the conceptual mapping is strong.
- Ease of understanding: Good; readable without being superficial.
- Depth: Adequate for a blog; wants citations for standards‑level and numerical claims.
- Accuracy: Needs corrections in AFE post and better sourcing for thermal runaway data.
- What I learned: The high‑level framing is good; the weakest part is the unreferenced quantitative detail.

## Evidence‑Backed Corrections

### 1) AFE interface type (analog-front-end-afe.md)
**Claim in blog:** “Most AFEs communicate over SPI… A typical BQ76940 SPI read transaction…”

**Evidence:** TI’s BQ76920 and BQ76940 product pages list an **I2C** interface. The SPI‑style transaction (RDCV) shown is associated with Analog Devices’ LTC6804/6811 family, not TI BQ769x0.

**Correction (proposed text):**
“BQ76920/30/40 use **I2C**. SPI/isoSPI are common on other AFEs such as ADI’s LTC6804/6811. The RDCV‑style command example is specific to the LTC6804/6811 family; for BQ769x0, show an I2C register read example instead.”

**Sources:**
- TI BQ76920 product page (I2C interface): https://www.ti.com/product/BQ76920
- TI BQ76940 product page (I2C interface): https://www.ti.com/product/BQ76940
- Analog Devices LTC6804 product page (isoSPI family): https://www.analog.com/en/products/ltc6804-1.html

---

### 2) Thermal runaway stage temperatures and chemistry‑specific onsets (thermal-runaway-detection-handling.md)
**Claim in blog:** specific onset temperatures (e.g., 80–100°C for NMC, 130°C for LFP) and fixed stage temperatures.

**Evidence:** Review literature shows **ranges** for key thermal reactions (SEI decomposition, separator melting/shutdown, cathode oxygen release) and emphasizes chemistry‑dependent variation. Olivine (LFP) cathodes show higher thermal stability and minimal oxygen release compared to layered oxides.

**Correction (proposed text):**
“Replace point onsets with ranges and chemistry qualifiers: e.g., SEI decomposition typically begins around ~80°C; separator shutdown/melt around ~120–140°C (depends on polymer); cathode oxygen release occurs at higher temperatures for olivine (LFP) than for layered oxides (NMC/NCA). Explicitly note that onset values vary by cell design, SOC, and test method.”

**Sources:**
- Review of thermal runaway mechanisms (temperature windows): https://www.mdpi.com/2079-4991/11/10/2669
- Separator shutdown/melting behavior (temperature dependence): https://pubs.acs.org/doi/abs/10.1021/jp8095914
- Thermal stability of cathode materials (olivine vs layered oxides): https://pubs.acs.org/doi/abs/10.1021/acs.chemrev.5c00621

---

## Claims That Need Evidence or Qualification

### analog-front-end-afe.md
- “A 10 mV cell voltage error → 2–3% SOC error for NMC.” Source NMC OCV–SOC curves and derive slope; the comparative OCV model study provides NMC OCV curves to compute mV per %SOC. (Sources: https://cjme.springeropen.com/articles/10.1186/s10033-018-0268-8)
- “Typical AFE accuracy ±1–5 mV, scan time 1–10 ms, ref drift <50 ppm/°C.” Source with AFE datasheets (e.g., LTC6811, BQ76940). (Sources: https://www.analog.com/media/en/technical-documentation/data-sheets/ltc6811-1-6811-2.pdf, https://www.ti.com/lit/ds/symlink/bq76940.pdf)
- Balancing resistor values and currents (10–100 Ω, 50–200 mA) can be tied to balancing design examples and equations in the LTC6811 datasheet (50–100 mA example) and open BMS implementations (100 mA at ~3.6 V). (Sources: https://www.analog.com/media/en/technical-documentation/data-sheets/ltc6811-1-6811-2.pdf, https://docs.foxbms.org/hardware/slaves/12-ltc-ltc6811-1-vx.x.x/12-ltc-ltc6811-1-v2.1.6.html)

### ocv-vs-terminal-voltage.md
- Rest time requirements (15–30 min NMC, 60–120 min LFP) should be sourced and framed as chemistry‑ and history‑dependent. (Source: OCV relaxation review: https://www.mdpi.com/2313-0105/8/8/77)
- LFP hysteresis magnitude (5–20 mV) should be sourced; experimental LFP hysteresis up to ~30+ mV is reported. (Source: https://www.sciencedirect.com/science/article/pii/S2352152X24033930)
- “1 mV error maps to 5–20% SOC error on LFP plateau” is likely overstated; reported LFP plateau change ~0.1 V over ~20–80% SOC implies ~1–2 mV/%SOC (so 1 mV ≈ ~0.5–1% SOC). Use the LFP OCV curve source and compute slope explicitly. (Sources: https://www.sciencedirect.com/science/article/pii/S2352152X24033930, https://cjme.springeropen.com/articles/10.1186/s10033-018-0268-8)

### thermal-runaway-detection-handling.md
- Stage temperatures and max temperatures should be presented as ranges and referenced to specific studies. (Sources: https://www.mdpi.com/2079-4991/11/10/2669, https://pubs.acs.org/doi/abs/10.1021/ie900096z)
- “CO generation begins at ~100°C” and gas sensor claims can be anchored to gas‑generation reviews showing SEI decomposition at ~90–120°C and gas release (CO, CO2, H2) around ~100°C. (Source: https://www.mdpi.com/2313-0105/11/4/152)
- “LFP onset ~110°C higher than NMC 811” needs a specific study; at minimum, cite reviews that show higher thermal stability of olivine vs layered oxides and present the claim as a range. (Sources: https://www.mdpi.com/2079-4991/11/10/2669, https://pubs.acs.org/doi/abs/10.1021/acs.chemrev.5c00621)

### bms-during-a-drive.md
- Scan counts, CAN message rates, pre‑charge resistor values, current limits, and timing numbers should be labeled as illustrative and/or tied to design references. Pre‑charge timing and RC behavior can be grounded in pre‑charge design guides; current limits and temperature windows can be grounded in cell datasheets. (Sources: pre‑charge RC design: https://www.sensata.com/sites/default/files/a/sensata-how-to-design-precharge-circuits-evs-whitepaper.pdf; cell temp limits: https://www.manualshelf.com/manual/panasonic/ncr18650bl-8/datasheet-english/page-1.html, https://manuals.plus/m/e0026871b5cf2a98fd957d48a7c3b498721d179c6fd4c802deada1d4c706fa85)

### state-of-charge-soc.md / state-of-power-sop.md / state-of-health-soh.md / charging-algorithm.md (and others)
- Numeric thresholds (temperature derating limits, cutoff voltages, current limits, degradation rates) should be sourced from specific cell datasheets and standards or labeled OEM‑policy‑dependent. Example sources for typical voltage and temperature limits: Panasonic NCR18650B datasheet (0–45°C charge, −20–60°C discharge, 4.2 V max, 2.5 V min), Samsung INR21700‑50E datasheet (0–45°C charge, −20–60°C discharge), EVE LF280K LFP datasheet (0–55°C charge, −20–55°C discharge; 3.65 V charge cutoff, 2.5 V discharge cutoff). (Sources: https://www.manualshelf.com/manual/panasonic/ncr18650bl-8/datasheet-english/page-1.html, https://manuals.plus/m/e0026871b5cf2a98fd957d48a7c3b498721d179c6fd4c802deada1d4c706fa85, https://www.mivvyenergy.cz/img/cms/others/_Datasheet%20280Ah-pdf.pdf)

## Sources (for evidence)
- TI BQ76920 (I2C interface): https://www.ti.com/product/BQ76920
- TI BQ76940 (I2C interface): https://www.ti.com/product/BQ76940
- ADI LTC6804 (isoSPI family): https://www.analog.com/en/products/ltc6804-1.html
- ADI LTC6811 datasheet (measurement accuracy, conversion timing): https://www.analog.com/media/en/technical-documentation/data-sheets/ltc6811-1.pdf
- TI BQ769x0 datasheet (measurement accuracy, conversion timing): https://www.ti.com/lit/ds/symlink/bq76940.pdf
- TI reference design data (example BQ76940 cell voltage accuracy): https://www.tij.co.jp/lit/ug/tidueg7b/tidueg7b.pdf
- Thermal runaway review (temperature windows): https://www.mdpi.com/2079-4991/11/10/2669
- Thermal runaway review (EV-focused): https://colab.ws/articles/10.1016/j.ensm.2017.05.013
- Separator shutdown/melt temperature behavior: https://pubs.acs.org/doi/abs/10.1021/jp8095914
- Cathode thermal stability (olivine vs layered oxides): https://pubs.acs.org/doi/abs/10.1021/acs.chemrev.5c00621
- OCV relaxation behavior and time constants (review): https://www.mdpi.com/2313-0105/8/8/77
- LFP hysteresis modeling (Applied Energy): https://www.sciencedirect.com/science/article/pii/S0306261915007369
- LFP OCV hysteresis modeling (SAE technical paper): https://saemobilus.sae.org/papers/modeling-open-circuit-voltage-hysteresis-lifepo-4-batteries-2015-01-1180
- NMC/LFP OCV curve comparison (used for slope/plateau): https://cjme.springeropen.com/articles/10.1186/s10033-018-0268-8
- Gas generation review (CO/CO2/H2 vs temperature): https://www.mdpi.com/2313-0105/11/4/152
- Pre‑charge circuit design whitepaper: https://www.sensata.com/sites/default/files/a/sensata-how-to-design-precharge-circuits-evs-whitepaper.pdf
- Panasonic NCR18650B datasheet (voltage/temp limits): https://www.manualshelf.com/manual/panasonic/ncr18650bl-8/datasheet-english/page-1.html
- Samsung INR21700-50E datasheet (voltage/temp limits): https://manuals.plus/m/e0026871b5cf2a98fd957d48a7c3b498721d179c6fd4c802deada1d4c706fa85
- EVE LF280K LFP datasheet (voltage/temp limits): https://www.mivvyenergy.cz/img/cms/others/_Datasheet%20280Ah-pdf.pdf
