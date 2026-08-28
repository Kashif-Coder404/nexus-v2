# Device Authentication System — Backend ↔ Local-BE

## Problem

When a user installs and runs Local-BE on their PC, the Backend has no way to know which user it belongs to. We need a secure, user-friendly way to **link a device** to a user account — entirely over WebSocket.

## Design Decision

**Approach: Device Code Pairing** — User generates a short one-time code from the website, pastes it into Local-BE's setup page. Local-BE exchanges the code for a long-lived device token and stores it on disk. Auto-refresh keeps it alive forever.

---

## Full Auth Flow

### First-Time Setup (one-time)

```
Website                              Backend                     Local-BE
  │                                     │                           │
  │  1. User clicks "Link Device"       │                           │
  ├────────────────────────────────────►│                           │
  │                                     │  Generates a one-time     │
  │  2. Shows device code               │  code (e.g., "NX-8F3K2A")│
  │◄────────────────────────────────────┤  stored in DB with        │
  │     "Your code: NX-8F3K2A"          │  userId + 5min expiry     │
  │     (expires in 5 minutes)          │                           │
  │                                     │                           │
  │          User copies code,          │                           │
  │          opens localhost:4100       │                           │
  │          pastes code                │                           │
  │                                     │                           │
  │                                     │  3. Local-BE sends code   │
  │                                     │◄──────────────────────────┤
  │                                     │   via WS first message    │
  │                                     │                           │
  │                                     │  4. Backend validates:    │
  │                                     │   - code exists in DB?    │
  │                                     │   - not expired?          │
  │                                     │   - not already used?     │
  │                                     │   → issues device token   │
  │                                     │     (30-day expiry)       │
  │                                     │   → deletes the code      │
  │                                     │                           │
  │                                     │  5. Sends device token    │
  │                                     ├──────────────────────────►│
  │                                     │                           │
  │                                     │                           │  Saves token to
  │                                     │                           │  auth.json
  │                                     │                           │  ✅ Done!
```

### Every Restart (automatic, no user action)

```
1. Local-BE starts → reads token from auth.json
2. Connects to WS with header: Authorization: Bearer <token>
3. Backend verifyToken() → valid → ws.userId set → authenticated ✅
4. If expired → Local-BE shows "re-link" message at localhost:4100
```

### Auto Token Refresh (no user action)

```
Day 1:   Token issued (valid 30 days)
Day 25:  Backend sends over WS → { type: "token_refresh", newToken: "xxx" }
         Local-BE saves new token to disk, replaces old one
Day 30:  Old token would've expired, but new one is active
         ♻️ Repeats forever as long as Local-BE runs within the 30-day window
```

### Edge Case: Token Expired (rare, user action needed)

```
Local-BE offline for 30+ days → token expired → can't connect
Local-BE shows at localhost:4100:
  "⚠️ Device token expired. Go to nexus.com/settings → Link Device"

User generates new code on website → pastes into Local-BE → re-linked ✅
```

---

## What To Build

### Backend (port 3100)

1. **Device Code Schema** — `backend/db/schema/device-code-schema.ts` [NEW]
   - Fields: `code`, `userId`, `expiresAt`, `used`
   - TTL index on `expiresAt`

2. **Device Schema** — `backend/db/schema/device-schema.ts` [NEW]
   - Fields: `userId`, `deviceName`, `lastSeen`, `tokenVersion`, `createdAt`

3. **Generate Device Code** — `POST /api/auth/device-code` (requires auth)

4. **Exchange Code for Token** — `POST /api/auth/device-link` (public)

5. **WS Auth via Header** — `backend/services/websocket.service.ts`

6. **Device JWT** — `generateDeviceToken()` in `jwt.service.ts` with 30d expiry

### Local-BE (port 4100)

7. **Setup Page** — `Local-BE/views/login.html` at `localhost:4100/login`

8. **Token Storage** — `Local-BE/services/auth.service.ts`

9. **WS Client with Header Auth** — `Local-BE/services/ws.service.ts`

10. **Link Device Route** — `POST /link-device`

### Frontend

11. **"Link Device" button** in settings page
12. **"Linked Devices" list** with status + remove

---

## Security

| Aspect | How it's handled |
|---|---|
| Device code | One-time use, 5 min expiry |
| Token on disk | JWT only (no password), revocable |
| Password change | JWT uses userId only — not affected |
| Token in WS header | Sent once per connection |
| Device revocation | Remove from website → token rejected |

---

## Implementation Order

1. Device Code schema + generate endpoint (Backend)
2. Device link endpoint (Backend)
3. JWT device token generation (Backend)
4. WS auth via header (Backend)
5. Token storage service (Local-BE)
6. WS client with header auth (Local-BE)
7. Login page + link-device route (Local-BE)
8. Frontend "Link Device" UI (later)
