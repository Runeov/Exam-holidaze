# Holidaze (v.0)

A modern front end for **Holidaze** built with **React + Vite + Tailwind**, featuring a clean API layer, manager tools, and public user profiles.

---

## Table of Contents

* [Overview](#overview)
* [Demo / Status](#demo--status)
* [Tech Stack](#tech-stack)
* [Quick Start](#quick-start)
* [Architecture](#architecture)
* [Features (v.0)](#features-v0)
* [Routes](#routes)
* [API Conventions & Flags](#api-conventions--flags)
* [Workflow & Conventions](#workflow--conventions)
* [Testing Guide](#testing-guide)
* [Roadmap](#roadmap)
* [Changelog](#changelog)

---

## Overview

We’re shipping Holidaze in **small vertical slices**: *build → test → refactor → commit*. The goal is a fast, reliable client with a modular API layer and a friendly UX for both guests and venue managers.

> **Current milestone:** `v.0` — Auth core, Create Venue flow, Manager dashboard, Public user profiles, Host link in Venue Details.

---

## Demo / Status

* Local development: `npm run dev`
* API: [https://v2.api.noroff.dev](https://v2.api.noroff.dev)
* No env vars required for v.0 (API base is hard-coded in the HTTP client).

---

## Tech Stack

* **React** (Vite) — SPA with React Router
* **Tailwind CSS** — utility-first styling
* **Axios** — API client with interceptors
* **React Router** — routing (`/`, `/venues`, `/venues/:id`, `/profile`, `/users/:name`, etc.)

---

## Quick Start

```bash
# Node 20+ recommended
npm i
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> You’ll need a Noroff student account to log in (e.g., `*@stud.noroff.no`). The client auto-creates an API key post-login.

---

## Architecture

```
src/
  api/
    http.js        # axios instance (+ interceptors attach Authorization + X-Noroff-API-Key)
    auth.js        # register, login, create API key
    venues.js      # list, details, create, update, delete, my-venues
    bookings.js    # create, get profile bookings, update, delete
    profiles.js    # get profile (with flags), update profile
  components/      # VenueForm, EditVenueModal, EditBookingModal, NavBar, etc.
  context/
    AuthContext.jsx# session hydration, doLogin/doRegister/logout, profile state
  pages/
    HomePage.jsx
    LoginPage.jsx
    RegisterPage.jsx
    VenuesPage.jsx
    VenueDetailsPage.jsx
    ProfilePage.jsx
    CreateVenuePage.jsx
    MyVenuesPage.jsx
    UserProfilePage.jsx   # public profile /users/:name
  utils/
    session.js     # read/write/clear session (localStorage)
    storage.js     # (optional) general storage helpers
  App.jsx
  main.jsx
```

**HTTP Client (`api/http.js`)**

* Single axios instance with request interceptor:

  * Injects `Authorization: Bearer <token>`
  * Injects `X-Noroff-API-Key: <key>`
  * Sets `Content-Type: application/json`

---

## Features (v.0)

### Authentication

* Register/Login with Noroff v2 API
* **API key** is created after login and persisted
* Session is saved; UI rehydrates on refresh

### Venues

* **Create Venue** (`/venues/create`) via reusable `VenueForm`
* **Venue Details** shows rating, images, description, **Host** section linking to `/users/:name`
* **Manager Dashboard** (`MyVenuesPage`):

  * Card with image, name/desc, bookings count
  * **Upcoming bookings** (future only) with date range, guest count, and **customer link** → `/users/:name`
  * **Edit Venue (modal)** and **Delete Venue** actions
  * Card click-through to `
    /venues/:id`
* **Navbar** shows **Create Venue** button for `venueManager=true`

### Profiles

* **Public User Profile** (`/users/:name`): avatar, **email**, bio
* **Bookings** split into **Upcoming** and **Past**, with links to venue
* If venue manager: list **Venues** with links to details

### Bookings

* **EditBookingModal** available from manager view for quick changes (preflight overlap check retained)
* Cancellation supported via `deleteBooking`

---

## Routes

* `/` — Home
* `/login`, `/register`
* `/venues` — Listing
* `/venues/:id` — Details (requires `_owner=true&_bookings=true`)
* `/venues/create` — Create Venue (manager only UI entry point)
* `/profile` — My Profile (+ embedded **My Venues** for managers)
* `/users/:name` — Public profile page

---

## API Conventions & Flags

> Noroff v2 does not return all expansions by default. Use flags.

* **Profiles**: `_holidaze=true` to include Holidaze fields (e.g., `venueManager`, `avatar`, `banner`)
* **Venues (details)**: `_owner=true&_bookings=true`
* **My Venues**: `GET /holidaze/profiles/:name/venues?_bookings=true`
* **My Bookings**: `GET /holidaze/profiles/:name/bookings?_venue=true` (and `_customer=true` when you need customer info)

---

## Workflow & Conventions

### Goal & Strategy

Build a modern front end with a modular API layer. Ship **small vertical slices**: build → test → refactor → commit.

### Branching & Commits

* Feature branches, e.g. `feat/auth-core`
* **Conventional Commits**: `feat(profile): …`, `refactor(api): …`, `chore(cleanup): …`
* Open PRs per vertical slice; avoid unrelated scope creep

### Completed Milestones (from working log)

* **M1 — Bootstrap**: Vite + React, Tailwind, base pages
* **M2 — Auth foundation**: Noroff v2 login/register, API key persistence
* **M3 — API layer refactor**: axios client, interceptors, split modules
* **M4 — Profile bookings**: `/profile` upcoming bookings with `_venue=true`
* **M5 — Navbar + Auth integration**: reactive login/logout UI
* **M6 — Bookings API expansion**: create/get/update/delete
* **M7 — Profile API**: `getProfile`, `updateProfile`
* **M8 — Cleanup**: standardized error handling, removed debug logs

---

## Testing Guide

### Auth

1. Register (manager optional) → Login
2. Confirm `token` and `apiKey` in localStorage; interceptor attaches headers

### Venue creation

1. Go to **/venues/create** (visible if manager)
2. Submit valid image URL (publicly accessible) and required fields
3. Expect redirect to **/venues/\:id**

### Manager dashboard

1. Open **Profile** → **My Venues**
2. See cards with image/desc/bookings count
3. Click **Edit Venue** (modal), save changes → card updates
4. Click **Delete** → card removed
5. **Upcoming bookings** show customer names; click-through to `/users/:name`

### Public profile

1. Visit `/users/:name`
2. Verify avatar, **email**, bio, **Upcoming/Past** bookings and venues (if manager)

### Venue details

1. Verify **Hosted by \[name]** linking to `/users/:name`
2. (If calendar present) booked dates are blocked

---

## Roadmap

* Protected routing (redirect non-authed users)
* Booking calendar polish + price/nights summary
* Delete booking action in manager view
* Pagination & filters for venues
* Copy-to-clipboard for user email
* More robust empty & error states

---

## Changelog

### v.0

* Create Venue flow with shared `VenueForm`
* Manager **My Venues** dashboard (cards, upcoming bookings, edit/delete)
* Public **User Profile** (`/users/:name`) with **email**, venues, upcoming/past bookings
* Venue Details: **Host** link to public profile
* Navbar shows **Create Venue** for venue managers
* Login form fix and API param tweaks (`_holidaze`, `_owner`, `_bookings`, `_venue`, `_customer`)

---

## Contributing

* Use Conventional Commits
* Keep changes scoped; one vertical slice per PR
* Add tests/notes in PR description for manual QA steps

---

## License

MIT (or project-specific)
