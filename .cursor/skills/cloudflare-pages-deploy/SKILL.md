---
name: cloudflare-pages-deploy
description: Deploy static sites to Cloudflare Pages for smmariquit. Use when adding deploy workflows, wrangler pages deploy, custom domains, _headers, security.txt, or migrating off Vercel.
---

# Cloudflare Pages deploy

## Pattern (required)

- Build in GitHub Actions (`npm ci && npm run build` or project equivalent).
- Deploy: `npx wrangler pages deploy <OUT_DIR> --project-name=<name> --branch=main`
- **Do not** connect CF Pages Git integration (500 builds/month limit on free).
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` on the repo.

## Output directory

| Stack | Dir |
|-------|-----|
| Astro / Vite | `dist/` |
| Next static export | `out/` or `dist/` |
| Plain HTML | `.` |

## Template workflow

Copy from `smmariquit/tutorials` → `.github/workflows/deploy-cloudflare.yml`.

## DNS

- `*.stimmie.dev` → CNAME to `<project>.pages.dev`
- Don't orange-cloud game servers, email DKIM, or Streamlit hosts.

## Security (Pages)

Add if missing:

- `public/_headers` — SEO-safe security headers
- `public/.well-known/security.txt` — Contact: `mailto:semariquit@gmail.com`

## Source of truth

Full migration list: `smmariquit/tutorials` → `MIGRATION-HANDOFF.md`

Account ID: `847a37119fd03f8765b62a6775a6c204`
