# SkillSphere API – Thunder Client Guide (Week 1)

Base URL: `http://localhost:5000` (use your `PORT` from `backend/.env`)

## 1. Health Check
- **GET** `/health`
- No headers needed

## 2. Register
- **POST** `/auth/register`
- Body (JSON):
```json
{
  "name": "John Client",
  "email": "john@example.com",
  "password": "password123",
  "role": "client"
}
```
- Role: `client` or `freelancer` only
- Copy `token` from response

## 3. Login
- **POST** `/auth/login`
- Body (JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## 4. Verify Email
- **GET** `/auth/verify-email/:token`
- Replace `:token` with token from registration email/DB

## 5. Get Current User (Protected)
- **GET** `/auth/me` OR **GET** `/users/me`
- Header: `Authorization: Bearer YOUR_JWT_TOKEN`

## 6. Update Profile (Protected)
- **PUT** `/users/profile`
- Header: `Authorization: Bearer YOUR_JWT_TOKEN`
- Client body example:
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "bio": "Looking for local freelancers",
  "location": "Mumbai",
  "companyName": "Tech Corp"
}
```
- Freelancer body example:
```json
{
  "name": "Jane Freelancer",
  "bio": "React developer",
  "location": "Delhi",
  "hourlyRate": 50,
  "skills": [
    { "name": "React", "level": "expert" },
    { "name": "Node.js", "level": "advanced" }
  ]
}
```

## 7. Admin Routes (admin role only)
- **GET** `/admin/users`
- **GET** `/admin/stats`
- Header: `Authorization: Bearer ADMIN_JWT_TOKEN`
