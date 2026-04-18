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
| [frontend/](frontend/) | React (Vite + TypeScript) — UI shells only |
| [server/](server/) | Express (TypeScript) — API route stubs (`501` until implemented) |

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

Copy `server/.env.example` to `server/.env` if you need to override `PORT`.
