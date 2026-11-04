# Lambat API

The backend for Lambat, a post-catch loss prevention platform for fisherfolk. It estimates how long a catch will keep, warns when time is short, explains the estimate in plain words, and connects fisherfolk with buyers.

Node 20+, Express 5, TypeScript, Prisma, PostgreSQL (Supabase).

## Run it locally

```powershell
cd Backend
npm install
copy .env.example .env        # then fill in .env
npx prisma migrate deploy
npx prisma generate
npx ts-node prisma\seed.ts
npx ts-node prisma\create-admin.ts 09XXXXXXXXX "Your Name" "a-long-password"
npm run dev                   # http://localhost:4000
```

Run every `npx ts-node prisma\...` script from the `Backend` folder.

## Environment variables

| Name | Needed | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Supabase transaction pooler (port 6543, ends with `?pgbouncer=true`) |
| `DIRECT_URL` | yes | Supabase session pooler (port 5432), used for migrations |
| `JWT_SECRET` | yes | At least 32 random characters |
| `CORS_ORIGINS` | deploy | Website addresses allowed to call the API, separated by commas |
| `LLM_API_KEY` | no | Leave empty to use the fixed template text for explanations |
| `LLM_BASE_URL` | no | OpenAI-compatible endpoint of the AI provider |
| `LLM_MODEL` | no | Model name (`npx ts-node prisma\check-llm.ts` lists valid ones) |
| `PORT` | no | Defaults to 4000 |

Real values live only in `.env` and in the host's settings page. `.env.example` holds placeholders only, because it is committed. Any `.env.*` file other than `.env.example` is ignored by git.

## Scripts

Run from `Backend`.

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with auto-restart |
| `npm run build` / `npm start` | Production build and start |
| `npm run test:api` | Full API regression test (asks for the admin login). Against a live server: `npm run test:api -- -Base https://YOUR-API/api` |
| `npm run preflight` | Checks environment, leaked keys, types and migrations |
| `npm run prod:setup` | Migrate, seed and create the admin on the production database |
| `npm run prod:cleanup` | Remove test accounts from the production database |
| `npx ts-node prisma\seed.ts` | Species and their shelf-life numbers |
| `npx ts-node prisma\create-admin.ts <mobile> "<name>" "<password>"` | Create an admin, or reset an existing admin's password |
| `npx ts-node prisma\list-users.ts` | List accounts (no passwords) |
| `npx ts-node prisma\reset-password.ts <mobile>` | Reset a fisherfolk or buyer password (set `NEW_PASSWORD` first) |
| `npx ts-node prisma\import-pathways.ts [--check]` | Load `prisma\pathways.csv` (`--check` only validates) |
| `npx ts-node prisma\seed-demo.ts "<password>"` | Demo accounts with sample catches |
| `npx ts-node prisma\cleanup-test-data.ts [--yes] [--include-demo]` | Delete test data (dry run unless `--yes`) |
| `npx ts-node prisma\ice-check.ts <species> <kg> <hours> <ice kg>` | Show how ice changes time left |
| `npx ts-node prisma\check-llm.ts` | Check the AI key and model |

## API

All routes are under `/api`, send and return JSON, and take `Authorization: Bearer <token>`. Errors look like `{ "error": "message" }`. A 401 means the session is no longer valid.

**Public**
- `GET /health`, `GET /species`

**Auth** (`/auth`)
- `POST /register` (fisherfolk, or buyer who then waits for approval), `POST /login`
- `GET /me`, `PATCH /me`, `POST /change-password`, `PATCH /reapply` (declined buyer)

**Catches** (`/catches`, fisherfolk)
- `POST /`, `GET /`, `GET /:id`
- `POST /:id/ice` (add ice), `PATCH /:id/outcome`, `PATCH /:id/reopen`
- `GET /:id/pathways`, `POST /:id/explain`

**Marketplace**
- Needs (`/needs`): `POST /`, `GET /mine`, `GET /matches?catchId=`, `PATCH /:id/cancel`
- Offers (`/offers`): `POST /`, `GET /mine`, `PATCH /:id/accept`, `/decline`, `/withdraw`
- Orders (`/orders`): `GET /mine`, `PATCH /:id/complete`, `/cancel`

**Information**
- Advisories (`/advisories`): `GET /` (mine), admin: `GET /all`, `POST /`, `PATCH /:id/deactivate`
- Notifications (`/notifications`): `GET /`, `PATCH /:id/read`, `POST /read-all`
- Weather (`/weather?lat=&lon=`): forecast with a 15-minute cache

**Admin** (`/admin`)
- Users: `GET /users`, `POST /users`, `PATCH /users/:id/status`, `PATCH /users/:id/password`
- `GET /stats`
- Species: `PATCH /species/:id`
- Pathways: `GET /pathways`, `POST /pathways`, `PATCH /pathways/:id`
- Moderation: `GET /catches`, `GET /needs`, `GET /offers`, `GET /orders` (each takes `?status=` and `?limit=`), `PATCH /needs/:id/cancel`

## Deploying

The repository has a `render.yaml` blueprint for the API and the frontend. The API's root directory is `Backend` (the capital B matters on Linux hosts).

1. Create a separate Supabase project for production and put its two connection strings in `Backend\.env.production` (git ignores it), then run `npm run prod:setup` and delete the file.
2. Create the blueprint on the host, and enter `DATABASE_URL`, `DIRECT_URL`, a new `JWT_SECRET`, `LLM_API_KEY`, `LLM_MODEL` and `CORS_ORIGINS` in its settings.
3. Set the frontend's `VITE_API_URL` to the API address plus `/api`.
4. Run `npm run test:api -- -Base https://YOUR-API/api`, then `npm run prod:cleanup`.

The API sleeps on a free host after a while without traffic. Open `/api/health` a minute before a demo to wake it.

## Rules the code enforces

- Only fisherfolk and buyers can register. Admin and organization accounts are created by an admin.
- Buyers are `PENDING` until an admin approves them, and cannot post needs or accept offers before that. A declined buyer sees the reason and can apply again.
- A catch with high or critical risk never gets a value-added pathway. That rule lives in the code, not in the data, and the admin API refuses a pathway that allows high risk.
- AI explanations only use numbers the server calculated. Any number the model invents is rejected, and the fixed template text is used instead.
- A suspended account stops working on its next request. A password change ends older sessions.
- Risk warnings are raised once per catch and per level when the person opens their notifications.

## Known limits

- The shelf-life constants (spoilage formula, ice temperatures, 25 kg per sack, risk thresholds) are placeholders. Responses say `placeholder: true` until they are replaced with sourced values in `src/config/shelfLife.ts` and in the frontend `estimator.ts`.
- There is no SMS yet. An admin resets forgotten passwords with `reset-password.ts`.
- The organization role has no endpoints yet.
- The pathway table must be filled from `prisma\pathways.csv`. Until then the app says there is no pathway for a fish.