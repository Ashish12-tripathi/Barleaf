
require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

async function importData() {
  const filePath = path.join(
    __dirname,
    "../data/bookleaf_sample_data.json"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data || Array.isArray(data) || typeof data !== "object") {
    throw new Error(
      "Expected a JSON object containing arrays of records."
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  try {
    let imported = 0;

    for (const [key, records] of Object.entries(data)) {
      if (!Array.isArray(records)) {
        console.log(`Skipping "${key}": value is not an array`);
        continue;
      }

      if (records.length === 0) {
        console.log(`Skipping "${key}": array is empty`);
        continue;
      }

      if (
        !records.every(
          (record) =>
            record !== null &&
            typeof record === "object" &&
            !Array.isArray(record)
        )
      ) {
        console.log(`Skipping "${key}": not an array of objects`);
        continue;
      }

      const collectionName = key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");

      if (!collectionName) {
        throw new Error(`Invalid collection name for "${key}"`);
      }

      const collection =
        mongoose.connection.collection(collectionName);

      const result = await collection.insertMany(records, {
        ordered: true
      });

      imported += result.insertedCount;

      console.log(
        `Imported ${result.insertedCount} records into "${collectionName}"`
      );
    }

    console.log(`Import complete. Total records inserted: ${imported}`);
  } finally {
    await mongoose.disconnect();
  }
}

importData().catch((error) => {
  console.error("Import failed:", error.message);
  process.exitCode = 1;
});