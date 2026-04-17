# Notion Clone - Block Document Editor

A browser-based block document editor built from scratch without Tiptap, Slate, or ProseMirror.
The editor uses `contenteditable`-based blocks, a React frontend, and an Express/PostgreSQL backend.

## Live URL

https://frontend-delta-red-27.vercel.app/

## Setup Instructions



### Option 1: Docker Compose

1. Make sure Docker and Docker Compose are installed.
2. From the repository root, copy the backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Create `frontend/.env` and set the API URL if you want to override auto-detection:

```bash
echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
```

4. Update `backend/.env` with your local values.
5. Start the full stack:

```bash
docker compose -f backend/docker-compose.yml up --build
```

6. Open the app at `http://localhost:3000`.
7. The API is available at `http://localhost:5000`.

To stop the stack:

```bash
docker compose -f backend/docker-compose.yml down
```



### Option 2: Run Locally Without Docker

Use this if you want to run the frontend and backend separately:

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```

You will also need a running PostgreSQL instance and matching backend database settings.




## Environment Variables

Backend variables are documented in [`backend/.env.example`](backend/.env.example).

| Variable | What it does | Default / Notes |
| --- | --- | --- |
| `NODE_ENV` | Sets the runtime mode for logging, error handling, and SSL behavior. | `development` |
| `PORT` | Port used by the backend API server. | `5000` |
| `DB_HOST` | PostgreSQL host when using discrete connection settings. | `localhost` |
| `DB_PORT` | PostgreSQL port. | `5432` |
| `DB_NAME` | Database name for the app schema. | `notion_clone` |
| `DB_USER` | Database user. | `notion_user` in compose, custom for local installs |
| `DB_PASSWORD` | Password for the database user. | Set this in your local `.env` |
| `JWT_SECRET` | Signs access tokens. | Generate a long random string |
| `JWT_EXPIRES_IN` | Access token lifetime. | `15m` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens. | Generate a different long random string |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime. | `7d` |
| `ALLOWED_ORIGINS` | Comma-separated list of frontend origins allowed by CORS. | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds. | `900000` |
| `RATE_LIMIT_MAX` | Maximum API requests allowed per window. | `200` |
| `DATABASE_URL` / `DB_URL` | Optional full PostgreSQL connection string override. | Supported by code, not required by `.env.example` |
| `DB_SSL` | Forces SSL for managed Postgres providers. | `true` in production if set |

Frontend configuration:

| Variable | What it does | Default / Notes |
| --- | --- | --- |
| `VITE_API_URL` | Optional API base URL for the frontend. | If omitted, the app auto-discovers the local backend on common ports |



## Architecture Decisions

- Decision | Why it was chosen |
- React 18 + Vite | Fast local feedback, simple build output, and a clean path for a SPA editor UI. |
- Express backend | A lightweight REST layer is enough for auth, document CRUD, block CRUD, sharing, and trash flows. |
- PostgreSQL | The data model is naturally relational: users, documents, blocks, refresh tokens, and share tokens all fit well. |
- `contenteditable` blocks instead of a rich-text framework | This keeps editor behavior under direct control and avoids depending on Tiptap, Slate, or ProseMirror. |
- Decimal block ordering | `order_index` as a decimal makes drag-and-drop reordering stable without renumbering every block. |
- Soft deletes for documents and blocks | Trash and restore flows are easier to support when records are not removed immediately. |
- JWT access + refresh tokens | This gives short-lived access tokens with a safer recovery path when sessions expire. |
- Share tokens for public reads | Shared documents can be opened without authentication while staying read-only by default. |
- Docker Compose for local development | It makes the database, backend, and frontend reproducible with one command. |



## Known Issues

- Collaborative real-time editing is not implemented; this is still a single-user editor with shareable read-only links.
- The repository does not include a `frontend/.env.example`, so frontend API configuration is implicit unless you add `VITE_API_URL` yourself.
- A manually managed PostgreSQL instance may need `pgcrypto` enabled for `gen_random_uuid()` if you are not using the provided Docker image.
- Autosave is best-effort, so a network failure can leave the latest title or block edit unsaved until the next successful sync.
- Legacy `file` blocks are no longer supported by the current schema and are converted to paragraphs during initialization.



## Edge Case Decisions

- Empty or whitespace-only titles become `Untitled` so every document always has a valid display name.
- Expired access tokens trigger one refresh attempt before sending the user back to login so recovery is automatic when possible.
- Share-token routes reject all mutations with `403` so public links stay read-only by design.
- Local port conflicts are handled by retrying nearby ports in development because that makes `npm run dev` less fragile.
- If `VITE_API_URL` is not set, the frontend probes local backend health endpoints so the app can run without extra client config.
- Soft-deleted documents and blocks stay in trash instead of being hard-deleted immediately so restore remains possible.
- Legacy `file` blocks are converted to paragraphs during schema setup because the current block model only supports the implemented content types.
