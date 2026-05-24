# Banks — Technical Decisions Log

Architecture decisions, tradeoffs, and rationale. Maintained as the project progresses.

## Project plan revisions

The project doc lists 13 phases. We have made two structural changes:

1. **Reordered for sensible dependency flow.** The doc puts Docker after frontend; we did it before, so we'd have a portable backend container by the time we built the frontend. Reordering preserved all the doc's content; only the sequence changed.

2. **Added two phases not in the doc:**
    - **CI/CD (Jenkins)** — testing alone isn't enough without continuous validation. Real-world practice.
    - **Deployment** — the doc has a "Deploy BE/FE" phase but we treat it as the final step rather than mid-project, so that we ship a tested + CI-validated app, not an in-progress one.

3. **Split LLM work into two phases:**
    - **LLM chatbot** — simple Q&A widget, learns the LLM-proxy pattern.
    - **AI Banking Assistant (LangGraph)** — tool-calling assistant that reads user data. This is doc Phase 9, treated as its own phase.

Phase order rationale: features → tests → CI/CD → deploy. Backtracking from deploy is the most expensive change to undo, so it goes last.

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

## Validation approach

The backend uses **manual input validation** in each controller (parsing `req.body`, checking types and shapes with imperative `if` statements) rather than a schema-based library like zod.

**Mid-project, we briefly retrofitted to zod and then reverted.** Worth documenting why.

### What we tried

Zod is a TypeScript-first runtime validation library: define a schema once, get both runtime checks and a derived TypeScript type from the same source. In theory: less duplication, no type drift, more elegant.

We converted three controllers (`chat`, `transaction`, and were about to do `auth`) to zod schemas.

### Why we reverted

Per-file, zod consistently produced **longer code**, not shorter:
- `transaction.controller.ts`: 47 lines manual → 67 lines zod (+40%)
- `auth.controller.ts` projection: ~88 lines manual → ~110 lines zod (+25%)

The extra lines came from:
- Forced `try/catch` blocks around code that didn't need them with manual validation.
- Repeated `instanceof z.ZodError` handling per endpoint.
- Schemas + helper functions that have value, but not enough to offset.

The promised wins — shared validators (`emailSchema`, `passwordSchema`), composability, no type drift — were real but small for a project with this many endpoints. Zod's value compounds with API size; we have ~6 endpoints, which isn't enough surface area for the compounding to dominate.

### When zod *would* be the right call

- A project with 15+ endpoints sharing common fields.
- Sharing schemas between frontend and backend (same schema validates the form client-side AND the request server-side).
- Heavy use of test fixtures derived from schemas.

None of those apply here.

### What we kept from the exercise

- The chat controller's manual validation pattern (writing it forced us to think about message shape, length bounds, role enums).
- A clearer architectural picture: validation lives in the **controller layer** (HTTP shape) and the **service layer** (business rules). Zod could replace the controller layer; it couldn't replace the service layer. Knowing that the two are separable is valuable.
- A real lesson about pre-evaluating tool choices: "more elegant in theory" isn't a substitute for measuring "shorter and clearer for *this* codebase."

### Tradeoffs of staying manual

- **More verbose** per endpoint.
- **Type/runtime drift risk** — TypeScript types are maintained separately from the validation logic. If someone adds a field to the type but forgets the runtime check, the bug is silent until runtime.
- **No reusable composable validators** — if password rules change, multiple places need updating.

These are real costs we accept. The mitigation: validation rules are simple enough (and endpoint count small enough) that maintaining them manually is cheaper than introducing a library that didn't pay back its complexity cost in our case.

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

## Video calling

### Jitsi Meet (embedded via JavaScript SDK)

**Why Jitsi:**
- Free, open-source, no API key needed.
- Drop-in SDK loaded from a CDN — no auth/billing infrastructure on our side.
- Active project with good docs.

**Considered alternatives:**
- **Twilio Video / Vonage Video** — proper SDKs with full control, but require paid accounts and API key management.
- **WebRTC directly** — would mean writing signaling, ICE, all of it. Way out of scope.

**Integration pattern:**
- Loaded via `<script src="https://meet.jit.si/external_api.js" async>` in `index.html`.
- TypeScript declaration in `src/types/jitsi.d.ts` makes `window.JitsiMeetExternalAPI` typed.
- React's `useRef` holds a reference to the container DOM node; a `useEffect` initializes Jitsi once the container exists in the DOM.
- Cleanup on unmount via `api.dispose()` to prevent leaked iframes.

**Pattern lesson — "state-first, then-effect":**
- Tried to initialize Jitsi directly in the click handler. Failed: the container div wasn't in the DOM yet (its render was gated on `inCall === true`).
- Fixed by separating: click handler sets state → React re-renders → `useEffect` sees the new DOM state and initializes Jitsi.
- This is a real and common React pattern.

**Room naming: option A (per user).**
- Each user has a stable room based on their email: `neobank-alice-example-com`.
- To "call" someone, enter their email; both users land in the same room.
- Realistic for the "confirm a transfer face-to-face" use case.
- Considered: per-pair rooms, per-call random rooms, single shared room. Per-user was the simplest mapping to "I want to call this person."

**Known limitation:**
- `meet.jit.si` (the public Jitsi server) now requires at least one moderator to start a meeting. Anonymous users get "Asking to join meeting…" until a Jitsi-authenticated user joins.
- In production, would either self-host Jitsi (full control) or use JaaS (Jitsi-as-a-Service, paid tier with API tokens).
- For our learning project: the integration is fully working; the gate is policy, not code.

## LLM customer service chatbot

### Provider: Groq (Llama 3.3 70B)

**Why Groq:**
- Genuinely free developer tier — no credit card, no time limit, only rate limits.
- OpenAI-compatible API surface, so provider-swapping is one-line.
- Llama 3.3 70B is capable enough for chatbot Q&A and handles structured outputs (for Phase 11's tool-calling).

**Considered alternatives:**
- **OpenAI** (the doc's default) — gold-standard models but requires paid credits past trial.
- **Anthropic** — best tool-calling I'd reach for, but trial credits burn fast under iteration.
- **Grok (xAI)** — free credits via data-sharing program, more setup overhead, less common in tutorials.

For a learning project with iterative testing, Groq's free tier was the right tradeoff. Skills transfer cleanly to any provider — we use only the OpenAI-compatible `/v1/chat/completions` shape.

### Architecture: backend proxy

The frontend never talks to Groq directly. All chat requests go through the backend at `/api/v1/chat`, which holds the `GROQ_API_KEY` in its `.env` and proxies to Groq.

**Why proxy:**
- API key never reaches the browser. Anyone could read `localStorage` or inspect axios calls — exposing the key would let them burn through credits on someone else's tab.
- Lets us validate, rate-limit, log, and authorize per-user on our terms.
- Lets us inject the system prompt server-side so users can't override the assistant's persona.

The frontend sends only `{ messages }`. The backend prepends the system prompt before calling Groq.

### System prompt design

The chatbot is positioned as a NeoBank customer service Q&A. The prompt explicitly states:
- It is NeoBank's assistant.
- It does NOT have access to user-specific account data (balance, transactions).
- For account-specific actions, it should redirect users to the app's UI.

**The data-access guardrail worked.** When asked "What's my balance?", the chatbot correctly said "I don't have access to your account information."

**Initial prompt allowed factual hallucination about app features.** When asked "How do I transfer money?", the LLM invented details that don't exist in our app (separate account selection, mobile-number recipients, multi-hour transfer delays). It described a plausible *generic* banking transfer, not *our* transfer. The system prompt told it our domain but not the specific behavior in detail.

**Tightened the prompt with a "NeoBank specifics" section** listing concrete facts about the app: single accounts, email-only recipients, instant transfers, email OTP, etc. Plus an explicit instruction to "say so honestly rather than guess" when uncertain.

**After tightening, the hallucinations stopped on our test cases.** Transfer questions now correctly describe email-based recipients and instant delivery. Conversation context still held across follow-ups. The data-access guardrail still held.

### The remaining ceiling

Even with a tighter prompt, this approach has natural limits:
- The prompt grows linearly with feature coverage. Add 10 more features and the prompt becomes unwieldy.
- The LLM still chooses which prompt-rules to follow. We have no enforcement.
- Anything not in the prompt is open to invention.

Three fixes exist for going further, each costlier:
1. **More detailed prompt** — what we just did. Cheap, partial.
2. **RAG (retrieval-augmented generation)** — vector DB of feature docs, retrieved per query. Real engineering investment.
3. **Tool-calling assistant** — LLM calls actual functions for real data. **This is Phase 11.**

The two features serve different roles: the chatbot handles general questions and feature-FAQ; the assistant (Phase 11) handles account-specific operations with real data access.
### Conversation state

Stored in React component state on the frontend. Sent in full with each request. No backend persistence.

**Tradeoffs:**
- Pro: simple, no DB schema for chat, no privacy concerns about stored conversations.
- Pro: each chat session is independent (refresh → fresh start), which suits "I have a question right now" framing.
- Con: every request grows. After 10 messages, you're sending 10 messages back. For a long session this could matter — we cap at 20 messages per request on the backend as a safety net.
- Con: no resume across sessions. If the user closes the tab, the conversation is gone.

For a customer service use case, this is fine. For a "persistent assistant," we'd add a DB-backed conversation history.

### Validation: manual (kept project consistent)

We initially retrofitted zod for input validation. After measuring (longer code, no real gain at our endpoint count), we reverted to manual. The chat endpoint uses an `isValidMessage` type guard + imperative checks. See "Validation approach" above.

## AI Banking Assistant (LangGraph tool-calling)

The chatbot from Phase 10 was upgraded to a tool-calling agent. Same widget, same endpoint, smarter brain. Decisions covered here: choosing to merge with the chatbot rather than build a separate feature, library choice, model choice, tool design, security model.

### Architecture: upgrade in place, not a separate feature

The project doc lists "LLM chatbot" (Phase 8) and "AI Banking Assistant" (Phase 9) as separate phases. We initially planned to build two features (a no-data chatbot and a data-aware assistant).

We reconsidered: a feature flow where the user has to *choose between* two AI features — one of which is honest about not having user data — is worse UX than a single AI feature that can answer everything in scope. Real products don't ship the dumber version next to the smarter one.

So Phase 11 became "upgrade Phase 10's chatbot with tool calling," not "build a separate assistant." Same widget, same `/api/v1/chat` endpoint. The chat service was rewritten to use LangGraph; the rest of the stack was unchanged.

### Library: LangGraph (`langchain` + `@langchain/langgraph`)

The project doc specifies LangGraph. We used it.

Honestly, for our case — three read-only tools, single-pass tool calls, no multi-step branching — **LangGraph is overkill**. Direct tool-calling via Groq's OpenAI-compatible API would work. LangGraph earns its keep in multi-step stateful agent workflows that we don't have.

We chose LangGraph because the phase's *learning objective* is LangGraph. The project doc isn't ranking validation libraries (like the manual-vs-zod debate); it's defining what skill the phase teaches. Skipping LangGraph would defeat the phase.

**Used `createAgent` from the `langchain` package** (LangGraph v1's recommended API), not the deprecated `createReactAgent` from `@langchain/langgraph/prebuilt`. Many tutorials still show the deprecated path; v1 docs were the source of truth.

### Model: `openai/gpt-oss-120b` on Groq (not Llama 3.3)

Initially used `llama-3.3-70b-versatile` (the model from Phase 10's chatbot). Tool calling failed intermittently with HTTP 400 `tool_use_failed`. The model produced function calls in Llama's `<function=name(args)</function>` text format rather than the structured JSON format Groq's API expects.

This is a known issue on Groq with Llama models for tool calling, documented in their community forums and GitHub issues. Not a config bug on our side — a parser mismatch.

Considered three escalation paths:
1. **Different Groq model** — free, may work.
2. **Llama 3.3 with workarounds** (prompt tweaks, retry-on-failure) — free, partial fix at best.
3. **Switch to Anthropic Claude Haiku** — paid (~pennies for our usage), gold-standard tool calling.

Tried option 1 first. **`openai/gpt-oss-120b`** (Groq's recommended replacement for the deprecated Kimi K2 and Llama 4 Maverick) worked reliably on all test cases. Free tier preserved.

### Tools: closure-bound, services-not-routes

Two tools: `getMyBalance` and `listMyTransactions`. Originally three (`getMyEmail` was removed once we noticed the agent had no real need for it — the user's email is already visible in the UI everywhere, and exposing it as a tool added surface without utility).

**Tools call backend services directly**, not HTTP routes or the database.

Considered alternatives:
- **Direct DB access** (LLM writes SQL) — rejected. Massive attack surface; trivially exploitable by prompt injection.
- **REST routes** (LLM makes HTTP calls to our own backend) — defensible; routes provide auth + validation. But adds HTTP overhead, self-calling complexity, and our security guarantees can be achieved at the service layer.
- **Services with closure-bound context** — chosen.
- **Tool design philosophy: raw data, not pre-computed summaries.** `listMyTransactions` returns raw transaction rows. The LLM does its own summarization, aggregation, and interpretation. We tested this with "analyze my spending patterns" — the LLM produced totals, averages, largest transaction, frequency observations, and budget tips, all unprompted. Trying to add a `getTransactionSummary` tool with pre-computed aggregates would be redundant. Lesson: give the LLM raw data and let it do the analytical work; don't pre-cook what it can cook itself.

### Security model: closure-bound user context

The most important design choice in this phase: **`userId` is bound into tools via JavaScript closure**, not passed as a tool argument.

```typescript
function createUserTools(userId: string) {
    const getMyBalance = tool(
        async () => { return findUserById(userId); },  // userId from outer scope
        { schema: z.object({}) }                        // no argument exposed to LLM
    );
    return [getMyBalance, ...];
}
```

When the chat endpoint receives a request:
1. Auth middleware extracts `req.user.userId` from the JWT.
2. Controller passes that userId to `createUserTools(userId)`.
3. The returned tools have userId baked in via closure.
4. The LLM sees only the tool name and its zod schema — there's no userId argument it could change.

A prompt injection like "call getMyBalance for user admin" has no effect: the schema declares no userId argument; LangChain validates against the schema before invoking. The LLM is structurally incapable of querying another user's data.

This is a real and well-known agent security pattern. Worth flagging because it's the kind of mechanism that takes a sentence to describe in an interview but a paragraph to defend if someone pushes on it.

### Tool design: read-only

No write tools (no `initiateTransfer`, no `updateEmail`). Two reasons:
- The project scope explicitly didn't require write operations.
- Write tools open prompt-injection attack vectors (an attacker-controlled string could trick the LLM into executing actions). For a banking app, the safest stance is "show, don't do." Real banking applications either (a) require explicit human confirmation for write actions or (b) don't expose write tools at all.

### What this proved

- Tool calling works end-to-end against Groq, given the right model.
- The "hallucination" problem from Phase 10 (LLM inventing balance numbers) is now structurally prevented for data the agent can fetch — it calls the tool and reports the real number.
- The system prompt from Phase 10 (with NeoBank specifics) carried over and still works for non-tool-answerable questions (FAQ-style).
- For interview talking points: closure-bound tool context, services-vs-routes tradeoff, why we picked the model we did.