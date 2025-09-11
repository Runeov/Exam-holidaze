# Holidaze (Exam‑holidaze) — Project Report
**Period covered:** 29 Aug – 10 Sep 2025  
**Repository:** `Runeov/Exam-holidaze`

> This report summarizes how the project evolved commit‑by‑commit, highlights the architecture and feature set, and documents a Cloud/OneDrive–related incident that affected local development.

---

## 1) Executive summary
- **Initial scaffolding (Aug 29):** React app created with routing, testing, and basic pages. [[be5838c]](https://github.com/Runeov/Exam-holidaze/commit/be5838c)  
- **Core features (Aug 30–31):** Venue listing & details, authentication (login/register + protected routes), and a consolidated API layer for bookings/profiles. [[0c99043]](https://github.com/Runeov/Exam-holidaze/commit/0c99043), [[d601640]](https://github.com/Runeov/Exam-holidaze/commit/d601640), [[6e98911]](https://github.com/Runeov/Exam-holidaze/commit/6e98911), [[3eb1be8]](https://github.com/Runeov/Exam-holidaze/commit/3eb1be8)  
- **Manager & profile flows (Aug 31):** Manager dashboard, create‑venue, user profile pages. [[10a54d3]](https://github.com/Runeov/Exam-holidaze/commit/10a54d3)  
- **Styling/systemization (Sep 1):** Tailwind v4 set‑up, component refactors, **project moved to `C:\dev`**. [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c)  
- **Booking UX (Sep 2):** Register‑then‑book flow and success banners. [[b1b2838]](https://github.com/Runeov/Exam-holidaze/commit/b1b2838)  
- **Search & home (Sep 4):** Client‑side pagination, local sorting, improved “Show More” on Home. [[be9d5b8]](https://github.com/Runeov/Exam-holidaze/commit/be9d5b8), [[ed4b015]](https://github.com/Runeov/Exam-holidaze/commit/ed4b015)  
- **Deploy & perf (Sep 7):** SPA redirects and immutable asset caching, LCP image preloads. [[9f75b42]](https://github.com/Runeov/Exam-holidaze/commit/9f75b42)  
- **Incident window (Sep 8–10):** “File recovery”, “madness”, and “registry error.” commits while cleaning up environment after moving from OneDrive. [[770492f]](https://github.com/Runeov/Exam-holidaze/commit/770492f), [[c0ca831]](https://github.com/Runeov/Exam-holidaze/commit/c0ca831), [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)

---

## 2) Timeline of development (by date)

### **Aug 29, 2025**
- **Initial commit.** Project scaffold and dependencies. [[be5838c]](https://github.com/Runeov/Exam-holidaze/commit/be5838c)

### **Aug 30, 2025**
- **Landing + Venues** (listing page & basic landing UI). [[0c99043]](https://github.com/Runeov/Exam-holidaze/commit/0c99043)  
- **Venue Details** page added with `/venues/:id`. [[d601640]](https://github.com/Runeov/Exam-holidaze/commit/d601640)  
- **Auth**: login/register flow; protected routing; navbar state based on auth. [[6e98911]](https://github.com/Runeov/Exam-holidaze/commit/6e98911)  
- **API**: bookings & profile API wrap moved to a proper client. [[3eb1be8]](https://github.com/Runeov/Exam-holidaze/commit/3eb1be8)

### **Aug 31, 2025**
- **Manager/Profile/Venues**: manager dashboard + create‑venue + public user profiles. [[10a54d3]](https://github.com/Runeov/Exam-holidaze/commit/10a54d3)  
- **A11y/SEO polish**: dynamic `document.title` across pages. [[67e54a9]](https://github.com/Runeov/Exam-holidaze/commit/67e54a9)  
- **WSGC** (UI/UX tweaks, modal semantics, keyboard/focus improvements). [[24bea8f]](https://github.com/Runeov/Exam-holidaze/commit/24bea8f)

### **Sep 1, 2025**
- **Tailwind & refactor**: Tailwind v4 integration, new components, **repo moved to `C:\dev`** to avoid cloud interference. [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c)  
- **SmartImage**: robust image component and test suite groundwork. [[7ee3b8c]](https://github.com/Runeov/Exam-holidaze/commit/7ee3b8c)

### **Sep 2, 2025**
- **Register‑then‑book**: capture pending booking, prompt to register/login, then auto‑book and flash success. [[b1b2838]](https://github.com/Runeov/Exam-holidaze/commit/b1b2838)

### **Sep 4, 2025**
- **Search & pagination**: client‑side pagination (24/page) + local sorting + API wrappers for search. [[be9d5b8]](https://github.com/Runeov/Exam-holidaze/commit/be9d5b8)  
- **Home UX**: drain all pages on “Show More”, clickable venue cards, stable keys. [[ed4b015]](https://github.com/Runeov/Exam-holidaze/commit/ed4b015)

### **Sep 7, 2025**
- **Deployment**: Netlify‑style SPA redirects; immutable caching for `/assets/*`; hero preload; intrinsic sizes. [[9f75b42]](https://github.com/Runeov/Exam-holidaze/commit/9f75b42)

### **Sep 8–10, 2025**  (Recovery window)
- **File recovery**: revert/fix assets and markup; normalize attributes; adjust CSS. [[770492f]](https://github.com/Runeov/Exam-holidaze/commit/770492f)  
- **“madness”**: clean‑ups following recovery and deleted stray artifact. [[c0ca831]](https://github.com/Runeov/Exam-holidaze/commit/c0ca831)  
- **“registry error.”**: repaired regex and introduced chunked media carousel under `src/styles/components/media/`. [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)

> For a browsable commit ledger by date, see the GitHub “Commits” view (Aug 29 → Sep 10).  
> https://github.com/Runeov/Exam-holidaze/commits/main

---

## 3) Architecture & stack
- **Front‑end:** React 19 + React Router 7; Vite build; Vitest/RTL for tests; TailwindCSS v4 for styles; Biome for lint/format. [[be5838c]](https://github.com/Runeov/Exam-holidaze/commit/be5838c), [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c)  
- **API access:** Noroff v2 HTTP client abstractions for profiles, bookings, venues. [[3eb1be8]](https://github.com/Runeov/Exam-holidaze/commit/3eb1be8)  
- **Routing & auth:** Protected routes via context and guards; `/profile`, `/users/:name`, `/my-venues`, `/venues/create`. [[6e98911]](https://github.com/Runeov/Exam-holidaze/commit/6e98911), [[10a54d3]](https://github.com/Runeov/Exam-holidaze/commit/10a54d3)

---

## 4) Key features delivered
- **Authentication & Profile**: login/register, protected profile, manager flag UX, Settings page for profile editing (avatar/banner via URL or file). [[6e98911]](https://github.com/Runeov/Exam-holidaze/commit/6e98911), [[24fc1b8]](https://github.com/Runeov/Exam-holidaze/commit/24fc1b8)  
- **Venue browsing**: landing, search with local pagination/sorting, details pages. [[0c99043]](https://github.com/Runeov/Exam-holidaze/commit/0c99043), [[be9d5b8]](https://github.com/Runeov/Exam-holidaze/commit/be9d5b8), [[d601640]](https://github.com/Runeov/Exam-holidaze/commit/d601640)  
- **Booking flow**: calendar with disabled dates, register‑then‑book, success flash. [[8d43ca4]](https://github.com/Runeov/Exam-holidaze/commit/8d43ca4), [[b1b2838]](https://github.com/Runeov/Exam-holidaze/commit/b1b2838)  
- **Manager capabilities**: My Venues; Create Venue; Edit booking/venue; public profiles with venues/bookings. [[10a54d3]](https://github.com/Runeov/Exam-holidaze/commit/10a54d3)  
- **Performance & deploy**: SPA redirects, immutable caches, LCP image tuning; `SmartImage` to improve error handling and LCP. [[9f75b42]](https://github.com/Runeov/Exam-holidaze/commit/9f75b42), [[7ee3b8c]](https://github.com/Runeov/Exam-holidaze/commit/7ee3b8c)

---

## 5) OneDrive incident (root‑cause narrative)
**Context.** The project was migrated to `C:\dev` once the first sync issues showed up, but the original OneDrive‑synced folder was not fully removed. This led to **“register/registry error” files being overwritten** during cloud pressure (full quota) and **cache files being deleted**, while Git’s internal cache remained intact. Locally this manifested as: (a) apparently random file reverts to older versions, (b) odd merge states, and (c) confusion between cloud‑synced Node tooling and the project. The repo history around **Sep 8–10** shows “File recovery”, “madness”, and “registry error.” work to get back to a clean state. [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c), [[770492f]](https://github.com/Runeov/Exam-holidaze/commit/770492f), [[c0ca831]](https://github.com/Runeov/Exam-holidaze/commit/c0ca831), [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)

> **Author’s note:** The OneDrive behavior was observed on the local machine and is documented here for transparency. The exact OneDrive actions are not visible from Git history; the correlation is based on commit messages, local symptoms, and the timing of the cleanup commits listed above.

**Mitigations implemented** (and recommended going forward):
1. Keep the **canonical working copy in `C:\dev\Exam-holidaze`** outside of any OneDrive‑synced path. [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c)  
2. Remove/unsync any shadow project copies that remain under OneDrive.  
3. Ensure **Node.js, PNPM/NPM caches, and global toolchains** are **not** hosted under OneDrive.  
4. Harden `.gitignore` (e.g., `node_modules/`, local env files, build output).  
5. Add a short **README Incident Log** (see below) so future reviewers understand any odd merge diffs.  
6. Optional: pre‑commit checks (Biome/Prettier), and a local “smoke test” script before pushes.

---

## 6) Current state & next steps
- **Current state (Sep 10):** Functional landing, search, venue details, auth‑guarded profile, manager pages, deploy config, and image/UX improvements; incident clean‑up in progress through “registry error.” [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)  
- **Next steps (suggested):**
  - Stabilize **media carousel** (new `styles/components/media` implementation) and unify it with existing components. [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)  
  - Add **integration tests** for booking, profile edit, and create‑venue happy paths.  
  - Add **error boundary & loading skeletons** across all routes.  
  - Consider **React Query** or SWR for caching/server‑state if desired (not required, optional).  
  - Performance pass on Home/Landing images after recovery.

---

## 7) Appendix — commit index (quick links)
- Aug 29: [[be5838c]](https://github.com/Runeov/Exam-holidaze/commit/be5838c), [[84bee78]](https://github.com/Runeov/Exam-holidaze/commit/84bee78)  
- Aug 30: [[0c99043]](https://github.com/Runeov/Exam-holidaze/commit/0c99043), [[d601640]](https://github.com/Runeov/Exam-holidaze/commit/d601640), [[6e98911]](https://github.com/Runeov/Exam-holidaze/commit/6e98911), [[1b825a2]](https://github.com/Runeov/Exam-holidaze/commit/1b825a2), [[3eb1be8]](https://github.com/Runeov/Exam-holidaze/commit/3eb1be8)  
- Aug 31: [[24bea8f]](https://github.com/Runeov/Exam-holidaze/commit/24bea8f), [[67e54a9]](https://github.com/Runeov/Exam-holidaze/commit/67e54a9), [[6363523]](https://github.com/Runeov/Exam-holidaze/commit/6363523), [[e8b7e01]](https://github.com/Runeov/Exam-holidaze/commit/e8b7e01), [[f553350]](https://github.com/Runeov/Exam-holidaze/commit/f553350), [[7c1ceaf]](https://github.com/Runeov/Exam-holidaze/commit/7c1ceaf), [[bc10119]](https://github.com/Runeov/Exam-holidaze/commit/bc10119), [[0dbd68a]](https://github.com/Runeov/Exam-holidaze/commit/0dbd68a), [[10a54d3]](https://github.com/Runeov/Exam-holidaze/commit/10a54d3)  
- Sep 1: [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c), [[7ee3b8c]](https://github.com/Runeov/Exam-holidaze/commit/7ee3b8c)  
- Sep 2: [[b1b2838]](https://github.com/Runeov/Exam-holidaze/commit/b1b2838)  
- Sep 4: [[be9d5b8]](https://github.com/Runeov/Exam-holidaze/commit/be9d5b8), [[ed4b015]](https://github.com/Runeov/Exam-holidaze/commit/ed4b015), [[bb2e868]](https://github.com/Runeov/Exam-holidaze/commit/bb2e868)  
- Sep 7: [[9f75b42]](https://github.com/Runeov/Exam-holidaze/commit/9f75b42)  
- Sep 8–10: [[770492f]](https://github.com/Runeov/Exam-holidaze/commit/770492f), [[c0ca831]](https://github.com/Runeov/Exam-holidaze/commit/c0ca831), [[0e6cf9f]](https://github.com/Runeov/Exam-holidaze/commit/0e6cf9f), [[24fc1b8]](https://github.com/Runeov/Exam-holidaze/commit/24fc1b8), [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)

