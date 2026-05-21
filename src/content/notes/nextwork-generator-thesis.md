---
title: "Build Flow leverage is research × shapeability"
summary: "Why NextWork's generator stopped treating prompts as the product."
date: 2026-05-12
tags: [nextwork, generators, design-engineering]
---

The generator failed twice because we asked the user to do two things at once: describe what they wanted, and shape it. Free-text prompts collapse both into one underspecified handoff. Downstream editing is where the double failure surfaces — fix one and the other reverts.

We moved research to the start of the flow instead. The generator now reads the user's context first, then offers structured shapes the user can swap, not strings the user has to invent. Less prompt-engineering theatre, more genuine direction-setting.
