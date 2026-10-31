# The Human Collective — Server API

Backend RESTful API for **The Human Collective**, a community-driven event management platform where users can create, discover, join, and manage social service events in their local area.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js (v5)
- **Language:** TypeScript
- **Database:** MongoDB (Native MongoDB Driver + MongoDB Atlas)
- **Authentication & Authorization:** BetterAuth with MongoDB Adapter & Jose JWT verification
- **Validation:** Zod & TypeScript type safety

---

## 📋 API Endpoints

### 1. Events Endpoints (`/api/events`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/events/recent` | Public | Returns the 6 most recent upcoming events using MongoDB `.limit(6)` |
| `GET` | `/api/events` | Public | Returns all upcoming events (supports `?search=` and `?category=` query params) |
| `GET` | `/api/events/:id` | Public | Returns detailed event information by Event ID |
| `POST` | `/api/events` | Protected | Creates a new community event (validates future dates, stores creator email) |
| `GET` | `/api/events/user/my-events` | Protected | Returns events created by the authenticated user |
| `PUT` | `/api/events/:id` | Protected | Updates an event (only the creator can update) |
| `DELETE` | `/api/events/:id` | Protected | Deletes an event and associated registrations (creator only) |
| `POST` | `/api/events/:id/join` | Protected | Registers user for an event (prevents duplicate joins) |
| `GET` | `/api/events/user/joined-events` | Protected | Returns all events joined by the user, sorted chronologically by date |

### 2. User Profile Endpoints (`/api/user`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/user/profile` | Protected | Returns authenticated user details and joined statistics |
| `PUT` | `/api/user/profile` | Protected | Updates user display name and profile avatar URL |

### 3. Authentication Endpoints (`/api/auth/*`)

Managed automatically by BetterAuth (sign-up, sign-in, session, OAuth, sign-out).

---

## ⚙️ Environment Variables

Create a `.env` file in the server directory with:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Seed sample community events:
   ```bash
   npm run seed
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```
