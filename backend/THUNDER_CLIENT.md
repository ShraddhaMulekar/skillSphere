# SkillSphere API – Auth & RBAC Guide

Base URL: `http://localhost:5000` (use your `PORT` from `backend/.env`)

## Roles
| Role | Register via UI/API | Access |
|------|---------------------|--------|
| `client` | Yes | Client features |
| `freelancer` | Yes | Freelancer features |
| `admin` | `npm run seed:admin` only | `/admin/*` routes |

## 1. Health Check
- **GET** `/health`

## 2. Register (client / freelancer only)
- **POST** `/auth/register`
```json
{
  "name": "John Client",
  "email": "john@example.com",
  "password": "password123",
  "role": "client"
}
```

## 3. Login (JWT)
- **POST** `/auth/login`
- If 2FA enabled → `{ requires2FA: true, tempToken }` then **POST** `/auth/verify-2fa`
```json
{ "tempToken": "...", "token": "123456" }
```

## 4. Google OAuth
- Browser: **GET** `/auth/google?role=client` (or `freelancer`)
- Callback redirects to frontend with `?token=JWT`
- Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` or `BACKEND_URL`
- On production, make sure Google Console has the exact callback URI:
  - `https://YOUR_BACKEND_DOMAIN/auth/google/callback`

## 5. Email verification
- **GET** `/auth/verify-email/:token`
- **POST** `/auth/resend-verification` (Bearer token)

## 6. Password reset
- **POST** `/auth/forgot-password` → `{ "email": "..." }`
- **PUT** `/auth/reset-password/:token` → `{ "password": "newpass123" }`

## 7. Two-Factor Authentication (2FA)
- **POST** `/auth/2fa/setup` (Bearer) → QR code
- **POST** `/auth/2fa/enable` → `{ "token": "123456" }`
- **POST** `/auth/2fa/disable` → `{ "password": "...", "token": "123456" }`

## 8. Protected user routes
- **GET** `/auth/me` or **GET** `/users/me`
- **PUT** `/users/profile` (requires verified email)
- Header: `Authorization: Bearer YOUR_JWT_TOKEN`

## 9. Admin (RBAC – admin role only)
- **GET** `/admin/users`
- **GET** `/admin/stats`

## 10. Seed admin
```bash
cd backend && npm run seed:admin
```
Sign in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.
