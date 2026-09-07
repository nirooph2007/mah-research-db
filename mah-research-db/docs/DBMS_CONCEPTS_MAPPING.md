# DBMS Concept Mapping (MongoDB) — for your report & viva

Your syllabus is written in SQL vocabulary. MongoDB is not relational, so
every concept below is implemented as the closest correct MongoDB
equivalent — this is the standard, legitimate way NoSQL databases are
taught in DBMS courses. Use this table directly in your report, and use
the "Where" column to jump straight to the code during your viva.

| Requirement | SQL equivalent | MongoDB implementation | Where |
|---|---|---|---|
| **DDL** | `CREATE TABLE ...` | `db.createCollection(name, { validator: { $jsonSchema } })` — enforces required fields, types, enums | `backend/scripts/ddl_setup.js` |
| **DML** | `INSERT / SELECT / UPDATE / DELETE` | `insertOne/insertMany`, `find`, `updateOne`, `deleteOne` via Mongoose models, exposed through REST routes | `backend/routes/*.js`, `backend/scripts/seed.js` |
| **DCL** | `GRANT / REVOKE` | Role field (`superadmin/admin/reviewer/author`) enforced by middleware on every protected route; mirrors Atlas database-user roles (see below) | `backend/middleware/rbac.js` |
| **TCL** | `BEGIN / COMMIT / ROLLBACK` | `session.startTransaction()`, `commitTransaction()`, `abortTransaction()` — multi-document ACID transaction | `backend/scripts/transaction_demo.js`, `POST /api/papers` in `paperRoutes.js` |
| **SQL Clauses** | `WHERE / ORDER BY / LIMIT` | Query filters + `.sort()` + `.limit()` | `paperRoutes.js` (`GET /api/papers?status=...`) |
| **Joins** | `JOIN` | Aggregation `$lookup` stage | `journalRoutes.js` (`/:id/full`), `reportRoutes.js` |
| **Views** | `CREATE VIEW` | `db.createView(name, sourceCollection, pipeline)` | `backend/scripts/create_views.js` |
| **Triggers (min 2)** | `CREATE TRIGGER ... AFTER INSERT/UPDATE` | Mongoose schema **post-hooks**, which run inside the data layer automatically whenever a document is saved/updated — functionally identical to an AFTER trigger | Trigger 1: `models/Paper.js` (`post("findOneAndUpdate")`) — fires on publish. Trigger 2: `models/Review.js` (`post("save")`) — fires on new review |
| **Cursors (min 1)** | `DECLARE CURSOR ... FETCH NEXT` | `collection.find()` returns a cursor object; walked manually with `cursor.hasNext()` / `cursor.next()` | `backend/scripts/cursor_demo.js` |
| **Aggregate functions** | `COUNT/AVG/SUM + GROUP BY` | Aggregation pipeline: `$count`, `$avg`, `$group`, `$sum`, `$round` | `backend/routes/reportRoutes.js` |
| **PK / FK relationships** | `PRIMARY KEY / FOREIGN KEY` | `_id` (PK, auto-generated ObjectId) + explicit `ObjectId` reference fields (`authorId`, `journalId`, `paperId`, `reviewerId`, `userId`) validated at the schema level | `backend/models/*.js` |

## Why triggers are "real" triggers, not just app logic

A common viva challenge is: *"That's just backend code, not a database
trigger."* Two honest answers, both true here:

1. **Functionally**, the Mongoose post-hooks run inside the data-access
   layer immediately after the write completes and before control returns
   to the route handler — the route handler never manually calls them, the
   same way a SQL trigger fires without the application asking for it.
2. **If your evaluator specifically wants a trigger that lives inside the
   database itself** (not the app server), MongoDB Atlas supports genuine
   server-side **Database Triggers** (Atlas → Triggers → Add Trigger). The
   trigger functions for both events are provided in
   `docs/ATLAS_TRIGGERS.md` — paste them into the Atlas UI if you want a
   second, DB-native version to show alongside the app-level one.

## DCL at the database-connection level (bonus, optional)

If you want a literal `GRANT`/`REVOKE` to show as well: in MongoDB Atlas,
go to **Database Access → Add New Database User** and create two users:
- `app_readwrite` — role `readWrite` on `mah_research_db` (used by the backend)
- `report_readonly` — role `read` on `mah_research_db` (for querying/reporting only)

This is Atlas's literal equivalent of `GRANT SELECT` vs `GRANT ALL`, and
is worth a screenshot for the report if your evaluator wants DCL shown at
the database level rather than the app level.
