/**
 * VIEW demo.
 * SQL:   CREATE VIEW published_papers_view AS SELECT ... FROM papers JOIN journals ...
 * Mongo: db.createView(name, sourceCollection, pipeline)
 *
 * Run: node scripts/create_views.js
 * Then query it like a normal (read-only) collection, e.g. from
 * routes/reportRoutes.js -> GET /api/reports/published-view
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "mah_research_db");

  const existing = await db.listCollections({ name: "published_papers_view" }).toArray();
  if (existing.length > 0) {
    await db.collection("published_papers_view").drop();
    console.log("Dropped existing view to recreate it.");
  }

  await db.createCollection("published_papers_view", {
    viewOn: "paper",
    pipeline: [
      { $match: { status: "published" } },
      {
        $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" },
      },
      { $unwind: "$journal" },
      {
        $lookup: { from: "users", localField: "authorId", foreignField: "_id", as: "author" },
      },
      { $unwind: "$author" },
      {
        $project: {
          title: 1,
          doi: 1,
          avgReviewScore: 1,
          publishedAt: 1,
          "journal.title": 1,
          "journal.shortCode": 1,
          "author.name": 1,
          "author.email": 1,
        },
      },
    ],
  });

  console.log('View "published_papers_view" created on top of the paper collection.');
  await client.close();
}

main().catch((err) => {
  console.error("View creation failed:", err);
  process.exit(1);
});
