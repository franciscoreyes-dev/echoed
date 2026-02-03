# Echoed — Architecture

Real-time Spotify group listening app. Synchronizes playback across multiple Premium users using WebSockets and Spotify OAuth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite |
| UI Components | shadcn/vue |
| Styling | Tailwind CSS |
| WebSocket Client | Socket.io (client) |
| Spotify in-browser | Spotify Web Playback SDK |
| Backend | Node.js + Express |
| WebSocket Server | Socket.io (server) |
| Spotify server-side | axios |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| State | In-memory (Map) — no database |

---

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                     USERS                           │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────┐
│          Vue 3 Frontend (Vercel)                    │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │  Auth    │ │  Room    │ │  Player + Chat +    │ │
│  │  Flow   │ │  Lobby   │ │  Queue UI           │ │
│  └──────────┘ └──────────┘ └─────────────────────┘ │
│         WebSocket client (connects to backend)      │
│         Spotify Web Playback SDK (in-browser)       │
└───────────────────────┬─────────────────────────────┘
                        │ WebSocket + REST
┌───────────────────────▼─────────────────────────────┐
│        Node.js Backend (Railway)                    │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │  Auth    │ │  WebSocket│ │  Spotify Web API    │ │
│  │  Service │ │  Server   │ │  Client (server)    │ │
│  └──────────┘ └──────────┘ └─────────────────────┘ │
│         In-memory room state (no DB needed)         │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────┐
│           Spotify API                               │
│  OAuth2 PKCE | Web API | Web Playback SDK           │
└─────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
echoed/
├── frontend/                    # Vue 3 app → Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── AuthCallback.vue
│   │   │   ├── room/
│   │   │   │   ├── RoomCreate.vue
│   │   │   │   ├── RoomJoin.vue
│   │   │   │   └── RoomLobby.vue
│   │   │   ├── player/
│   │   │   │   ├── Player.vue
│   │   │   │   ├── SyncStatus.vue
│   │   │   │   └── TrackInfo.vue
│   │   │   ├── queue/
│   │   │   │   ├── Queue.vue
│   │   │   │   └── SearchTrack.vue
│   │   │   └── chat/
│   │   │       └── Chat.vue
│   │   ├── composables/
│   │   │   ├── useSocket.ts
│   │   │   ├── useSpotifyPlayer.ts
│   │   │   └── useAuth.ts
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   ├── room.ts
│   │   │   └── player.ts
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── RoomView.vue
│   │   │   └── CallbackView.vue
│   │   ├── router/
│   │   │   └── index.ts
│   │   └── App.vue
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js app → Railway
│   ├── src/
│   │   ├── index.ts             # Entry: Express + Socket.io
│   │   ├── routes/
│   │   │   └── auth.ts          # POST /auth/token
│   │   ├── socket/
│   │   │   ├── roomHandlers.ts
│   │   │   ├── playerHandlers.ts
│   │   │   ├── queueHandlers.ts
│   │   │   └── chatHandlers.ts
│   │   ├── services/
│   │   │   └── spotify.ts       # Spotify Web API wrapper
│   │   └── state/
│   │       └── rooms.ts         # In-memory Map<roomCode, RoomState>
│   ├── package.json
│   └── .env.example
│
├── ARCHITECTURE.md              # This file
├── CLAUDE.md                    # Claude directives
├── .gitignore
└── LICENSE
```

---

## Key Flows

### 1. Auth (PKCE)

```
User clicks "Login"
  → Frontend redirects to Spotify /authorize (PKCE — no secret in browser)
  → Spotify redirects back to /callback?code=XXX
  → Frontend POSTs code to backend /auth/token
  → Backend exchanges code → access_token + refresh_token
  → Backend returns access_token to frontend (refresh_token stays server-side)
  → Frontend stores token in Pinia, initializes Playback SDK
```

### 2. Room + Tight Sync (< 500ms)

```
Host creates room → backend assigns code, stores room in memory
  → Host's Playback SDK registers as a device
  → Host plays a track → backend calls Spotify Web API on host's device
  → All clients receive "track:update" via Socket.io:
      { uri, positionMs, timestamp (server clock) }
  → Each client calculates: expectedPosition = positionMs + (Date.now() - timestamp)
  → Each client's Playback SDK seeks to expectedPosition
  → Every 5s backend re-broadcasts position → clients auto-correct
  → Drift stays under 500ms
```

### 3. Queue

```
Any user searches a track (Search API via backend)
  → Clicks "Add to Queue"
  → Socket event "queue:add" → backend appends to room queue
  → Backend broadcasts "queue:updated" to all clients
  → When current track ends, backend auto-plays next from queue
```

### 4. Chat

```
User sends message → Socket event "chat:send"
  → Backend broadcasts "chat:message" to room
  → All clients append to local chat in real-time
  (Ephemeral — no persistence)
```

---

## Why No Database

Rooms are ephemeral. Chat and queues reset when a room closes. An in-memory `Map` on the server is all that's needed. Adding PostgreSQL would be over-engineering at this scope — it's a clean v2 upgrade path if persistence is needed later.

---

## Build Checklist

- [x] 1. Project scaffolding — Vite + Vue 3 + shadcn/vue + Tailwind (frontend), Express + Socket.io (backend)
- [x] 2. Spotify OAuth — PKCE flow end-to-end, token exchange via backend
- [ ] 3. Playback SDK — Initialize player in browser, basic play/pause
- [ ] 4. Room system — Create/join via Socket.io, in-memory state
- [ ] 5. Sync engine — Server-driven position broadcast + client-side drift correction
- [ ] 6. Queue — Search API + shared queue management
- [ ] 7. Chat — Real-time messaging in the room
- [ ] 8. UI polish — Minimal/clean theme, transitions, sync status indicator
