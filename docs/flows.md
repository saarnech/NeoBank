# User Flows

## Registration & verification

1. User submits email, password, phone → POST /auth/register.
2. Backend creates user in DB with status: inactive.
3. Backend generates 6-digit OTP, sends via email/SMS, stores it.
4. Backend responds 201 with userId.
5. User receives OTP, submits it → POST /auth/verify-otp.
6. Backend validates OTP, marks user active, sets initial balance.
7. Backend responds 200 with JWT and user profile.
8. Client stores JWT for subsequent requests.

## Login

1. User submits email, password → POST /auth/login.
2. Backend looks up user, compares hashed password.
3. On match, backend signs and returns a JWT.
4. Client stores JWT for subsequent requests.

## Transfer

1. Authenticated user submits recipientEmail, amount → POST /transactions.
2. Backend validates JWT, identifies sender.
3. Backend looks up recipient by email; 404 if not found.
4. Backend checks sender's balance; 422 if insufficient.
5. Backend atomically debits sender, credits recipient, creates transaction record.
6. Backend responds 201 with transaction details.
7. (Future, Phase 8) Backend pushes notification to recipient via Socket.IO.