# 📋 Project Features & Roadmap (`toadd.md`)

## 🎨 Frontend Roadmap & Milestones

### ✅ Completed
- [x] **Tailwind CSS v4 & IntelliSense Integration**:
  - Configured workspace settings for nested `style` object autocomplete and TSX support.
- [x] **Landing Page (`page.tsx`)**:
  - Modern hero layout with glowing dashboard poster frame.
  - Spaced desktop responsive layout (`xl:`) and mobile column view.
- [x] **Authentication UI (Login & Sign Up)**:
  - Glassmorphic dark cards matching Nexus purple aesthetic (`#7357E2` to `#9129b6`).
  - Standardized form controls, labels, and focus rings.
  - Interlinked routes (`/auth/login` and `/auth/signup`).
- [x] **Viewport & Background Fixes**:
  - Resolved mobile address bar scroll clipping with `min-h-dvh`.
  - Fixed linear gradient cutoff on scroll with `bg-fixed bg-no-repeat`.

### 🎯 Next Goal: Sidebar Component
- [ ] **Interactive Desktop/Mobile Sidebar (`SideBar.tsx`)**:
  - Collapsible sidebar on desktop with smooth transition.
  - Drawer / off-canvas overlay on mobile with hamburger toggle from `NavBar`.
  - Navigation items: Active Chat/Session, Devices List, Automations, History, Settings.
  - Route detection (`usePathname`) for active nav item highlighting.
  - Paired companion status indicator (online / offline).

---

## 🔐 Priority Backend Feature: Device Secret Code / 2FA PIN Verification (Zero-Trust Remote Access)

### Concept
Allow users to define a private **Secret Code / PIN** directly on their physical machine companion (`http://localhost:4100/`) during pairing. When paired:
- The Cloud Backend stores this PIN hashed using `bcrypt` (`deviceSecretHash`).
- Whenever the user logs in to the Web Frontend, they are prompted to enter this Secret Code to unlock the device.
- **Zero-Trust**: Even with stolen account credentials, no remote commands can run on the user's PC without knowing the physical device's PIN.

### Implementation Checklist
- [ ] **Local Companion (`Local-BE`)**:
  - Add Secret Code input field in `Local-BE/paringcode.html`.
  - Transmit `secretCode` in `PairingInit` payload in `Local-BE/services/ws.service.ts`.
- [ ] **Cloud Backend (`backend/`)**:
  - Add `deviceSecretHash` field to MongoDB device/user schema.
  - Add `POST /api/device/verify-pin` endpoint with bcrypt validation and 5-attempt rate-limiting.
  - Reject `RunCMD` until the active session has passed PIN verification.
- [ ] **Web Frontend (`frontend/`)**:
  - Add Device Unlock Challenge modal when selecting a paired machine.
  - Store temporary session unlock token.

> For the detailed technical task specification, see [backend/tasks.md](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/tasks.md).
