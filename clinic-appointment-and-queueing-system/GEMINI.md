# Project Rules — Clinic Appointment and Queueing System

## Code Organization

- **Screens go in `pages/`** — each page or screen of the app gets its own file inside the `pages` folder.
- **Shared pieces go in `components/`** — reusable UI parts (buttons, modals, layout wrappers, etc.) live in `components`.
- **Saving and loading go in `data/`** — all Supabase queries, API calls, and data-access logic belong in the `data` folder.
- **One job per file** — every file should do one thing. Don't mix unrelated logic in a single file.
- **No file over 300 lines** — if a file is getting close to 300 lines, split it into smaller, focused files.

## Before Writing Anything New

- **Check if it already exists** — before creating a new component, page, or data function, search the codebase first. Reuse what's already there instead of duplicating.

## General

- Keep the codebase organized so a **beginner can read and understand it**.
