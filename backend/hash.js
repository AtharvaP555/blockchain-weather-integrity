const crypto = require("crypto");

function canonicalizeWeatherRecord(record) {
  return JSON.stringify({
    station_id: record.station_id,
    timestamp: record.timestamp,
    temperature: Number(record.temperature).toFixed(2),
    relative_humidity: Number(record.relative_humidity).toFixed(2),
    pressure: Number(record.pressure).toFixed(2),
    precipitation: Number(record.precipitation).toFixed(2),
    wind_speed: Number(record.wind_speed).toFixed(2),
  });
}

function hashWeatherRecord(record) {
  const canonicalData = canonicalizeWeatherRecord(record);

  return crypto
    .createHash("sha256")
    .update(canonicalData, "utf8")
    .digest("hex");
}

module.exports = {
  canonicalizeWeatherRecord,
  hashWeatherRecord,
};
