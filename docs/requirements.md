# Requirements Document

## Introduction

**ViVaWav3** is an autonomous wellness agent for the Hydrawav3 platform, designed to close three recovery intelligence gaps: pre-session assessment, in-session personalization, and post-session outcome continuity. The system spans a React frontend, an Express.js backend, Firebase state sync, Gemini API reasoning, ElevenLabs voice coaching, and MediaPipe client-side pose estimation. This is a 24-hour hackathon sprint (GlobeHack Season 1, Recovery Intelligence track) targeting high-volume practitioners serving 60–80 clients per day with under two minutes of touch time per client.

**Regulatory Note:** Hydrawav3 is a wellness platform. All language, UI copy, data models, and code comments must use approved wellness terminology exclusively. Prohibited terms include: medical device, clinical, diagnostic, treats, cures, diagnoses, heals, reduces inflammation, patient, replaces the practitioner (and equivalent claims). Approved terms include: recovery, wellness, mobility, performance, supports, empowers, enhances, supports inflammation management. Use **client** or **user** in identifiers, comments, and user-facing copy for consistency and judging safety.

**Know → Act → Learn:** ViVaWav3 maps to the Hydrawav3 flywheel as **Know** (camera-based movement assessment and asymmetry signals), **Act** (personalized hardware protocol plus voice-guided breathing from the Express backend), **Learn** (Firebase-backed recovery scores, streaks, XP/levels, and practitioner-side trends that compound over time).

## Organizer-provided resources (GlobeHack build phase)

During the sprint, organizers may provide (availability and timing per workshop):

- **Digital:** Live Hydrawav3 API access and documentation (credentials at the Saturday workshop); mock session logs and client profile datasets; body movement video library for computer vision work; wearable data samples (HRV, strain, sleep quality, activity); Sun and Moon pad placement logic and decision trees; approved wellness terminology and regulatory guardrails; starter kit items including configurable protocol parameters, sample asymmetry clips, mock wearables, mock session logs, client personas, placement documentation, an HRV-based protocol decision-tree example, and engagement benchmarks for health-app UX.
- **Physical:** Limited Hydrawav3 devices for hands-on testing on a rotating schedule; live device demonstration (workshop schedule, for example ~3:30 PM Saturday); office hours with Hydrawav3 team members.

## Optional stretch goals (non-binding for the 24-hour MVP)

These are encouraged enhancements if time permits: AR overlay with red and blue placement zones; fuller 3D kinetic chain visualization; integration with existing movement screening, ROM, or posture analysis tools to tighten the assess → act → re-check loop.

## Glossary

- **ViVaWav3**: The autonomous wellness agent system encompassing assessment, personalization, and outcome continuity phases.
- **Hydrawav3**: The hands-off wellness technology platform built on Polar Water Resonance (PWR) that delivers thermal modulation, photobiomodulation, and resonance-based mechanical stimulation.
- **Assessment_View**: The React frontend component that captures body movement video and runs MediaPipe pose estimation to detect kinematic asymmetry.
- **Pose_Estimator**: The client-side MediaPipe module that processes video frames to extract body landmark coordinates and compute asymmetry scores.
- **Protocol_Engine**: The Express.js backend routes that accept asymmetry and wearable data, prompt the Gemini API, and return a hardware configuration payload (and trigger voice coaching).
- **Voice_Coach**: The backend service that calls the ElevenLabs API to generate synchronous voice-guided breathing audio files.
- **Recovery_Dashboard**: The React client view displaying daily recovery scores, mobility streaks, XP/levels, and before/after visual feedback for individual clients.
- **Practitioner_Dashboard**: The React view that pulls real-time syncs from Firebase to display recovery trends across the practitioner’s client base.
- **Firebase_Store**: The Firebase Realtime Database or Firestore instance used for persisting user profiles, session records, and recovery scores.
- **Gemini_API**: The Google Gemini large language model API used as the reasoning and recommendation engine.
- **ElevenLabs_API**: The ElevenLabs text-to-speech API used to generate voice coaching audio.
- **Sun_Pad**: One of the two Hydrawav3 hardware pads delivering thermal, light, and vibro-acoustic modalities.
- **Moon_Pad**: The second Hydrawav3 hardware pad, complementary to the Sun_Pad.
- **Asymmetry_Score**: A numeric value derived from MediaPipe landmark comparison between left and right body segments, representing kinematic imbalance.
- **Hardware_Protocol**: A strict JSON object specifying modality mix, intensity levels, sequence, duration, and pad placements for a Hydrawav3 session.
- **Recovery_Score**: A daily numeric wellness metric computed from session data, wearable inputs, and mobility trends.
- **HRV_Data**: Heart rate variability data from mock wearable inputs, used as a physiological signal for protocol personalization.
- **Strain_Data**: Physical strain metrics from mock wearable inputs, representing exertion levels.
- **Sleep_Quality_Data**: Mock wearable signal (for example 0–100 or categorical) representing perceived or sampled sleep quality for personalization context.
- **Activity_Data**: Mock wearable signal (for example steps, load score, or minutes) representing recent activity load.
- **XP**: Experience points earned by the client for completed wellness sessions, driving engagement and level progression.
- **Level**: A discrete engagement tier derived from cumulative XP using deterministic thresholds.

## Requirements

### Requirement 1: Camera-Based Body Movement Capture

**User Story:** As a practitioner, I want to capture a client's body movement via a 60-second video in the browser, so that the system can assess kinematic asymmetry without manual observation.

#### Acceptance Criteria

1. WHEN the practitioner initiates an assessment, THE Assessment_View SHALL activate the device camera and display a live video preview within the browser.
2. WHEN the practitioner starts recording, THE Assessment_View SHALL capture up to 60 seconds of body movement video.
3. WHEN the recording completes or the practitioner stops recording early, THE Assessment_View SHALL pass the captured video frames to the Pose_Estimator for processing.
4. IF the device camera is unavailable or permission is denied, THEN THE Assessment_View SHALL display a descriptive error message and offer a retry option.

### Requirement 2: MediaPipe Pose Estimation and Asymmetry Detection

**User Story:** As a practitioner, I want the system to automatically detect kinematic asymmetry from the captured video, so that I can skip manual assessment and save touch time.

#### Acceptance Criteria

1. WHEN video frames are received, THE Pose_Estimator SHALL extract body landmark coordinates using MediaPipe pose estimation running client-side in the browser.
2. WHEN body landmarks are extracted, THE Pose_Estimator SHALL compare left and right body segment positions to compute an Asymmetry_Score for each tracked joint pair.
3. WHEN Asymmetry_Scores are computed, THE Pose_Estimator SHALL output optimal Sun_Pad and Moon_Pad placement recommendations based on the detected asymmetry regions.
4. IF the Pose_Estimator cannot detect a human pose in the video frames, THEN THE Assessment_View SHALL display a guidance message prompting the practitioner to reposition the client.
5. THE Pose_Estimator SHALL complete all landmark extraction and asymmetry computation within 10 seconds of receiving the final video frame.

### Requirement 3: Asymmetry Data Serialization and Transmission

**User Story:** As a developer, I want the asymmetry assessment results serialized as JSON and sent to the backend, so that the Protocol_Engine can generate a personalized session.

#### Acceptance Criteria

1. WHEN the Pose_Estimator completes asymmetry computation, THE Assessment_View SHALL serialize the Asymmetry_Scores, pad placement recommendations, and landmark data into a JSON payload.
2. WHEN the JSON payload is ready, THE Assessment_View SHALL transmit the payload to the Protocol_Engine via **HTTP POST** to **`/api/generate-protocol`** (canonical). THE server MAY also accept the same payload at **`/api/assessment`** as a backward-compatible alias.
3. THE JSON serializer SHALL format Asymmetry_Score objects such that serializing then deserializing produces an equivalent object (round-trip property).
4. IF the HTTP POST request to the Protocol_Engine fails, THEN THE Assessment_View SHALL display an error message and allow the practitioner to retry submission.

### Requirement 4: In-Session Protocol Generation via Gemini API

**User Story:** As a practitioner, I want the system to translate asymmetry and wearable data into a personalized Hydrawav3 hardware protocol, so that each session is optimized for the individual client.

#### Acceptance Criteria

1. WHEN the Protocol_Engine receives asymmetry data and mock wearable data (**HRV_Data**, **Strain_Data**, **Sleep_Quality_Data**, **Activity_Data**), THE Protocol_Engine SHALL construct a prompt containing the asymmetry scores, pad placements, and those wearable fields (missing fields MAY default to null or safe mock defaults for the sprint).
2. WHEN the prompt is constructed, THE Protocol_Engine SHALL send the prompt to the Gemini_API with a system prompt that enforces strict JSON output conforming to the Hardware_Protocol schema.
3. WHEN the Gemini_API returns a response, THE Protocol_Engine SHALL validate the response against the Hardware_Protocol JSON schema before forwarding the protocol to the client.
4. THE Hardware_Protocol JSON schema SHALL specify: modality mix (thermal, photobiomodulation, vibro-acoustic), intensity levels (numeric), sequence order, total duration (targeting an average of 9 minutes), and Sun_Pad and Moon_Pad placements.
5. IF the Gemini_API returns an invalid or unparseable response, THEN THE Protocol_Engine SHALL retry the request up to 2 additional times before returning a fallback default protocol.
6. IF the Gemini_API is unreachable, THEN THE Protocol_Engine SHALL return a fallback default Hardware_Protocol and log the connectivity failure.

### Requirement 5: Hardware Protocol JSON Parsing and Validation

**User Story:** As a developer, I want robust parsing and validation of the Hardware_Protocol JSON, so that malformed AI outputs never reach the hardware layer.

#### Acceptance Criteria

1. WHEN the Protocol_Engine receives a JSON string from the Gemini_API, THE Protocol_Engine SHALL parse the string into a Hardware_Protocol object.
2. THE Protocol_Engine SHALL validate that all required fields (modality mix, intensity levels, sequence, duration, pad placements) are present and within defined value ranges.
3. THE Hardware_Protocol parser SHALL produce output such that parsing then serializing then parsing again yields an equivalent Hardware_Protocol object (round-trip property).
4. IF any required field is missing or out of range, THEN THE Protocol_Engine SHALL reject the payload and apply the fallback default Hardware_Protocol.

### Requirement 6: Voice-Guided Breathing Audio Generation

**User Story:** As a practitioner, I want the system to generate real-time voice-guided breathing audio, so that clients receive synchronized coaching during their session.

#### Acceptance Criteria

1. WHEN a valid Hardware_Protocol is generated, THE Voice_Coach SHALL construct a breathing script aligned to the protocol duration and sequence.
2. WHEN the breathing script is ready, THE Voice_Coach SHALL send the script text to the ElevenLabs_API to generate an audio file.
3. WHEN the ElevenLabs_API returns the audio file, THE Voice_Coach SHALL return the audio file URL to the client alongside the Hardware_Protocol in the **same** successful response from **`POST /api/generate-protocol`** (single round-trip for the demo). A separate route such as `POST /api/voice-coaching` is optional and not required for MVP acceptance.
4. IF the ElevenLabs_API is unreachable or returns an error, THEN THE Voice_Coach SHALL return a pre-recorded fallback breathing audio file URL.
5. THE Voice_Coach SHALL complete audio generation and return the URL within 15 seconds of receiving the Hardware_Protocol.

### Requirement 7: Firebase Database Schema for Users, Sessions, and Recovery Scores

**User Story:** As a developer, I want a structured Firebase database schema for users, sessions, and recovery scores, so that all data is consistently stored and queryable.

#### Acceptance Criteria

1. THE Firebase_Store SHALL persist user profiles containing: unique user ID, display name, role (practitioner or client), and creation timestamp.
2. THE Firebase_Store SHALL persist session records containing: session ID, associated user ID, timestamp, Asymmetry_Scores, worn mock wearable snapshot (**HRV_Data**, **Strain_Data**, **Sleep_Quality_Data**, **Activity_Data** as available), Hardware_Protocol applied, and session duration.
3. THE Firebase_Store SHALL persist Recovery_Score records containing: score ID, associated user ID, date, numeric score value, and contributing session IDs. THE Firebase_Store SHALL persist **XP** totals and **Level** (or derived fields) for gamification per Requirement 9.
4. WHEN a new session completes, THE Protocol_Engine SHALL write the session record and updated Recovery_Score (and XP/level where applicable) to the Firebase_Store.
5. IF a write to the Firebase_Store fails, THEN THE Protocol_Engine SHALL retry the write up to 2 additional times and log the failure.

### Requirement 8: Daily Recovery Score Computation

**User Story:** As a client, I want to see a daily recovery score reflecting my session outcomes, so that I can track my wellness progress over time.

#### Acceptance Criteria

1. WHEN a session record is written to the Firebase_Store, THE Recovery_Dashboard SHALL compute a daily Recovery_Score from the session's Asymmetry_Scores and wearable snapshot (**HRV_Data**, **Strain_Data**, **Sleep_Quality_Data**, **Activity_Data**) when present.
2. THE Recovery_Score computation SHALL produce a numeric value between 0 and 100 inclusive.
3. WHEN the Recovery_Score is computed, THE Recovery_Dashboard SHALL display the score prominently on the client's view along with the date.
4. THE Recovery_Score computation SHALL be deterministic: identical input data SHALL produce identical scores.

### Requirement 9: Client Recovery Dashboard with Gamification

**User Story:** As a client, I want to see my mobility streaks and before/after visual feedback, so that I stay motivated and engaged with my recovery journey.

#### Acceptance Criteria

1. WHEN the client opens the Recovery_Dashboard, THE Recovery_Dashboard SHALL display the current daily Recovery_Score, a mobility streak counter (consecutive days with sessions), and a visual before/after comparison of Asymmetry_Scores.
2. WHEN the client has completed sessions on consecutive days, THE Recovery_Dashboard SHALL increment the mobility streak counter by one for each consecutive day.
3. WHEN the mobility streak is broken (a day with no session), THE Recovery_Dashboard SHALL reset the streak counter to zero.
4. THE Recovery_Dashboard SHALL fetch all displayed data from the Firebase_Store in real time using Firebase listeners.
5. WHEN a session completes, THE Recovery_Dashboard (or backend writer) SHALL award **XP** using a deterministic rule (for example fixed XP per completed session, with optional small bonuses for streak milestones) and SHALL compute **Level** from cumulative XP using fixed thresholds documented in implementation.
6. THE Recovery_Dashboard SHALL display current **XP** (or XP to next level) and **Level** using only approved wellness framing (performance journey, recovery journey—no prohibited terms).

### Requirement 10: Practitioner Dashboard with Real-Time Client Trends

**User Story:** As a practitioner, I want a dashboard showing recovery trends across my client base in real time, so that I can monitor outcomes and adjust my approach.

#### Acceptance Criteria

1. WHEN the practitioner opens the Practitioner_Dashboard, THE Practitioner_Dashboard SHALL display a list of all associated clients with their most recent Recovery_Score and mobility streak.
2. THE Practitioner_Dashboard SHALL subscribe to Firebase_Store real-time listeners so that client data updates appear without manual page refresh.
3. WHEN a client's Recovery_Score or session data changes in the Firebase_Store, THE Practitioner_Dashboard SHALL reflect the updated data within 5 seconds.
4. THE Practitioner_Dashboard SHALL display a trend visualization (chart or graph) of Recovery_Scores over time for each client.

### Requirement 11: Gemini System Prompt Specification

**User Story:** As a developer, I want a well-defined Gemini system prompt that ingests HRV and MediaPipe data and outputs parseable JSON, so that the AI reasoning layer is reliable and consistent.

#### Acceptance Criteria

1. THE Protocol_Engine SHALL include a Gemini system prompt that instructs the Gemini_API to act as a wellness protocol recommendation engine for the Hydrawav3 platform.
2. THE Gemini system prompt SHALL specify that the Gemini_API must output only valid JSON conforming to the Hardware_Protocol schema with no additional text or markdown.
3. THE Gemini system prompt SHALL include the complete Hardware_Protocol JSON schema definition with field names, types, and valid value ranges.
4. THE Gemini system prompt SHALL enforce approved wellness terminology and prohibit all restricted terms (medical device, clinical, diagnostic, treats, cures, diagnoses, heals, reduces inflammation, patient, replaces the practitioner, and equivalent claims).
5. THE Gemini system prompt SHALL instruct the Gemini_API to reason about pad placement, modality intensity, and session sequencing based on the provided Asymmetry_Scores, HRV_Data, Strain_Data, Sleep_Quality_Data, and Activity_Data.

### Requirement 12: Express.js API Route Specifications

**User Story:** As a developer, I want clearly defined Express.js API routes with request and response payloads, so that the frontend and backend integrate seamlessly.

#### Acceptance Criteria

1. THE Protocol_Engine SHALL expose **POST `/api/generate-protocol`** as the canonical endpoint that accepts a JSON body containing Asymmetry_Scores, pad placement recommendations, HRV_Data, Strain_Data, Sleep_Quality_Data, and Activity_Data, and returns a Hardware_Protocol JSON object and a voice coaching audio URL. THE server MAY expose **POST `/api/assessment`** as an alias with the same request and response shape.
2. THE Protocol_Engine SHALL expose a GET /api/recovery/:userId endpoint that returns the specified user's Recovery_Score history as a JSON array.
3. THE Protocol_Engine SHALL expose a GET /api/clients endpoint that returns a list of clients associated with the authenticated practitioner, each including the most recent Recovery_Score and mobility streak.
4. WHEN any API endpoint receives a request with missing or malformed required fields, THE Protocol_Engine SHALL return an HTTP 400 response with a descriptive error message.
5. THE Protocol_Engine SHALL validate that all API request payloads conform to their defined JSON schemas before processing.

### Requirement 13: React Component Hierarchy

**User Story:** As a developer, I want a defined React component hierarchy for the Assessment View and Practitioner Dashboard, so that the frontend is modular and maintainable.

#### Acceptance Criteria

1. THE Assessment_View SHALL be composed of: a CameraCapture component (video preview and recording controls), a PoseOverlay component (landmark visualization on video), an AsymmetryResults component (score display and pad placement recommendations), and a SubmitAssessment component (send data to backend).
2. THE Recovery_Dashboard SHALL be composed of: a ScoreCard component (daily Recovery_Score display), a StreakTracker component (mobility streak counter), a BeforeAfterComparison component (visual asymmetry comparison), and an XpLevelDisplay component (XP and level progression).
3. THE Practitioner_Dashboard SHALL be composed of: a ClientList component (list of clients with scores), a ClientTrendChart component (Recovery_Score trend visualization per client), and a RealTimeIndicator component (connection status for Firebase listeners).
4. WHEN any React component encounters a rendering error, THE component SHALL display a fallback error boundary message instead of crashing the entire application.

### Requirement 14: Regulatory Terminology Compliance

**User Story:** As a product owner, I want all system outputs, UI copy, and data models to use approved wellness terminology, so that the platform remains compliant with its non-medical positioning.

#### Acceptance Criteria

1. THE ViVaWav3 system SHALL use only approved wellness terms (recovery, wellness, mobility, performance, supports, empowers, enhances, supports inflammation management) in all user-facing text, API response messages, and data model field names.
2. THE ViVaWav3 system SHALL not include any prohibited medical terms (medical device, clinical, diagnostic, treats, cures, diagnoses, heals, reduces inflammation, patient) or positioning that **replaces the practitioner** in UI copy, API responses, code comments, or data model field names.
3. WHEN generating voice coaching scripts, THE Voice_Coach SHALL use only approved wellness terminology.
4. THE Gemini system prompt SHALL explicitly list prohibited terms and instruct the Gemini_API to exclude them from all generated output.
