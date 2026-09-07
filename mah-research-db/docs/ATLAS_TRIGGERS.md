# MongoDB Atlas Database Triggers (optional, DB-native version)

These are true server-side triggers (not application code) that you can
create in **Atlas → Triggers → Add Trigger**, if you want to show your
evaluator a trigger that lives inside the database itself rather than in
the Node backend. They duplicate the logic already implemented at the
application level in `backend/models/Paper.js` and `backend/models/Review.js`
— you do not need both for the app to work, this is purely for the report/viva.

## Trigger 1 — `onPaperPublished`

- **Trigger type:** Database
- **Cluster:** your Atlas cluster
- **Database.Collection:** `mah_research_db.papers`
- **Operation type:** Update
- **Full Document:** On

```js
exports = async function (changeEvent) {
  const { fullDocument, updateDescription } = changeEvent;
  if (updateDescription.updatedFields.status !== "published") return;

  const notifications = context.services
    .get("mongodb-atlas")
    .db("mah_research_db")
    .collection("notifications");

  await notifications.insertOne({
    userId: fullDocument.authorId,
    message: `Your paper "${fullDocument.title}" has been published.`,
    type: "paper_published",
    read: false,
    createdAt: new Date(),
  });
};
```

## Trigger 2 — `onNewReview`

- **Trigger type:** Database
- **Database.Collection:** `mah_research_db.reviews`
- **Operation type:** Insert

```js
exports = async function (changeEvent) {
  const { fullDocument } = changeEvent;
  const db = context.services.get("mongodb-atlas").db("mah_research_db");

  const agg = await db
    .collection("reviews")
    .aggregate([
      { $match: { paperId: fullDocument.paperId } },
      { $group: { _id: "$paperId", avgScore: { $avg: "$score" } } },
    ])
    .toArray();

  const avgScore = agg[0] ? Math.round(agg[0].avgScore * 10) / 10 : fullDocument.score;

  await db.collection("papers").updateOne(
    { _id: fullDocument.paperId },
    { $set: { avgReviewScore: avgScore } }
  );
};
```

## How to demo this for a screenshot

1. Create both triggers in Atlas.
2. Publish a paper or add a review through the app UI.
3. Go to **Atlas → Triggers → [trigger name] → Logs** and screenshot the
   successful execution log entry.
