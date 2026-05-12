# NousBooks

[![CI](https://github.com/miguelsalamanca007/nousbooks/actions/workflows/ci.yml/badge.svg)](https://github.com/miguelsalamanca007/nousbooks/actions/workflows/ci.yml)
[![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Flyway-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-TBD-lightgrey)](#license)

> A full-stack application to manage your personal library: search books on Google Books, organize your reading in a kanban board, track progress, take notes and visualize your stats.

🌐 **Demo:** [nousbooks.vercel.app](https://nousbooks.vercel.app)

---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Database migrations](#database-migrations)
- [Deployment](#deployment)
- [CI](#ci)
- [Features](#features)
- [Architecture](#architecture)
- [Domain model](#domain-model)
- [REST API](#rest-api)
- [License](#license)

---

## Tech stack

### Backend

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.5 |
| Web | Spring Web MVC |
| Persistence | Spring Data JPA · Hibernate |
| Migrations | Flyway (PostgreSQL) |
| Security | Spring Security · JJWT 0.12 |
| OAuth | google-api-client (ID token verification) |
| Build | Maven Wrapper |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 · Tailwind CSS 4 |
| Server state | TanStack Query (React Query) v5 |
| Client state | Zustand v5 |
| Charts | Recharts |
| Drag & drop | dnd-kit |
| OAuth | @react-oauth/google |
| Language | TypeScript 5 |
| Linting | ESLint 9 (`eslint-config-next`) |

### Infrastructure

- **Docker** multi-stage build for the backend (`eclipse-temurin:17-jre-alpine`, non-root user).
- **GitHub Actions** for CI on every push and PR to `main`.
- **Vercel** (frontend) · **Render** (backend + Postgres).

## Getting started

### Prerequisites

- **JDK 17+**
- **Node.js 20+** (npm)
- **Git**
- Optional: **Docker** (for production builds) and **PostgreSQL** (not needed in dev — H2 is used in-memory)

### Backend

```bash
git clone https://github.com/miguelsalamanca007/nousbooks.git
cd nousbooks

./mvnw spring-boot:run
```

The backend starts at `http://localhost:8080` with the `dev` profile active and H2 in-memory. The **H2 console** is available at `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:nousbooks`, user `sa`, no password).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Next.js app starts at `http://localhost:3000` and points to the local backend by default.

### Packaging / Docker

```bash
# Executable JAR
./mvnw clean package

# Docker image (multi-stage, JRE alpine)
docker build -t nousbooks-api .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/nousbooks \
  -e SPRING_DATASOURCE_USERNAME=... \
  -e SPRING_DATASOURCE_PASSWORD=... \
  -e APP_JWT_SECRET=... \
  nousbooks-api
```

## Configuration

### Environment variables (backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `dev` | `dev` (H2) or `prod` (Postgres) |
| `SPRING_DATASOURCE_URL` | — | JDBC URL in prod |
| `SPRING_DATASOURCE_USERNAME` | — | DB user in prod |
| `SPRING_DATASOURCE_PASSWORD` | — | DB password in prod |
| `APP_JWT_SECRET` | dev key | **Required in prod.** Base64 ≥ 256 bits |
| `GOOGLE_BOOKS_API_KEY` | empty | Recommended to avoid the anonymous rate limit |
| `GOOGLE_OAUTH_CLIENT_ID` | empty | Google Client ID (must match the frontend's) |
| `FRONTEND_URL` | `https://*.vercel.app,http://localhost:3000` | Comma-separated CORS origins |

### Environment variables (frontend)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (defined in `frontend/.env.production`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Public Google OAuth Client ID |

## Database migrations

The schema is owned by **Flyway** from `src/main/resources/db/migration/`. Hibernate runs in `validate` mode, so any drift between JPA entities and the schema breaks startup — that's intentional.

Naming convention: `V{n}__{snake_case_description}.sql`.

## Deployment

- **Frontend → Vercel.** Auto-deploys from `main`. The backend URL is pinned in `frontend/.env.production` so the build doesn't depend on Vercel's dashboard.
- **Backend → Render.** Docker image built from the `Dockerfile`. Required variables: `SPRING_PROFILES_ACTIVE=prod`, database credentials, `APP_JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_BOOKS_API_KEY` and optionally `FRONTEND_URL`.
- **Database → Render Postgres.** Flyway applies migrations on startup.

## CI

`.github/workflows/ci.yml` runs on every push and PR to `main`:

- **Backend**: `./mvnw test` + `./mvnw package -DskipTests`.
- **Frontend**: `npm ci` + `npm run lint` + `npm run build`.

## Features

- 🔐 **Authentication** with email/password (JWT) and **Sign-In with Google** (ID token verification on the backend).
- 🔎 **Book search** through the **Google Books API**, with quick results, a full results page, and **advanced search** (filters by author, publisher, ISBN, language, print type, ordering, etc.).
- 📚 **My library**: add books to your collection and move them between *To read*, *Reading* and *Read* states (drag-and-drop kanban).
- 📈 **Reading progress**: track pages read and current page for books in progress.
- ⭐ **Ratings** with a star system.
- 📝 **Notes** attached to each book, listable and editable.
- 📊 **Personal stats** (charts powered by Recharts).
- 👤 **User profile** with profile editing, password change and persistent **light/dark theme**.
- 🌐 **Book detail modal** shared between search results and the library.

## Architecture

```
┌──────────────────────────┐         ┌─────────────────────────────┐
│  Frontend (Next.js 16)   │  HTTPS  │  Backend (Spring Boot 3.5)  │
│  React 19 · Tailwind 4   │ ──────► │  Spring Security · JWT      │
│  TanStack Query · Zustand│ ◄────── │  JPA / Hibernate · Flyway   │
│  Vercel                  │         │  Render                     │
└──────────────────────────┘         └──────────────┬──────────────┘
                                                    │
                                       ┌────────────┴───────────┐
                                       │                        │
                                ┌──────▼──────┐         ┌───────▼────────┐
                                │ PostgreSQL  │         │ Google Books   │
                                │  (Render)   │         │     API        │
                                └─────────────┘         └────────────────┘
```

- **Frontend** deployed on **Vercel**, serving the Next.js SPA (App Router).
- **Backend** deployed on **Render** as a Docker container, exposing a REST API under `/api/*`.
- **PostgreSQL** managed on Render; the schema is owned by **Flyway** while Hibernate only validates it.
- **Stateless authentication** via JWT; the frontend stores the token and sends it as `Authorization: Bearer …`.
- **CORS** restricted to `*.vercel.app` and `localhost:3000` by default.

## Domain model

```
┌──────────┐        ┌─────────────┐        ┌──────────┐
│  users   │───────<│ user_books  │>───────│  books   │
└────┬─────┘        └─────────────┘        └─────┬────┘
     │              status, rating, review,      │
     │              progress, dates              │
     │                                           │
     └──────────────<│  notes   │>───────────────┘
                     └──────────┘
```

- **users** — local credentials (BCrypt-hashed `password`) and/or Google OAuth link, plus a `role` (USER/ADMIN).
- **books** — local cache of books imported from Google Books (`google_books_id` unique).
- **user_books** — N:M relation with reading status (`TO_READ`, `READING`, `READ`), rating, review, start/finish dates, total page count and current page. Unique per `(user_id, book_id)`.
- **notes** — personal annotations attached to a book.

Relevant enums: `ReadingStatus`, `Role`, `OrderBy`, `PrintType`.

## REST API

All endpoints live under `/api`. Except for `/api/auth/*`, they require `Authorization: Bearer <jwt>`.

### Authentication — `/api/auth`
| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Sign up with email + password |
| `POST` | `/login` | Local login, returns a JWT |
| `POST` | `/google` | Login/sign-up with a Google ID token |

### Users — `/api/users`
| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Authenticated user's profile |
| `PATCH` | `/me` | Update profile |
| `POST` | `/me/password` | Change password |

### Books — `/api/books`
| Method | Path | Description |
|---|---|---|
| `GET` | `/search` | Search Google Books (simple and advanced) |
| `POST` | `/` | Create/import a book |
| `GET` | `/` | List books |
| `GET` | `/{id}` | Book detail |

### My library — `/api/user-books`
| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Add a book to the library |
| `GET` | `/me` | List the user's books |
| `PATCH` | `/{id}` | Update status, rating or progress |
| `DELETE` | `/{id}` | Remove a book from the library |

### Notes — `/api/notes`
| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create a note |
| `GET` | `/` | List all my notes |
| `GET` | `/by-book/{bookId}` | Notes for a given book |
| `GET` | `/{id}` | Note detail |
| `PATCH` | `/{id}` | Edit note |
| `DELETE` | `/{id}` | Delete note |

### Stats — `/api/stats`
| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Aggregated stats for the user |

## License

TBD.

---

_Author: [Miguel Salamanca](https://github.com/miguelsalamanca007)_
