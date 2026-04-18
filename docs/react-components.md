# React component hierarchy — Wav3Mind

Conventions: functional components, one **error boundary** per top-level route (Requirement 13). Copy uses **client** / **user**, never prohibited wellness terms.

---

## Phase 1 — Video assessment (`AssessmentView`)

Root container for the 60-second movement capture and MediaPipe pipeline.

```
AssessmentView
├── AssessmentHeader          // title, progress, regulatory-safe helper text
├── CameraCapture             // getUserMedia, preview, record up to 60s, stop
│   ├── VideoPreview
│   └── RecordControls        // start / stop / timer
├── PoseOverlay               // optional: draw landmarks on <canvas> over video
├── ProcessingState           // spinner / “computing movement insights…”
├── AsymmetryResults          // joint bars, Sun/Moon placement suggestions
│   ├── JointScoreList
│   └── PadPlacementCards     // Sun pad / Moon pad visuals
├── SubmitAssessment          // POST /api/generate-protocol; shows retry on error
└── AssessmentErrorBoundary   // catches render errors in subtree
```

**Data flow:** `CameraCapture` → recorded frames / stream → `PoseOverlay` + MediaPipe `Pose_Estimator` → asymmetry JSON → `AsymmetryResults` → `SubmitAssessment` with optional wearable fields.

---

## Phase 3 — Client recovery (`RecoveryDashboard`)

Gamified client view: recovery score, streaks, XP/level, before/after.

```
RecoveryDashboard
├── RecoveryHeader
├── ScoreCard                 // daily Recovery_Score + date
├── StreakTracker             // mobility streak calendar or count
├── XpLevelDisplay            // XP bar, level label, “next milestone”
├── BeforeAfterComparison     // chart or side-by-side asymmetry snapshot
│   ├── AsymmetrySparkline
│   └── SnapshotLegend
├── SessionHistoryList        // optional: recent sessions timeline
├── FirebaseListenerProvider  // context: unsub on unmount
└── RecoveryErrorBoundary
```

Subscribe to Firestore (`users`, `engagement`, `recoveryScores`, `asymmetrySnapshots`) per [firebase-schema.md](firebase-schema.md).

---

## Phase 3 — Practitioner dashboard (`PractitionerDashboard`)

```
PractitionerDashboard
├── PractitionerHeader
├── ClientList                // sortable list: name, last score, streak, level
│   └── ClientRow             // navigates to detail / expands inline trends
├── ClientTrendChart          // Recovery_Score over time; one client selected
├── RealTimeIndicator         // “Live sync” / Firebase connection state
├── FiltersToolbar            // optional: date range, search
└── PractitionerErrorBoundary
```

**Data flow:** auth claims → `GET /api/clients` seed → Firestore listeners for live updates; charts may combine API history and listener patches.

---

## Shared / cross-cutting

| Component | Responsibility |
|-----------|----------------|
| `AppShell` | layout, theme, routing |
| `ProtectedRoute` | requires Firebase auth |
| `LoadingFallback` | suspense / lazy chunks |
| `WellnessCopy` | centralize static strings to audit banned terms |

---

## Related files

- [requirements.md](requirements.md) — Requirement 13
- [api-spec.md](api-spec.md)
- [firebase-schema.md](firebase-schema.md)
