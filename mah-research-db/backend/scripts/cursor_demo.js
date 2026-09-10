/**
 * CURSOR demo (native MongoDB driver).
 *
 * db.collection.find() does NOT return the results directly -- it returns
 * a CURSOR, a pointer to the result set on the server. This script walks
 * the cursor manually with hasNext()/next(), exactly like a PL/SQL
 * explicit cursor (OPEN / FETCH / CLOSE).
 *
 * Run: node scripts/cursor_demo.js
 * Take a screenshot of the output for your report ("Cursor execution").
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "mah_research_db");

  console.log("OPEN CURSOR on paper collection (status = 'submitted' OR 'under_review')\n");

  const cursor = db.collection("paper").find(
    { status: { $in: ["submitted", "under_review"] } },
    { projection: { title: 1, status: 1, avgReviewScore: 1 } }
  ).sort({ createdAt: -1 });

  let row = 1;
  while (await cursor.hasNext()) {
    const doc = await cursor.next(); // FETCH NEXT
    console.log(
      `FETCH #${row++} -> _id=${doc._id} | title="${doc.title}" | status=${doc.status} | avgReviewScore=${doc.avgReviewScore ?? "N/A"}`
    );
  }

  console.log("\nCLOSE CURSOR (no more rows).");
  await cursor.close();
  await client.close();
}

main().catch((err) => {
  console.error("Cursor demo failed:", err);
  process.exit(1);
});
