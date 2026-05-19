# SkillSphere Frontend

## Auth features

- **Roles:** Client, Freelancer (register), Admin (backend seed only)
- **JWT** login / register with Redux persistence
- **Google OAuth:** "Continue with Google" on login/register
- **Email verification:** link from email → `/verify-email/:token`
- **Password reset:** `/forgot-password` → email link → `/reset-password/:token`
- **2FA:** Profile → Security → set up with authenticator app
- **RBAC:** Admin panel at `/admin` (admin role only)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Ensure `VITE_API_URL` matches your backend (e.g. `http://localhost:5000`).

## Admin sign-in

```bash
cd ../backend
npm run seed:admin
```

Sign in at `/login` with credentials from `backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Google OAuth

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`.
