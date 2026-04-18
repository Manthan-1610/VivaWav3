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
