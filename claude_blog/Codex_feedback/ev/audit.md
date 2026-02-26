# Audit Feedback — Claude Blog / EV

## Summary
The EV posts are engaging and well‑structured, with strong narrative flow and clear mental models. The main gaps are factual claims without citations and a handful of numeric ranges that should be framed as illustrative. Accuracy is generally good but needs tighter sourcing for credibility.

## File-Specific Feedback

### claude_blog/ev/ev-nodes.md
- Flow is excellent and the node‑by‑node structure makes a complex system approachable.
- Depth is right for a blog series; the networking and startup sequencing sections are particularly useful.
- Accuracy issues are mostly about over‑specific numbers and broad claims presented as universal (ECU counts, SiC adoption timelines, standby current, etc.). These should be softened or sourced.

### claude_blog/ev/why-range-drops-in-winter.md
- Very strong conceptual framing; the three‑cause breakdown is pedagogically effective.
- Numerical examples are helpful but many require sourcing; a few numbers appear too specific without evidence.
- Good linkage between BMS concepts and real‑world driver experience.

## Persona Evaluations

### A) A‑ Engineering Student
- Flow: High; prerequisites and narrative are easy to follow.
- Ease of understanding: High; concrete examples help.
- Depth: Appropriate for senior undergrad, but an appendix for equations/assumptions would help.
- Accuracy: Several quantitative claims need sources or should be marked as illustrative.
- What I learned: How node architectures enforce BMS authority and why winter range is a multi‑mechanism problem, not a single “cold battery” effect.

### B) EV Enthusiast
- Flow: Engaging and intuitive.
- Ease of understanding: High.
- Depth: Good balance between explanation and detail.
- Accuracy: A few claims risk credibility if checked (ECU counts, heat‑pump impact percentages, SiC adoption).
- What I learned: Why early‑drive losses are worse and how preconditioning changes the thermodynamics.

### C) Senior EV Industry Engineer
- Flow: Good; most sections read like a solid system overview.
- Ease of understanding: Good, but some sections need more precise language on standards and empirical numbers.
- Depth: Strong for a blog post; would benefit from source anchoring.
- Accuracy: Needs citations for the empirical claims. Some statements should be qualified as typical or illustrative.
- What I learned: The startup sequence and fault propagation framing are useful, but would be stronger with a reference to specific OEM or standard guidance.

## Evidence‑Backed Corrections

### 1) Heat pump winter range impact (why-range-drops-in-winter.md)
**Claim in blog:** “Fleet data … shows 10–15% winter range reduction for heat‑pump vehicles vs 20–30% for resistive‑only vehicles.”

**Evidence:** Recurrent’s fleet analyses report materially smaller winter losses for heat‑pump vehicles and provide specific retention figures (e.g., ~83% vs ~75% range retention in cold conditions in their summary reporting). A Yahoo Tech article summarizes Recurrent’s reported split with concrete percentages.

**Correction (proposed text):**
“Fleet data from Recurrent reports that EVs with heat pumps retain materially more range in cold conditions than EVs with resistive heating. One summarized split shows roughly ~83% vs ~75% winter range retention (about 17% vs 25% loss), though this varies by model and climate.”

**Sources:**
- Recurrent Auto winter range analysis: https://www.recurrentauto.com/research/how-does-cold-weather-affect-ev-range
- Recurrent data summary via Yahoo Tech: https://www.yahoo.com/tech/evs-heat-pumps-better-171342219.html

---

### 2) CAN bus topology and stub length guidance (ev-nodes.md)
**Claim in blog:** “CAN bus topology must be linear” and “stub length ideally <0.3 m at 1 Mbps.”

**Evidence:** ISO 11898‑2 provides physical‑layer topology guidance and the common 1 Mbps stub length limits used in design practice.

**Correction (proposed text):**
“CAN high‑speed topology is designed as a linear bus with short stubs. The commonly cited design rule is stub length ≤0.3 m at 1 Mbps, consistent with ISO 11898‑2 physical‑layer guidance.”

**Source:** ISO 11898‑2:2016 (high‑speed CAN physical layer). PDF summary and extracts: https://www.emcfastpass.com/iso-11898-2-2016-pdf

---

## Claims That Need Evidence or Qualification

### ev-nodes.md
- “A mid‑size BEV contains 50–100 ECUs.” Needs a source or should be softened to “dozens,” as OEM architectures vary widely.
- “Most EVs produced before 2020 use IGBTs; most designed after 2022 use SiC.” This is a strong market‑wide claim and needs evidence or a softer phrasing.
- “BMS standby current typically 1–5 mA and 3–6 weeks until 12 V depletion.” Requires evidence; likely varies by OEM and telematics duty cycle.
- “CAN utilization should be kept below 50%.” This is a rule‑of‑thumb; cite a design guide or label as a heuristic.
- “Heat pump COP values at −5°C and −20°C.” Needs technical references; either cite a study or label as illustrative.
- “Gateway controls required by UN R155.” Needs explicit citation to the regulation text or a cybersecurity compliance guide.
- “OBC AC level power ranges and ‘upper end 22 kW’.” Cite the standard or label as typical.

### why-range-drops-in-winter.md
- “R₀ doubles for every 15–20°C drop; 2–3× at 0°C.” Needs a citation or chemistry‑specific reference.
- “Typical capacity loss from this effect: 8–15% at 0°C.” Needs a source (cell test data) or should be marked as example.
- “Cabin heating 3–5 kW continuous.” Needs citation or marked as typical.
- The energy‑budget table values (kWh line items and ranges) need either a source or to be labeled as an illustrative scenario.
- “ADAC winter tests show 55–75% of WLTP at 0°C.” Requires a precise citation to ADAC test results.
- “SAE J1634 is performed at 25°C.” Needs a standard citation.

## Sources (for evidence)
- Recurrent Auto winter range analysis: https://www.recurrentauto.com/research/how-does-cold-weather-affect-ev-range
- Recurrent data summary via Yahoo Tech: https://www.yahoo.com/tech/evs-heat-pumps-better-171342219.html
- ISO 11898‑2:2016 (high‑speed CAN physical layer) PDF summary/extracts: https://www.emcfastpass.com/iso-11898-2-2016-pdf


---

## Status Check (2026-02-26)
- **Implemented:** None confirmed in `claude_blog/ev/*.md` (no edits detected to address the evidence‑backed corrections or missing‑evidence items).
- **Still open:** All items under “Claims That Need Evidence or Qualification” remain unaddressed.
