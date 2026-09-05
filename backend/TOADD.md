# 📋 Backend Roadmap & Features To Add (`TOADD.md`)

## 🔐 Priority Feature: Device Secret Code / 2FA PIN Verification
- [ ] **Physical Machine PIN Registration**:
  - Allow users to set a custom Secret Code / PIN on their local companion (`http://localhost:4100/`) when pairing.
  - Transmit over WebSocket with `PairingInit` and store as a bcrypt hash (`deviceSecretHash`) in MongoDB.
- [ ] **Zero-Trust Web Challenge**:
  - When user logs in on the Web Frontend, prompt for the device's Secret PIN before allowing AI remote command execution.
  - Implement `POST /api/device/verify-pin` with brute-force rate-limiting (lockout after 5 failed attempts).
- [ ] **Session Gatekeeper**:
  - Restrict `RunCMD` socket dispatching until the session has verified the device PIN.

---

## 🛠️ General Backend Milestones
- [ ] REST APIs Refinement
- [ ] Authentication & Refresh Tokens
- [ ] Authorization & Role-Based Access
- [ ] SQL / PostgreSQL Exploration
- [ ] Redis Caching & Socket Pub/Sub
- [ ] MongoDB Transactions & Session Locks
- [ ] Database Indexing & Query Optimization
- [ ] Automated Unit & Integration Testing
- [ ] Structured Centralized Logging (Winston/Pino)
- [ ] Global Error Handling Middleware
- [ ] API Security (Helmet, Rate-Limiting, CORS Hardening)
- [ ] WebSocket Heartbeat & Connection Health Monitors
