const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI);

let db;
let weatherCollection;

async function connectDatabase() {
  await client.connect();

  db = client.db("weather_integrity");
  weatherCollection = db.collection("weather_records");

  console.log("MongoDB Atlas connected");
}

async function saveWeatherRecord(record) {
  await weatherCollection.insertOne(record);
  return record;
}

async function getWeatherRecord(recordId) {
  return await weatherCollection.findOne({
    record_id: recordId,
  });
}

async function getAllWeatherRecords() {
  return await weatherCollection.find({}).toArray();
}

async function updateWeatherRecord(recordId, updates) {
  return await weatherCollection.updateOne(
    { record_id: recordId },
    { $set: updates },
  );
}

module.exports = {
  connectDatabase,
  saveWeatherRecord,
  getWeatherRecord,
  getAllWeatherRecords,
  updateWeatherRecord,
};
