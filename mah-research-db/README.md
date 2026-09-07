# MAH Research Journal Portal — DBMS Mini Project (MongoDB)

A full-stack journal/peer-review management system built to demonstrate
DBMS concepts on MongoDB: schema validation (DDL), CRUD (DML), role-based
access (DCL), ACID transactions (TCL), triggers, cursors, joins,
aggregation, and views.

- **Frontend:** React (Vite) → deploy on **Vercel**
- **Backend:** Node.js / Express → deploy on **Render**
- **Database:** **MongoDB Atlas** (free M0 tier)

See `docs/ER_DIAGRAM.md` / `docs/ER_Diagram.png` for the schema, and
`docs/DBMS_CONCEPTS_MAPPING.md` for exactly where every required SQL
concept lives in this codebase — use that file for your viva.

---

## 1. Push this to GitHub (no local editor needed)

1. Go to [github.com/new](https://github.com/new) and create a new **empty**
   repository (don't add a README/gitignore — we already have them).
2. On the new repo's page, click **"uploading an existing file"**.
3. Drag the entire contents of this folder (the `backend/`, `frontend/`,
   `docs/` folders and the root files) into the upload box. Most browsers
   support dragging whole folders — GitHub preserves the folder structure.
   If your browser only accepts individual files, use **GitHub Desktop**
   (no coding, just a "Publish repository" button) instead — still no
   VS Code required.
4. Commit directly to `main`.

## 2. Create the database — MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register), sign up free.
2. Create a free **M0** cluster.
3. **Database Access** → Add New Database User → username/password (save these).
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) — fine for a student project.
5. **Database → Connect → Drivers** → copy the connection string, looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## 3. Deploy the backend — Render

1. [render.com](https://render.com) → New → Web Service → connect your GitHub repo.
2. Render should detect `backend/render.yaml`. If asked manually:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Add environment variables (Render dashboard → Environment):
   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string |
   | `DB_NAME` | `mah_research_db` |
   | `JWT_SECRET` | any long random string |
   | `CORS_ORIGIN` | your Vercel URL (set after step 4, or `*` for now) |
4. Deploy. Note your backend URL, e.g. `https://mah-research-backend.onrender.com`.

## 4. Deploy the frontend — Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → import the same GitHub repo.
2. **Root directory:** `frontend`
3. Framework preset: **Vite**.
4. Add environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://mah-research-backend.onrender.com/api` |
5. Deploy. Then go back to Render and set `CORS_ORIGIN` to your new Vercel URL, and redeploy the backend.

## 5. Set up the database schema and sample data

You need to run three one-off scripts against your Atlas database. Since
you're avoiding a local editor, the easiest way is **Render's Shell** tab
(Render → your service → **Shell**), which already has `MONGO_URI` loaded:

```bash
npm run ddl:setup      # creates 6 collections with schema validation
npm run dml:seed       # inserts sample users, journals, papers, a review
npm run views:create   # creates the published_papers_view
```

Alternatively run these from any machine with Node + your `.env` filled in
(copy `backend/.env.example` → `backend/.env`).

## 6. Log in

Seeded accounts (password for all: `Password@123`):
| Email | Role |
|---|---|
| `superadmin@mah.tech` | superadmin |
| `admin1@mah.tech` | admin |
| `reviewer1@mah.tech` | reviewer |
| `asha@student.edu` | author |

## 7. Generating the required report screenshots

| Requirement | Command | What to screenshot |
|---|---|---|
| Table creation | `npm run ddl:setup` | Console output ("+ Created collection...") |
| Data insertion | `npm run dml:seed` | Console output |
| Query execution | Use the deployed app (browse Journals/Papers) or `GET` requests in Postman | UI or JSON response |
| Trigger execution | `node scripts/trigger_demo.js` | Console lines starting `[TRIGGER ...] fired` |
| Cursor execution | `npm run demo:cursor` | Console `FETCH #1 -> ...` lines |
| TCL / transactions | `npm run demo:transaction` | Console `COMMIT successful` and `ROLLBACK triggered` lines |
| Application UI | The deployed Vercel site | Login, Journals, Paper submission, Review, Admin pages |

## Local development (optional, if you do want to run it locally to test first)

```bash
# backend
cd backend
cp .env.example .env   # fill in MONGO_URI
npm install
npm run ddl:setup
npm run dml:seed
npm run views:create
npm run dev             # http://localhost:5000

# frontend (separate terminal)
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # http://localhost:5173
```

## Project structure

```
mah-research-db/
├── backend/
│   ├── models/          # 6 Mongoose schemas = 6 "tables"
│   ├── routes/          # REST API (DML)
│   ├── middleware/      # auth + DCL (role-based access)
│   ├── scripts/         # DDL setup, seed, cursor/transaction/trigger/view demos
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/        # Login, Register, Journals, Papers, Admin, etc.
│       ├── context/       # auth state
│       └── api/           # axios client
└── docs/
    ├── ER_DIAGRAM.md + ER_Diagram.png
    ├── DBMS_CONCEPTS_MAPPING.md   # <- read this before your viva
    └── ATLAS_TRIGGERS.md          # optional DB-native trigger code
```
