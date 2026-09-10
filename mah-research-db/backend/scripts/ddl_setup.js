/**
 * DDL (Data Definition Language) equivalent for MongoDB.
 *
 * SQL:   CREATE TABLE users (...);
 * Mongo: db.createCollection("users", { validator: { $jsonSchema: {...} } })
 *
 * Run:   node scripts/ddl_setup.js
 * Take a screenshot of this script's console output for your report
 * ("Table creation").
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

async function createCollectionSafe(db, name, schema, indexes = []) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length > 0) {
    console.log(`- Collection "${name}" already exists, applying validator only.`);
    await db.command({ collMod: name, validator: { $jsonSchema: schema }, validationLevel: "moderate" });
  } else {
    await db.createCollection(name, { validator: { $jsonSchema: schema } });
    console.log(`+ Created collection "${name}" with schema validation.`);
  }
  for (const idx of indexes) {
    await db.collection(name).createIndex(idx.key, idx.options || {});
    console.log(`  -> index created on ${name}: ${JSON.stringify(idx.key)}`);
  }
}

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "mah_research_db");
  console.log(`Connected. Running DDL against database: ${db.databaseName}\n`);

  await createCollectionSafe(
    db,
    "users",
    {
      bsonType: "object",
      required: ["name", "email", "passwordHash", "role"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        role: { enum: ["superadmin", "admin", "reviewer", "author"] },
        affiliation: { bsonType: "string" },
      },
    },
    [{ key: { email: 1 }, options: { unique: true } }]
  );

  await createCollectionSafe(
    db,
    "journals",
    {
      bsonType: "object",
      required: ["title", "shortCode", "field"],
      properties: {
        title: { bsonType: "string" },
        shortCode: { bsonType: "string" },
        field: { bsonType: "string" },
        frequency: { enum: ["Monthly", "Quarterly", "Biannual", "Annual"] },
      },
    },
    [{ key: { shortCode: 1 }, options: { unique: true } }]
  );

  await createCollectionSafe(
    db,
    "paper",
    {
      bsonType: "object",
      required: ["title", "abstract", "authorId", "journalId", "status"],
      properties: {
        title: { bsonType: "string" },
        abstract: { bsonType: "string" },
        authorId: { bsonType: "objectId" },
        journalId: { bsonType: "objectId" },
        status: { enum: ["submitted", "under_review", "accepted", "rejected", "published"] },
        avgReviewScore: { bsonType: ["double", "int", "null"] },
      },
    },
    [{ key: { journalId: 1 } }, { key: { authorId: 1 } }, { key: { status: 1 } }]
  );

  await createCollectionSafe(
    db,
    "reviews",
    {
      bsonType: "object",
      required: ["paperId", "reviewerId", "score", "recommendation"],
      properties: {
        paperId: { bsonType: "objectId" },
        reviewerId: { bsonType: "objectId" },
        score: { bsonType: ["double", "int"], minimum: 1, maximum: 10 },
        recommendation: { enum: ["accept", "minor_revision", "major_revision", "reject"] },
      },
    },
    [{ key: { paperId: 1 } }]
  );

  await createCollectionSafe(
    db,
    "editorialassignments",
    {
      bsonType: "object",
      required: ["journalId", "userId", "boardRole"],
      properties: {
        journalId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        boardRole: { enum: ["Editor-in-Chief", "Associate Editor", "Reviewer"] },
      },
    },
    [{ key: { journalId: 1, userId: 1 }, options: { unique: true } }]
  );

  await createCollectionSafe(
    db,
    "notifications",
    {
      bsonType: "object",
      required: ["userId", "message", "type"],
      properties: {
        userId: { bsonType: "objectId" },
        message: { bsonType: "string" },
        type: { enum: ["paper_published", "new_review", "status_change"] },
        read: { bsonType: "bool" },
      },
    },
    [{ key: { userId: 1 } }]
  );

  console.log("\nDDL setup complete: 6 collections ready (users, journals, paper, reviews, editorialassignments, notifications).");
  await client.close();
}

main().catch((err) => {
  console.error("DDL setup failed:", err);
  process.exit(1);
});
