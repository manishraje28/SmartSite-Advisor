---
version: alpha
name: SmartSite Advisor
description: An Indian property portal for buying and selling homes and plots, where every listing carries location, air-quality and fair-price checks. It should feel as trustworthy and scannable as a serious listings site.
colors:
  ground: "#f4f5f7"   # page background (token: page)
  surface: "#ffffff"  # cards, header, panels
  ink: "#16223a"      # text, header, dark panels (token: ink-900)
  muted: "#4f6584"    # secondary text (token: ink-500)
  line: "#dfe2e7"     # borders and dividers (token: line)
  signal: "#a8432a"   # price + primary action (token: brick-600)
  good: "#2f6a4b"     # good score / verified / below-market (token: moss-600)
  warn: "#8a5a0b"     # middling score, on #fdf6e7 with #f3e2b8 border
  bad: "#b42318"      # poor score / errors, on #fdf1f0 with #f6d3cf border
typography:
  display:
    fontFamily: Public Sans
    fontSize: 30px
    fontWeight: 700
    letterSpacing: -0.01em
  body:
    fontFamily: Public Sans
    fontSize: 14px
    lineHeight: 1.6
rounded:
  sm: 4px    # badges, chips (Tailwind `rounded`)
  md: 6px    # buttons, inputs (`rounded-md`)
  lg: 8px    # cards, panels, modals, images (`rounded-lg`)
spacing:
  sm: 12px
  md: 20px
  lg: 56px
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 10px 20px
---

## Overview

SmartSite lists homes and plots for sale in Indian cities and scores each one: location, air quality (AQI), fair price compared with nearby listings, and plain-English comparisons. Buyers browse, compare and shortlist. Sellers post listings and see how they score. The look comes from serious listings portals: the photo and the price come first, the facts sit in ruled tables, and the AI is a tool in the background, not the brand.

## Colors

All colours are Tailwind v4 tokens defined in `src/index.css` under `@theme`. Scales: `ink-50…950`, `brick-50…950`, `moss-50…950`, plus `page` and `line`.

- **Page `bg-page` / surface `bg-white`:** light grey page, white cards, so the cards read as the listings.
- **Ink `text-ink-900`:** headings and body. `text-ink-700` for secondary body, `text-ink-500` for meta. Never go lighter than `ink-400` for text.
- **Brick `brick-600`:** one job each: the **price** and the **primary action** on a screen. No brick headings, icons or decoration.
- **Moss `moss-600/700`:** "good" states only: score ≥ 80, verified, below market, success.
- **Dark panels:** `bg-ink-900` with `text-white` / `text-ink-200`, `border-ink-800`. Use these for the header-style bands, the chat panel and the score demo. Never slate-950 with neon accents.
- **Score tones** (badges, numbers): ≥80 moss (`text-moss-700 bg-moss-50 border-moss-100`), 60–79 warn (`text-[#8a5a0b] bg-[#fdf6e7] border-[#f3e2b8]`), <60 bad (`text-[#b42318] bg-[#fdf1f0] border-[#f6d3cf]`).

## Typography

Public Sans everywhere (`font-sans`, already the default). Page title `text-3xl font-bold tracking-tight`, section title `text-lg`/`text-xl font-bold`, body `text-sm`, meta `text-xs text-ink-500`. Prices and all numbers get the `tabular` class. Sentence case for labels, buttons and headings. No `uppercase tracking-wider` micro-labels, no `font-black`/`font-extrabold` beyond the logo.

## Layout

`container-app` (max 1280px) for pages. Left-aligned page headers: title, one-line description, then content. No centred hero-plus-badge stacks. Data goes in ruled lists (`divide-y divide-line`) or tables before it goes in tile grids. Page top: `main` already has `pt-16` for the fixed header, so pages start with about `pt-8`, never `pt-24`.

## Elevation & Depth

Flat. Surfaces are separated by a 1px `border-line`, and hover darkens the border (`hover:border-ink-300`). No coloured shadows, glows, `backdrop-blur`, `shadow-2xl` or `shadow-xl`. Modals only get `shadow-lg` on a `bg-ink-950/50` overlay.

## Shapes

`rounded` for badges and chips, `rounded-md` for buttons and inputs, `rounded-lg` for cards, panels, modals and images. Avatars are `rounded-full`. Nothing above `rounded-lg` (no `rounded-2xl`/`3xl`, no pill buttons).

## Components

Shared classes in `src/index.css`. Reuse these and don't restyle them inline:
- Buttons: `btn-primary` (brick), `btn-secondary` (white, ink border), `btn-tertiary` (brick text link), `btn-emerald` (moss, for "confirm/publish" only).
- Inputs: `input-field`, labels `label-sm`.
- Cards: `glass-card` (= white, `rounded-lg`, `border-line`). Dark panel: `glass-panel`.
- Badges: `badge-ai` (neutral ink), `badge-success` (moss), `badge-warning` (amber).
- Listing card: `components/cards/PropertyCard.jsx`. Header and footer: `components/layout/Layout.jsx`.
- Spinner: `w-8 h-8 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin`.

## Do's and Don'ts

- Do reuse the header, footer, card and tokens above on every page, unchanged.
- Do add a token here before a page uses it. Never invent a one-off colour inside a page.
- Do keep every prop, handler, state, API call and route exactly as it was. Styling only.
- Don't use: `indigo-*`, `purple-*`, `violet-*`, `emerald-*`, `teal-*`, `cyan-*`, `fuchsia-*`, `pink-*` classes; any `bg-gradient-*`/`from-*`/`to-*` gradient (one exception: a dark-to-transparent scrim over a photo for legible text); `bg-clip-text`; `backdrop-blur`; coloured or glow shadows; `animate-ping`/`animate-pulse` decoration; `Sparkles`, `Zap`, `Rocket`, `Brain`, `Wand` icons; emoji as icons; icon-in-a-tinted-rounded-square chips; decorative 01/02/03; one coloured word in a headline; "AI-powered / intelligent / next-gen / genius" copy.
- Name features plainly: "Score", "Report", "Negotiation advice", "Ask about this home", not "AI Multi-Agent Intelligence Engine".
