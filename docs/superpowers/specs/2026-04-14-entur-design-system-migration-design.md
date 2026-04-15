# Entur Design System Migration — Design Spec

**Goal:** Migrate the NeTEx Part 3 overview app from Tailwind CSS v4 to the Entur design system (`@entur/*`), adopting the standard light theme used on linje.entur.no.

**Approach:** Full migration — remove Tailwind entirely, install Entur component packages, replace all hand-rolled styled elements with Entur components and `@entur/tokens` CSS variables.

---

## Packages

Install the following `@entur/` packages (all require `react >= 16.8`):

| Package | Version | Used for |
|---|---|---|
| `@entur/tokens` | latest | CSS variables for colors, spacing, typography |
| `@entur/form` | latest | `TextField` for the search input |
| `@entur/chip` | latest | `FilterChip` for group filter buttons |
| `@entur/button` | latest | `SecondaryButton` for the Eksempler button, `TertiaryButton` for clear |
| `@entur/tab` | latest | `TabList` / `Tab` for Skjema / XML-instans tabs |
| `@entur/table` | latest | `Table`, `TableHead`, `TableRow`, `TableCell` for attribute tables |
| `@entur/expand` | latest | `ExpandablePanel` for inherited-attribute sections in AttributePanel |
| `@entur/modal` | latest | `Modal` for the paste XML dialog |
| `@entur/typography` | latest | `Label`, `Paragraph`, `Heading` for text elements |

Uninstall: `tailwindcss`, `@tailwindcss/vite`

---

## Theming & Colors

- Replace `@import "tailwindcss"` in `src/index.css` with CSS imports for each installed `@entur/*/dist/styles.css`
- Use `@entur/tokens` CSS variables for all custom styling (layout colors, spacing, borders)
- Group accent colors (used for tree + badges) stay distinct per group but align to Entur's palette:

| Group | Color |
|---|---|
| FareProduct | `#ff6c6c` (Entur coral) |
| FarePrice | `#181c56` (Entur dark blue) |
| SalesOfferPackage | `#e07b00` (Entur orange) |
| FareStructureElement | `#c0392b` (Entur red) |
| UsageParameter | `#6a1b9a` (Entur purple) |
| TimeStructureFactor | `#1565c0` (Entur blue) |
| Other groups | `#555` (neutral) |

Attribute kind badge colors (enum/ref/list/etc.) use Entur's semantic palette:
- `enum` → `#e65100` (orange)
- `ref` → `#2e7d32` (green)
- `list` → `#1565c0` (blue)
- `complex` → `#6a1b9a` (purple)
- `string`/`boolean`/`integer`/`decimal` → `#555` (neutral)

---

## Layout

The overall master-detail layout (top bar, left sidebar, right panel) is built with CSS flexbox using `@entur/tokens` variables — Entur has no layout shell component.

Key tokens to use:
- Background: `var(--colors-greys-white)` (panel), `var(--colors-greys-grey05)` (sidebar)
- Borders: `var(--colors-greys-grey20)`
- Text primary: `var(--colors-greys-grey90)`
- Text muted: `var(--colors-greys-grey50)`
- Brand accent (top bar bottom border, active tab underline): `var(--colors-brand-coral)` / `#ff6c6c`

---

## Component Mapping

### `src/index.css`
Remove `@import "tailwindcss"`. Add `@entur/*/dist/styles.css` imports in correct order:
tokens → typography → form → chip → button → tab → table → expand → modal

### `src/App.tsx`
Replace Tailwind layout classes with `style={{}}` props using `@entur/tokens` CSS variables. No Entur component wrappers needed here — flex layout is fine with CSS variables.

### `src/components/SearchBar.tsx`
- Replace `<input>` with `@entur/form` `TextField`
- Replace filter `<button>` chips with `@entur/chip` `FilterChip`

### `src/components/ElementTree.tsx`
- Group headers: replace `<button>` with plain `<div>` styled with tokens (Entur has no sidebar tree component)
- Element items: styled `<button>` with tokens (border-left accent, hover state)
- Instance count badges: `<span>` styled with tokens

### `src/components/AttributePanel.tsx`
- Replace `<button>` tabs with `@entur/tab` `TabList` + `Tab`
- Replace `<table>` with `@entur/table` `Table`, `TableHead`, `TableBody`, `TableRow`, `HeaderCell`, `DataCell`
- Replace `<button>` expand toggles with `@entur/expand` `ExpandablePanel`
- Header, badges, inheritance breadcrumb: styled spans with tokens

### `src/components/ExampleLoader.tsx`
- Replace trigger `<button>` with `@entur/button` `SecondaryButton`
- Keep the custom dropdown panel (a positioned `<div>` with a list of buttons). `@entur/dropdown` is form-focused (select/combobox) and doesn't fit a menu-style list — we style the custom panel with tokens instead of replacing it
- Replace paste modal `<div>` with `@entur/modal` `Modal`
- Replace clear `<button>` with `@entur/button` `TertiaryButton`

---

## What Does NOT Change

- `src/types.ts` — no changes
- `scripts/` — no changes
- `src/utils/` — no changes
- `src/data/` — no changes
- All tests — no changes needed (components are not unit-tested)
- `vite.config.ts` — remove `tailwindcss()` plugin, keep everything else

---

## File Changes Summary

| File | Change |
|---|---|
| `package.json` | Add `@entur/*` packages, remove `tailwindcss`, `@tailwindcss/vite` |
| `vite.config.ts` | Remove `tailwindcss()` plugin import and usage |
| `src/index.css` | Replace Tailwind import with Entur CSS imports |
| `src/App.tsx` | Replace Tailwind classes with inline styles using tokens |
| `src/components/SearchBar.tsx` | Use TextField + FilterChip |
| `src/components/ElementTree.tsx` | Replace Tailwind classes with tokens; no Entur component for tree itself |
| `src/components/AttributePanel.tsx` | Use Tab/TabList, Table, ExpandablePanel |
| `src/components/ExampleLoader.tsx` | Use SecondaryButton, Modal; keep custom dropdown |
