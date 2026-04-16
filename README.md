# Data

**Data** is a mobile app (React Native / Expo) where friends answer one question per day and discover each other more deeply.

## What this folder is

This is the source code for the **Data app** — it is **NOT** a folder for storing session data, logs, or tool outputs.

## Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native + Expo (TypeScript) |
| Backend | Bun + Hono + MongoDB (TypeScript) |
| Real-time | WebSocket (Bun native) |
| Auth | JWT + bcrypt, reset-password flow |
| Avatars | GitHub-style identicons (djb2 hash + SVG) |

## Features

- **Daily question** — one question per day, answer and share with friends
- **Profiles** — your answer history and friends' answer history, searchable
- **Friends** — send/accept requests by email or nickname
- **Real-time chat** — WebSocket messaging between friends
- **Auth** — register, login, forgot password, reset password

## Getting started

### Backend
```bash
cd server
cp .env.example .env   # set MONGODB_URI and JWT_SECRET
bun install
bun run dev            # starts on port 3000
```

### Mobile app
```bash
bun install
bunx expo start
```

### Tests
```bash
cd server && bun test
```

## Project structure

```
Data/
├── src/
│   ├── components/     # Avatar (identicon)
│   ├── config/         # API base URL
│   ├── navigation/     # React Navigation stack/tabs
│   ├── screens/        # All screens (auth, profile, friends, question)
│   ├── services/       # API client (axios)
│   ├── store/          # Zustand global store
│   └── types/          # Shared TypeScript types
├── server/
│   ├── src/
│   │   ├── models/     # Mongoose models (User, Answer, Friend, Message)
│   │   ├── routes/     # Hono route handlers
│   │   ├── middleware/ # Auth middleware
│   │   └── __tests__/ # Bun test suites
│   └── index.ts        # Entry point + WebSocket server
└── .github/workflows/  # CI (type-check + tests)
```

## CI

GitHub Actions runs on every push to `master`/`main`:
1. **App TypeScript** — `bunx tsc --noEmit`
2. **Server tests** — `bun test` with a real MongoDB service container
3. **Server TypeScript** — `bunx tsc --noEmit`
