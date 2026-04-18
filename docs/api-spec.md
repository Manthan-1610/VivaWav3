# Express API specification — ViVaWav3

Base URL: `https://<host>/api` (no trailing slash on routes below).

Authentication (recommended for demo): `Authorization: Bearer <Firebase ID token>` for `GET /clients` and scoped `GET /recovery/:userId`. For local hacking, middleware may be stubbed.

All JSON bodies use **camelCase**. User-facing error `message` strings must use approved wellness wording (see [requirements.md](requirements.md)).

---

## POST `/generate-protocol`

**Aliases:** `POST /assessment` — same body and response.

Generates a **Hardware_Protocol** via Gemini, validates it, optionally persists session/recovery data, and returns ElevenLabs audio URL (or fallback).

### Request headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | Recommended | Bearer token |

### Request body

```json
{
  "userId": "client_firebase_uid",
  "practitionerId": "practitioner_firebase_uid",
  "asymmetry": {
    "jointScores": {
      "leftKnee": 0.12,
      "rightKnee": 0.18
    },
    "dominantSide": "right",
    "padPlacementSuggestion": {
      "sun": "lower_back",
      "moon": "hamstrings_right"
    },
    "landmarkSnapshot": {}
  },
  "wearables": {
    "hrv": 45.2,
    "strain": 12.4,
    "sleepQuality": 72,
    "activity": 8400
  },
  "metadata": {
    "sessionLabel": "morning_recovery"
  }
}
```

**Required fields**

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Client id. |
| `practitionerId` | string | Practitioner id. |
| `asymmetry` | object | At least joint or pad suggestions from MediaPipe pipeline. |
| `wearables` | object | May include partial data; omit keys or use `null` for unknown. |

### Success response `200 OK`

```json
{
  "hardwareProtocol": { },
  "voiceAudio": {
    "url": "https://storage.example.com/breathing-session-abc.mp3",
    "fallback": false,
    "durationSeconds": 540
  },
  "sessionId": "sess_01JXYZ",
  "validation": {
    "source": "gemini",
    "attempts": 1
  }
}
```

`hardwareProtocol` conforms to [hardware-protocol.schema.json](hardware-protocol.schema.json).

### Error responses

| Code | Condition | Body shape |
|------|-----------|------------|
| `400` | Missing required fields, bad types | `{ "error": "validation_error", "message": "…", "details": [] }` |
| `502` | Gemini unavailable after retries; still returns fallback in optional extension | If returning fallback with `200`, document `validation.source: "fallback"`. |
| `500` | Unhandled server error | `{ "error": "internal_error", "message": "…" }` |

---

## GET `/recovery/:userId`

Returns daily recovery scores for charts (newest first).

### Response `200 OK`

```json
{
  "userId": "client_firebase_uid",
  "entries": [
    {
      "date": "2026-04-18",
      "score": 82,
      "sessionIds": ["sess_1"]
    }
  ]
}
```

### Errors

| Code | Condition |
|------|------------|
| `400` | Invalid `userId` format |
| `403` | Caller not allowed to read this user |
| `404` | User has no scores yet (may return `200` with `entries: []` instead) |

---

## GET `/clients`

Lists clients for the **authenticated practitioner**.

### Response `200 OK`

```json
{
  "practitionerId": "practitioner_firebase_uid",
  "clients": [
    {
      "userId": "client_uid",
      "displayName": "Alex Chen",
      "lastRecoveryScore": 78,
      "scoreDate": "2026-04-17",
      "mobilityStreakDays": 4,
      "level": 2
    }
  ]
}
```

### Errors

| Code | Condition |
|------|------------|
| `401` | Missing or invalid token |
| `403` | Role is not practitioner |

---

## Voice coaching note

Text-to-speech runs **inside** `POST /generate-protocol` after a valid protocol is produced (see Requirement 6). A separate `POST /voice-coaching` endpoint is **optional** and not required for MVP parity with the sprint requirements.

---

## Related files

- [gemini-system-prompt.md](gemini-system-prompt.md)
- [hardware-protocol.schema.json](hardware-protocol.schema.json)
