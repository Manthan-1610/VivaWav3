# ViVaWav3

**ViVaWav3** is the autonomous wellness agent for the Hydrawav3 platform (GlobeHack Season 1 — Recovery Intelligence track). It covers **assessment** (MediaPipe movement insights), **in-session personalization** (Express + Gemini + ElevenLabs), and **outcome continuity** (Firebase-backed recovery scores, streaks, XP/level, practitioner trends).

## Documentation

| Document | Description |
|----------|-------------|
| [docs/requirements.md](docs/requirements.md) | Full requirements and acceptance criteria |
| [docs/firebase-schema.md](docs/firebase-schema.md) | Firestore / Realtime Database shapes |
| [docs/api-spec.md](docs/api-spec.md) | Express routes and JSON payloads |
| [docs/gemini-system-prompt.md](docs/gemini-system-prompt.md) | Gemini system prompt for Hardware_Protocol JSON |
| [docs/react-components.md](docs/react-components.md) | Phase 1 and Phase 3 React component trees |
| [docs/hardware-protocol.schema.json](docs/hardware-protocol.schema.json) | JSON Schema for `Hardware_Protocol` validation |

## Stack (sprint)

React · Express.js · Firebase (Firestore or Realtime Database) · Gemini · ElevenLabs · MediaPipe (browser)

## Philosophy

The body supports its own recovery; the practitioner guides; the platform empowers.

## Project layout

| Path | Role |
|------|------|
| [frontend/](frontend/) | React (Vite + TypeScript) — assessment UI + dashboards |
| [server/](server/) | Express (TypeScript) — `/api/generate-protocol`, health, optional Firebase writes |

### Assessment → protocol (`POST /api/generate-protocol`)

Validates the request body, calls **Gemini** when `GEMINI_API_KEY` is set (otherwise a safe fallback protocol from [server/src/services/fallbackProtocol.ts](server/src/services/fallbackProtocol.ts)), synthesizes voice with **ElevenLabs** when `ELEVENLABS_API_KEY` is set (otherwise a fallback URL from env or demo MP3), and optionally writes **`sessions`** to **Firestore** when `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_PATH` are set. The assessment page posts to this endpoint after building the movement snapshot (Vite proxies `/api` in dev).

### Auth (Firebase) & roles

- **Sign up / sign in:** [frontend/src/pages/RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx) and [frontend/src/pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx) use **Firebase Auth** (email/password).
- **Profiles:** On registration, a Firestore doc is created at `users/{uid}` with `displayName`, `role` (`practitioner` | `client`), and `createdAt` — aligned with [docs/firebase-schema.md](docs/firebase-schema.md).
- **Routing:** Practitioners default to **`/assessment`** and can open **`/practitioner`**. Clients default to **`/recovery`**. Routes are guarded in [frontend/src/auth/ProtectedRoute.tsx](frontend/src/auth/ProtectedRoute.tsx).
- **Passwords (expected behavior):** Firebase **Authentication** stores credentials using Google’s identity backend (hashed; never plaintext). **Firestore does not and should not store passwords** — that would be unsafe. Only profile fields like `displayName` and `role` live in `users/{uid}`.
- **Sign-in 400 errors:** In Firebase Console → **Authentication** → **Sign-in method**, enable **Email/Password**. Wrong email/password or a restricted API key can also return 400 from `signInWithPassword`.
- **Firestore rules:** Allow authenticated users to read/write their own `users/{uid}` document in development; tighten for production (e.g. role changes only via Admin SDK).

## Run locally

From the repo root (required so the `server` workspace and `dotenv` install correctly):

```bash
npm install
npm run dev
```

Do not skip `npm install` at the root; installing only inside `frontend/` leaves the `server` workspace unlinked and APIs will fail to resolve dependencies such as `dotenv`.

- Web UI: [http://localhost:5173](http://localhost:5173) (proxies `/api` to the API)
- API: [http://localhost:3001](http://localhost:3001) — health check: `GET /health`

Build:

```bash
npm run build
```

Environment templates (copy to `.env` / `.env.local` and fill in; never commit secrets):

- [server/.env.example](server/.env.example) — `PORT`, Gemini, ElevenLabs, Firebase Admin, Hydrawav3 API, fallbacks
- [frontend/.env.example](frontend/.env.example) — `VITE_*` Firebase client config and API base URL

**Firebase `auth/invalid-api-key` on the frontend:** the browser must use the **Web app** config from Firebase Console (Project settings → Your apps → Web). Do not paste the Admin SDK private key or other API keys into `VITE_FIREBASE_API_KEY`. Put vars in **`frontend/.env.local`**, keep the `VITE_` prefix, then **restart** `npm run dev` (Vite only reads env at startup).
