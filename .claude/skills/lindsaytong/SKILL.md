---
name: lindsaytong
description: Working on Lindsay Tong's personal portfolio site (~/repos/lindsaytong.com). Next.js + Tailwind CSS + pnpm.
allowed-tools: Bash
---

# Lindsay Tong Portfolio Site

Next.js site at `~/repos/lindsaytong.com`. Uses **pnpm** (not npm/yarn/bun). Tailwind CSS for styling.

## Key Commands

```bash
cd ~/repos/lindsaytong.com

pnpm dev     # dev server on :3000
pnpm build   # production build
pnpm lint    # ESLint
```

## Project Structure

```
app/
  layout.tsx          # Root layout, font imports
  globals.css         # Global styles (body color, h1-h4 overrides)
  page.tsx            # Home page
  about/page.tsx      # About page
  (presentations)/    # Presentations route group
  (projects)/         # Projects route group

components/
  atoms/              # ButtonLink, Button
  molecules/          # Card, CardGrid, Timeline, AboutButton
  organisms/          # About, Contact, Experience, Footer, Landing, Navbar, Skills, etc.

TimelineData.ts       # Timeline entries data
Presentation.ts       # Presentations data
Project.ts            # Projects data
```

## Design Notes

- **Primary accent color:** pink (`bg-pink-300`, `border-pink-300`, `text-pink-400`)
- **Text color:** deep plum (`#4A1942`) set in `globals.css`
- **Cards:** typically `bg-white/80 backdrop-blur-sm shadow-sm rounded-*`
- **Font:** Plus Jakarta Sans (variable `--font-plus-jakarta-sans`)

## Component Notes

### Experience.tsx
Renders two cards: education and experience. Each item has:
- Outer `flex flex-col md:flex-row` div
- Logo column (left, `md:basis-1/4`)
- Content column (right) with pink accent bar (`border-l-4 border-pink-300`)
- Card containers use `max-w-5xl mx-auto`

### Timeline.tsx
Used on About page. Pink dots (`bg-pink-300`), pink line (`border-pink-200`).

## Git Workflow

- This is Lindsay's personal site (not Chris's project)
- Check with Chris before committing/pushing — he usually handles it
- Branch is typically `develop` or `main`
- No CI/CD noted; deployments are manual
