# AI_RULES.md - Image Converter Hub

This file defines the technical rules for this repository.

If there is a conflict, follow this order:
1. Explicit user instruction
2. `AGENTS.md`
3. `AI_RULES.md`
4. Existing codebase pattern

## Project Scope

Image Converter Hub is a client-side app for image optimization, conversion, crop, and download.

Mandatory architecture rule:
- All image processing must run in the browser.
- Do not add backend processing, webhooks, n8n flows, or external image-processing APIs.
- Only change this architecture if the user explicitly asks for it.

## Current Tech Stack (source of truth: repository)

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- React Router (`react-router-dom`)
- React Query (`@tanstack/react-query`) for app-level async state when needed
- React Hook Form + Zod (when forms/validation are required)
- Framer Motion
- Lucide React
- JSZip (batch download)
- Canvas API (local processing pipeline)
- React Image Crop (crop UX)
- Vitest + Testing Library
- Deploy target: Vercel

## Code Organization

- Keep routes in `src/App.tsx`.
- Keep image processing logic in `src/lib/` (for example, `src/lib/imageProcessor.ts`).
- Keep reusable UI in `src/components/`.
- Keep generated/base shadcn files in `src/components/ui/` unchanged whenever possible.
- Use `@/` path alias imports consistently.

## UI and Styling Rules

- Prefer shadcn/ui components first.
- Use Tailwind as the main styling approach.
- Inline style is allowed only when technically necessary (example: library interop such as crop/image rendering limits).
- Preserve the existing premium/mobile-first direction:
  - clear visual feedback
  - large touch-friendly controls
  - responsive behavior across `sm`, `md`, `lg`
  - comfortable desktop layout up to around `1400px`

## Image Processing Rules

- Prefer native browser APIs before adding heavy libraries.
- Preserve transparency when output format supports alpha (PNG/WEBP/AVIF).
- For JPG/JPEG output, fill background with white.
- Avoid unnecessary quality loss.
- Handle errors per file whenever possible.
- Avoid UI lockups during heavy operations and provide visible progress/loading states.
- Revoke object URLs after use to prevent memory leaks.

## Notifications, Icons, Motion

- Icons: use `lucide-react`.
- Toasts: prefer project toast utilities (`src/hooks/use-toast.ts` and existing Sonner setup).
- Motion: use `framer-motion` for animated UI behavior.

## Versioning and Delivery

- Product version source should remain in `src/lib/version.ts`.
- Bump version only for meaningful product-visible changes (feature or relevant UI/UX improvement).
- Before concluding relevant code changes, run:
  - `npm run build`
- Never commit secrets, tokens, or credentials.
