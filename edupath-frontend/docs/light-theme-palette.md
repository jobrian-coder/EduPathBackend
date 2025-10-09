# EduPath Light Theme Palette

This palette builds on the existing teal and yellow branding seen in `src/index.css` while expanding it into a consistent light theme.

## Core Brand Colors
- **Primary (`--color-primary`)**
  - Hex: `#0F766E`
  - Tailwind: `teal-700`
  - Usage: Primary buttons, key highlights, active states.
- **Primary Hover (`--color-primary-hover`)**
  - Hex: `#0D9488`
  - Tailwind: `teal-600`
  - Usage: Hover/focus state for primary elements.
- **Secondary (`--color-secondary`)**
  - Hex: `#0EA5E9`
  - Tailwind: `sky-500`
  - Usage: Accent buttons, tabs, focus rings, info highlights.
- **Accent (`--color-accent`)**
  - Hex: `#FACC15`
  - Tailwind: `yellow-400`
  - Usage: Marketing callouts, badges, progress indicators.

## Neutral Surfaces & Text
- **Background (`--color-background`)**
  - Hex: `#F8FAFC`
  - Tailwind: `slate-50`
  - Usage: Page background to keep content bright without glare.
- **Surface (`--color-surface`)**
  - Hex: `#FFFFFF`
  - Tailwind: `white`
  - Usage: Cards, panels, modals.
- **Border (`--color-border`)**
  - Hex: `#E2E8F0`
  - Tailwind: `slate-200`
  - Usage: Divider lines, card borders, inputs.
- **Text Primary (`--color-text-primary`)**
  - Hex: `#0F172A`
  - Tailwind: `slate-900`
  - Usage: Body copy, headings.
- **Text Muted (`--color-text-muted`)**
  - Hex: `#475569`
  - Tailwind: `slate-600`
  - Usage: Secondary text, descriptions, placeholders.

## Support Colors
- **Info (`--color-info`)**
  - Hex: `#38BDF8` (`sky-400`)
  - Usage: Informational alerts, links.
- **Success (`--color-success`)**
  - Hex: `#16A34A` (`green-600`)
  - Usage: Positive confirmations, success badges.
- **Warning (`--color-warning`)**
  - Hex: `#F59E0B` (`amber-500`)
  - Usage: Non-destructive warnings, cautions.
- **Danger (`--color-danger`)**
  - Hex: `#DC2626` (`red-600`)
  - Usage: Errors, destructive actions.

## Implementation Tips
- Define the variables in `src/index.css` under `:root`, then map Tailwind classes via `className` or custom utility classes.
- Keep a single source of truth by referencing the variables inside component-level styles when possible.
- For gradient elements, continue using a blend such as `from-teal-600 to-yellow-400`.

## Accessibility Guidance
- Maintain a minimum contrast ratio of 4.5:1 for body text (`#0F172A`) against `#FFFFFF` or `#F8FAFC`.
- Primary button text (`#FFFFFF`) against `#0F766E` yields a contrast ratio of approximately 4.6:1.
- Use `#0D9488` for hover states while retaining white text to preserve contrast.
- For muted text on `#FFFFFF`, ensure font size >= 14px; otherwise increase contrast (e.g., use `#334155`).
- Focus indicators should be at least 2px and ideally use `--color-secondary` to meet WCAG focus visibility.

## Sample Usage Snippet
```css
:root {
  --color-primary: #0F766E;
  --color-primary-hover: #0D9488;
  --color-secondary: #0EA5E9;
  --color-accent: #FACC15;
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text-primary: #0F172A;
  --color-text-muted: #475569;
  --color-info: #38BDF8;
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger: #DC2626;
}

body {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.button-primary {
  background: var(--color-primary);
  color: #fff;
}
.button-primary:hover {
  background: var(--color-primary-hover);
}
```
