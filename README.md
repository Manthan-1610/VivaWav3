# ViVaWav3

> **Autonomous Wellness Agent for Hydrawav3 Recovery Intelligence Platform**

\**ViVaWav3** is a full-stack application for the Hydrawav3 platform (GlobeHack Season 1 � Recovery Intelligence track) that empowers practitioners and clients in their wellness journey. The system seamlessly integrates three critical phases:

1. **Know** � Camera-based movement assessment using MediaPipe pose estimation to detect kinematic asymmetry
2. **Act** � AI-driven personalized hardware protocol generation via Gemini API with voice-guided coaching
3. **Learn** � Firebase-backed recovery tracking with gamification (streaks, XP, levels) and practitioner trend analytics

---

## ?? Core Philosophy

> *The body supports its own recovery; the practitioner guides; the platform empowers.*

---

## ? Key Features

### Assessment Phase
- **Real-time camera capture** � 60-second movement video recording in the browser
- **Client-side pose estimation** � MediaPipe-powered landmark detection and asymmetry scoring
- **Intelligent pad placement suggestions** � Sun and Moon pad recommendations based on kinematic asymmetry
- **Error handling** � Graceful fallbacks when camera unavailable or pose not detected

### Protocol Generation
- **AI-driven personalization** � Google Gemini API generates custom Hardware_Protocol JSON
- **Wearable signal integration** � HRV, strain, sleep quality, and activity data inform protocol decisions
- **Voice coaching** � ElevenLabs text-to-speech generates breathing guidance audio
- **Robust validation** � JSON Schema validation with retry logic and safe fallback protocols
- **Session persistence** � Firebase integration for session history and recovery tracking

### Client Dashboard (Recovery Phase)
- **Daily recovery scores** � Track daily wellness metrics
- **Mobility streaks** � Consecutive-day streak tracking for engagement
- **XP & level system** � Gamified progression with experience points and level milestones
- **Before/after comparisons** � Visual feedback on asymmetry improvements over time
- **Real-time Firebase sync** � Live data updates without page refresh

### Practitioner Dashboard
- **Client management** � View all linked clients with real-time status
- **Trend analytics** � Charts showing recovery score trends per client
- **Live connection indicator** � Firebase sync status visibility
- **Bulk insights** � Aggregate metrics across client population

---

## ??? Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0.0 | UI library and component framework |
| TypeScript | ~5.7.2 | Type-safe development |
| Vite | 6.0.5 | Build tool and dev server |
| Firebase | 12.12.0 | Authentication and Database |
| React Router | 7.14.1 | Client-side routing |
| Material-UI | 9.0.0 | UI components |
| Emotion | 11.14.0+ | CSS-in-JS styling |
| MediaPipe | 0.10.34 | Pose estimation |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | 4.21.2 | HTTP server |
| TypeScript | ~5.7.2 | Type-safe development |
| Node.js | 22.10.5+ | Runtime |
| Google Gemini | 0.24.1 | Protocol generation |
| Firebase Admin | 13.8.0 | Database access |
| AJV | 8.18.0 | JSON validation |
| CORS | 2.8.5 | Request handling |
| dotenv | 16.4.7 | Configuration |

### Infrastructure
- **Database** � Cloud Firestore or Firebase Realtime DB
- **Auth** � Firebase Authentication
- **Voice** � ElevenLabs API
- **AI** � Google Gemini API

---

## ?? Documentation

| Document | Purpose |
|----------|---------|
| [docs/requirements.md](docs/requirements.md) | Full specification |
| [docs/api-spec.md](docs/api-spec.md) | API endpoints |
| [docs/firebase-schema.md](docs/firebase-schema.md) | Database schema |
| [docs/react-components.md](docs/react-components.md) | Component structure |
| [docs/gemini-system-prompt.md](docs/gemini-system-prompt.md) | AI prompts |

---

## ?? Quick Start

### Prerequisites
- Node.js = 18.0.0
- npm = 9.0.0
- Firebase Project

### Installation

\\\ash
git clone <repository-url>
cd VivaWav3
npm install
npm run dev
\\\

### Environment Configuration

**Backend** (\server/.env\):
\\\env
PORT=3001
GEMINI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/service-account.json
\\\

**Frontend** (\rontend/.env.local\):
\\\env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project
VITE_API_BASE_URL=http://localhost:3001/api
\\\

### Running

\\\ash
npm run dev
\\\

- Frontend: http://localhost:5173
- API: http://localhost:3001

### Build

\\\ash
npm run build
npm run start
\\\

---

## ?? Component Architecture

**Assessment Flow:**
\\\
CameraCapture ? MediaPipe Detection ? Asymmetry Scoring ? 
Backend API ? Hardware Protocol + Voice Audio
\\\

**Recovery Dashboard:**
\\\
Firebase Auth ? Firestore Listeners ? Real-time Updates
\\\

---

## ?? AI Integration

Google Gemini API generates personalized Hardware_Protocol:
1. Frontend captures movement asymmetry
2. Backend receives asymmetry + wearable data
3. Gemini generates JSON protocol
4. ElevenLabs generates voice coaching
5. Returns protocol + audio URL

**Fallback:** If unavailable, uses safe default protocol.

---

## ??? Development

**Frontend:**
\\\ash
npm run dev -w frontend
\\\

**Backend:**
\\\ash
npm run dev -w server
\\\

---

## ?? Troubleshooting

**API 404 errors:**
- Ensure both frontend and backend running
- Check vite.config.ts proxy configuration

**Firebase auth/invalid-api-key:**
- Use Web app config, not Admin SDK key
- Ensure VITE_ prefix on frontend vars
- Restart Vite after env changes

**Gemini API invalid JSON:**
- Verify API key is valid
- Check system prompt configuration
- Backend retries 2 times before fallback

**MediaPipe detection fails:**
- Improve lighting and camera angle
- Ensure user in full frame
- System shows repositioning guidance

---

## ?? Production Deployment

### Environment Variables

**Backend:**
\\\env
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=***
ELEVENLABS_API_KEY=***
FIREBASE_PROJECT_ID=***
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/service-account.json
\\\

**Frontend:**
\\\env
VITE_FIREBASE_API_KEY=***
VITE_FIREBASE_PROJECT_ID=***
VITE_API_BASE_URL=https://api.yourdomain.com
\\\

### Security Checklist
- [ ] Never commit .env or secrets/
- [ ] Strong Firebase security rules
- [ ] HTTPS for all API calls
- [ ] Rotate API keys regularly
- [ ] Test fallback behaviors

---

## ?? Wellness Terminology

ViVaWav3 is a wellness platform.

**? Approved:**
- Recovery, wellness, mobility, performance
- Supports, empowers, enhances

**? Prohibited:**
- Medical device, clinical, diagnostic
- Treats, cures, diagnoses, heals
- Patient, replaces practitioner

---

## ?? Contributing

1. Fork repository
2. Create feature branch: \git checkout -b feature/your-feature\
3. Commit changes
4. Push and open PR

**Guidelines:**
- TypeScript strict mode
- Follow component patterns
- Add error boundaries for routes
- Use wellness terminology

---

## ?? Support

For questions:
- Check documentation index
- Review troubleshooting section
- Consult component-specific docs

---

## ?? Hackathon Context

**ViVaWav3** � GlobeHack Season 1, Recovery Intelligence track

Integrates:
- ?? MediaPipe computer vision
- ?? Google Gemini LLM
- ??? ElevenLabs voice synthesis
- ?? Firebase real-time database
- ? React + TypeScript + Express stack
