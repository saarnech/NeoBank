# Banks — Technical Decisions Log

Architecture decisions, tradeoffs, and rationale. Maintained as the project progresses.

## Backend

### Database: PostgreSQL + Prisma (not MongoDB + Mongoose)

The project doc specified MongoDB + Mongoose. We chose Postgres + Prisma instead.

**Why Postgres:**
- The domain is fundamentally **relational**: users, transactions with sender/receiver foreign keys.
- Transfers require **ACID transactions** — atomically debit sender, credit recipient, insert transaction record. SQL transactions are the natural fit.
- SQL skills transfer more broadly than MongoDB-specific patterns; more career-relevant.

**Why Prisma over a raw driver or other ORM:**
- TypeScript-native, type-safe queries.
- Schema-first migrations match how relational DBs are versioned in real projects.
- Active development, large community.

**Tradeoff:** more rigid schema than MongoDB would have given us. For an evolving early-stage product where the data shape is uncertain, NoSQL flexibility might be worth more. For a banking app where the schema is well-known and integrity matters, this is the right call.

### Auth: JWT + email OTP (not SMS via Twilio)

**Why email only:**
- Twilio requires account setup, costs money, has rate limits.
- Email is universally available, free via Gmail SMTP/Nodemailer.
- The OTP pattern is the same regardless of channel; channel substitution is trivial.

**Why JWT:**
- Stateless — no session table, no Redis.
- Easy to use across REST and WebSockets (same token in both).

**Production note:** would normally use HTTP-only cookies instead of returning the JWT in the response body, to mitigate XSS exposure. Out of scope for this learning project.

### Containerization: Docker Compose for backend + db

- `docker compose up` brings up the whole backend stack: Postgres + the Express server.
- The frontend dev server runs natively (Vite) for fast iteration.
- Backend image uses multi-stage build: dependencies/build in one stage, runtime stage with only `dist/` and production deps.
- Notable hiccup: Prisma 6's npm install pulls peerOptional dev dependencies into the image, bloating it to ~1GB. Mitigated by `rm -rf node_modules/prisma node_modules/effect node_modules/fast-check node_modules/typescript` in the builder stage. Final image ~280MB.

## Frontend

### Tooling: Vite + React + TypeScript + MUI

- **Vite over Create React App** — CRA is deprecated; Vite is the modern standard. Faster dev server, simpler config.
- **MUI** — matches the project doc. Solid for "fast results" with a recognizable design system. Tradeoff: bundle size, generic Material Design aesthetic.
- Considered **shadcn/ui** for a more modern, copy-paste-component approach; deferred to stay aligned with the doc.

### State management: React Context (not Redux/Zustand)

For a small app with auth state being the primary cross-cutting concern, **React Context is sufficient.**
- Built-in, no extra dependency.
- One AuthContext exposing `{user, token, login(), logout(), isLoading}`.
- Avoids prop drilling for auth without the complexity of Redux.

**Tradeoff:** Context re-renders all consumers when value changes. Not a problem here (auth state changes rarely), would matter in a high-frequency state scenario.

### JWT storage: localStorage

**Tradeoff acknowledged:** localStorage is vulnerable to XSS attacks. Production-grade auth would use HTTP-only cookies set by the backend. For this learning project, localStorage was chosen because:
- Persists across refreshes without needing extra backend work for cookies + CSRF protection.
- Simpler to reason about as a frontend-only state.
- Educational tradeoff is more important than the security gap; the XSS risk is documented and would be addressed in any production version.

### HTTP client: axios with interceptors

- Cleaner syntax than fetch.
- **Axios interceptors** are the killer feature — single place to attach the JWT to every request. Frontend components don't need to think about auth headers.

### Routing: React Router 7

- De-facto standard.
- Two custom wrappers: **`ProtectedRoute`** (redirects unauthenticated users to login) and **`PublicOnlyRoute`** (redirects authenticated users away from auth pages). Together they form a complete auth gating matrix.

## Real-time

### Socket.IO (not raw WebSockets)

**Why a library over native WebSockets:**
- Named events instead of string parsing.
- Automatic reconnection.
- Rooms — clean targeting of messages to specific users.
- Transport fallbacks for restrictive networks.

**Pattern: room per user.** Each connected user joins a room named `user:<userId>`. To notify a specific user, emit to their room. Scales to multiple connections per user (same user on multiple devices, all join the same room).

**Auth pattern:** JWT validated at handshake via `io.use()` middleware. After successful auth, user info is stored on `socket.data` for later handlers. Single auth check per connection, not per message.

### Socket.IO Server integration with Express

- Both Express and Socket.IO attach to the same `http.Server`.
- `io` instance stored on Express app via `app.set('io', io)` and retrieved in controllers via `req.app.get('io')`. Keeps the service layer decoupled from a global Socket.IO state.