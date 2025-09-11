## 🛠️ Sync Incident (OneDrive) — September 2025

**What happened (short version).** I moved the project to **`C:\dev\Exam-holidaze`** at the first sign of sync trouble, but I didn’t delete the old copy under my OneDrive folder. When the cloud quota filled up, OneDrive started behaving unpredictably: certain “register/registry error” files were **overwritten**, and some caches were **deleted**. Git’s own cache wasn’t touched, so the UI didn’t always show what had changed. This created **odd merges** and **surprising reverts** (files snapping back to older content). Node tooling had also been installed under OneDrive, which amplified the interference.

**Visible in Git history around the cleanup window:**
- **Moved to `C:\dev` / Tailwind setup** (Sep 1): [[28afc4c]](https://github.com/Runeov/Exam-holidaze/commit/28afc4c)  
- **File recovery** (Sep 8): [[770492f]](https://github.com/Runeov/Exam-holidaze/commit/770492f)  
- **Follow‑up cleanups (“madness”)** (Sep 8): [[c0ca831]](https://github.com/Runeov/Exam-holidaze/commit/c0ca831)  
- **“registry error.” fix, media carousel placed under `styles/components/media`** (Sep 10): [[2f9d488]](https://github.com/Runeov/Exam-holidaze/commit/2f9d488)

> **Note:** OneDrive’s internal actions are not visible from Git; this log captures my local observations, aligned with the cleanup commits above.

**What I changed immediately**
- Treat **`C:\dev\Exam-holidaze`** as the *only* working copy.
- Unsynced/removed any shadow project folders under OneDrive.
- Ensured **Node/npm/pnpm caches & global installs** are *not* under OneDrive.
- Tightened `.gitignore` and verified build/test locally before pushing.

**How to avoid this next time**
- Keep code outside cloud‑sync roots.
- Don’t co‑locate Node or package caches with a cloud‑synced home directory.
- Add pre‑commit checks (Biome/Prettier/tests) and a short smoke‑test script.
