# Firebase schema — ViVaWav3

**Choice for this sprint:** Use **Cloud Firestore** as the primary database. It supports indexed queries (for example “clients for practitioner `X`”) and scales better for per-client trend charts than a large nested JSON tree in Realtime Database. **Firebase Realtime Database** remains valid for simple demos; an equivalent tree is shown at the end for reference.

Security rules (high level):

- Clients read/write only documents keyed by their own `uid` (profile, own sessions, own streaks, own XP).
- Practitioners read aggregates for `clientIds[]` they own; writes to session completion may be server-only (Admin SDK from Express) in production.
- For hackathon demos, use Firebase Auth custom claims or a simple `practitionerId` on user docs and enforce in rules.

---

## Firestore collections

### `users/{uid}`

User profile and role.

| Field | Type | Description |
|--------|------|-------------|
| `displayName` | string | Shown in dashboards. |
| `role` | string | `"practitioner"` \| `"client"`. |
| `practitionerId` | string \| null | Set for clients; FK to their practitioner’s `uid`. |
| `clientIds` | array of string | Set for practitioners; list of linked client `uid`s. |
| `createdAt` | timestamp | Account creation. |

**Example document**

```json
{
  "displayName": "Jamie Rivers",
  "role": "client",
  "practitionerId": "pract_uid_123",
  "createdAt": "2026-04-18T12:00:00.000Z"
}
```

---

### `sessions/{sessionId}`

One row per completed or in-progress session (server writes on completion).

| Field | Type | Description |
|--------|------|-------------|
| `userId` | string | Client `uid`. |
| `practitionerId` | string | Owning practitioner. |
| `startedAt` | timestamp | Session start. |
| `endedAt` | timestamp \| null | Session end. |
| `durationSeconds` | number | Actual or planned duration. |
| `asymmetrySummary` | map | Snapshot of asymmetry scores / regions (same shape as API). |
| `wearables` | map | `hrv`, `strain`, `sleepQuality`, `activity` (numbers or nulls). |
| `hardwareProtocol` | map | Validated `Hardware_Protocol` object. |
| `recoveryScoreComputed` | number \| null | Daily score contribution if computed server-side. |

---

### `recoveryScores/{docId}`

Daily score rows; `docId` can be `{userId}_{yyyy-mm-dd}` for idempotency.

| Field | Type | Description |
|--------|------|-------------|
| `userId` | string | Client `uid`. |
| `date` | string | `YYYY-MM-DD`. |
| `score` | number | 0–100. |
| `sessionIds` | array of string | Contributing sessions. |

---

### `engagement/{userId}` (optional single doc per client)

Gamification: streaks, XP, level (mirrors requirements).

| Field | Type | Description |
|--------|------|-------------|
| `mobilityStreakDays` | number | Consecutive days with ≥1 session. |
| `lastSessionDate` | string | `YYYY-MM-DD` in practitioner’s or UTC calendar (document the choice in code). |
| `xpTotal` | number | Cumulative experience points. |
| `level` | number | Derived from `xpTotal` via fixed thresholds. |
| `xpToNextLevel` | number | Optional cache for UI. |

**Example**

```json
{
  "mobilityStreakDays": 5,
  "lastSessionDate": "2026-04-17",
  "xpTotal": 420,
  "level": 3,
  "xpToNextLevel": 80
}
```

---

### `asymmetrySnapshots/{id}` (optional)

Store “before” / “after” landmark summaries for Phase 3 visuals without replaying video.

| Field | Type | Description |
|--------|------|-------------|
| `userId` | string | |
| `capturedAt` | timestamp | |
| `label` | string | `"before"` \| `"after"` or session id reference |
| `jointScores` | map | Serialized asymmetry metrics for charts |

---

## Indexes (Firestore)

Composite examples:

- `sessions`: `practitionerId` ASC, `startedAt` DESC — list recent sessions per practitioner.
- `recoveryScores`: `userId` ASC, `date` DESC — trend charts.

---

## Realtime Database JSON tree (alternative)

If using RTDB for the hackathon:

```text
/users/{uid}/profile        → displayName, role, practitionerId, clientIds[], createdAt
/users/{uid}/engagement     → mobilityStreakDays, lastSessionDate, xpTotal, level
/sessions/{sessionId}       → userId, practitionerId, timestamps, asymmetrySummary, wearables, hardwareProtocol
/recoveryScores/{userId}/{date}  → score, sessionIds[]
```

Prefer shallow writes and Cloud Functions or Express (Admin SDK) to update scores and XP atomically.

---

## Related files

- [hardware-protocol.schema.json](hardware-protocol.schema.json)
- [api-spec.md](api-spec.md)
