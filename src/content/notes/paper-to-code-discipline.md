---
title: "Lift values, don't trace screenshots"
summary: "A Paper-to-Astro workflow note that saved me a day."
date: 2026-03-30
tags: [paper, astro, design-engineering]
---

The cheap mistake: open the Paper screenshot in Figma's eyedropper and start typing hex values into your Tailwind config. The expensive mistake: do it for a whole site and discover three weeks later that every other shade is half a step off because the dev preview's monitor profile lied to you.

The discipline is `get_jsx` and `get_computed_styles` directly from the canvas. Same values the renderer used, no eye-balling, no color-profile drift. Took me far too long to make this a hard rule.
