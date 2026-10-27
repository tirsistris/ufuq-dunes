# Ufuq — «Dunes»

Neobank concept for Saudi Arabia: the home screen answers not "how much is in the account" but "how much is available for the next decision". This is v2 of the prototype, built one-to-one from Figma: day and night themes, English and Arabic (RTL), the transfer flow with its limit and not-enough-money states.

Live: https://ufuq-dunes.vercel.app · Case study: https://baatr.vercel.app/cases/ufuq

A concept, not a financial product. All figures are fictional.

## How it is built

- Static site: `index.html` + `styles.css` + `app.js`, no framework, no build step.
- Look comes only from Figma; behaviour that frames don't show is decided in a spec first (`docs/tasks/`), then coded.
- `checks/` — scripts that compare the live prototype against Figma: geometry, colours, contrast, tap targets, text fit, Arabic layout (riyal sign on the left, all 14 AR states).
- `ref/` — Figma reference frames and tokens; `runs/` (ignored) — check outputs.
- Fonts: Inter and Readex Pro, both SIL Open Font License.

## Run it

Open `index.html` through any static server, e.g. `npx serve .`
