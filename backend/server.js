const express = require("express");
const cors = require("cors");

const { contract, provider } = require("./blockchain");
const { hashWeatherRecord } = require("./hash");
const {
  connectDatabase,
  saveWeatherRecord,
  getWeatherRecord,
  getAllWeatherRecords,
  updateWeatherRecord,
} = require("./weather");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Weather Integrity API is running",
  });
});

app.post("/api/weather/register", async (req, res) => {
  try {
    const record = req.body;

    if (!record.record_id || !record.station_id || !record.timestamp) {
      return res.status(400).json({
        error: "record_id, station_id and timestamp are required",
      });
    }

    const dataHash = hashWeatherRecord(record);

    const timestamp = Math.floor(new Date(record.timestamp).getTime() / 1000);

    const transaction = await contract.registerRecord(
      record.record_id,
      record.station_id,
      timestamp,
      "0x" + dataHash,
    );

    await transaction.wait();

    await saveWeatherRecord(record);

    res.status(201).json({
      message: "Weather record registered successfully",
      record_id: record.record_id,
      data_hash: dataHash,
      transaction_hash: transaction.hash,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/weather", async (req, res) => {
  try {
    const records = await getAllWeatherRecords();
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve weather records",
    });
  }
});

app.get("/api/weather/:recordId", async (req, res) => {
  const record = await getWeatherRecord(req.params.recordId);

  if (!record) {
    return res.status(404).json({
      error: "Weather record not found",
    });
  }

  res.json(record);
});

app.get("/api/weather/:recordId/verify", async (req, res) => {
  try {
    const record = await getWeatherRecord(req.params.recordId);

    if (!record) {
      return res.status(404).json({
        error: "Weather record not found",
      });
    }

    const computedHash = hashWeatherRecord(record);

    const blockchainRecord = await contract.getRecord(req.params.recordId);

    const registeredHash = blockchainRecord.dataHash.slice(2);

    const verified = computedHash === registeredHash;

    res.json({
      record_id: req.params.recordId,
      computed_hash: computedHash,
      registered_hash: registeredHash,
      verified,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/api/weather/tamper/:recordId", async (req, res) => {
  try {
    const record = await getWeatherRecord(req.params.recordId);

    if (!record) {
      return res.status(404).json({
        error: "Weather record not found",
      });
    }

    if (req.body.temperature === undefined) {
      return res.status(400).json({
        error: "temperature is required",
      });
    }

    await updateWeatherRecord(req.params.recordId, {
      temperature: Number(req.body.temperature),
    });

    const updatedRecord = await getWeatherRecord(req.params.recordId);

    res.json({
      message: "Weather record modified",
      record: updatedRecord,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/blockchain/:recordId", async (req, res) => {
  try {
    const blockchainRecord = await contract.getRecord(req.params.recordId);

    res.json({
      record_id: blockchainRecord.recordId,
      station_id: blockchainRecord.stationId,
      timestamp: Number(blockchainRecord.timestamp),
      data_hash: blockchainRecord.dataHash,
      registrant: blockchainRecord.registrant,
    });
  } catch (error) {
    console.error(error);

    res.status(404).json({
      error: "Blockchain record not found",
    });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();

    res.json({
      backend: "connected",
      blockchain: "connected",
      block_number: blockNumber,
    });
  } catch (error) {
    console.error("Status check failed:", error);

    res.status(503).json({
      backend: "connected",
      blockchain: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });
