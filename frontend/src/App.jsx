import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [records, setRecords] = useState([]);
  const [verificationResults, setVerificationResults] = useState({});
  const [detailedVerification, setDetailedVerification] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");
  const [tampering, setTampering] = useState(false);
  const [tamperTemperature, setTamperTemperature] = useState("");
  const [tamperMessage, setTamperMessage] = useState("");
  const [blockchainConnected, setBlockchainConnected] = useState(false);
  const [blockNumber, setBlockNumber] = useState(null);
  const [blockchainRecord, setBlockchainRecord] = useState(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  const verifyRecord = async (recordId) => {
    try {
      setVerifying(true);
      setError("");

      const response = await api.get(`/weather/${recordId}/verify`);

      // Keep the dashboard/table status updated
      setVerificationResults((previous) => ({
        ...previous,
        [recordId]: response.data,
      }));

      // Store the result specifically for the detailed Integrity section
      setDetailedVerification(response.data);
    } catch (err) {
      console.error(err);
      setError(`Unable to verify record ${recordId}.`);
    } finally {
      setVerifying(false);
    }
  };

  const fetchBlockchainRecord = async (recordId) => {
    try {
      setBlockchainLoading(true);

      const response = await api.get(`/blockchain/${recordId}`);

      setBlockchainRecord(response.data);
    } catch (err) {
      console.error(err);
      setBlockchainRecord(null);
    } finally {
      setBlockchainLoading(false);
    }
  };

  const registerRecord = async (record) => {
    try {
      setRegistering(true);
      setRegisterMessage("");
      setError("");

      const response = await api.post("/weather/register", record);

      setRegisterMessage(
        `Record ${response.data.record_id} registered successfully.`,
      );

      const recordsResponse = await api.get("/weather");
      setRecords(recordsResponse.data);

      const verification = await api.get(`/weather/${record.record_id}/verify`);

      setVerificationResults((previous) => ({
        ...previous,
        [record.record_id]: verification.data,
      }));

      setSelectedRecord(record.record_id);
      setDetailedVerification(null);

      fetchBlockchainRecord(record.record_id);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.error || "Unable to register weather record.";

      setError(message);
    } finally {
      setRegistering(false);
    }
  };

  const tamperRecord = async () => {
    if (!selectedRecord) {
      setTamperMessage("Select a record first.");
      return;
    }

    if (tamperTemperature === "") {
      setTamperMessage("Enter a new temperature.");
      return;
    }

    try {
      setTampering(true);
      setTamperMessage("");
      setError("");

      await api.post(`/weather/tamper/${selectedRecord}`, {
        temperature: Number(tamperTemperature),
      });

      setTamperMessage(
        `Record ${selectedRecord} modified. Run verification to detect the change.`,
      );

      const recordsResponse = await api.get("/weather");
      setRecords(recordsResponse.data);

      const verification = await api.get(`/weather/${selectedRecord}/verify`);

      setVerificationResults((previous) => ({
        ...previous,
        [selectedRecord]: verification.data,
      }));
      setDetailedVerification(null);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.error || "Unable to modify the weather record.";

      setError(message);
    } finally {
      setTampering(false);
    }
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const statusResponse = await api.get("/status");

        setBlockchainConnected(statusResponse.data.blockchain === "connected");

        setBlockNumber(statusResponse.data.block_number);

        const response = await api.get("/weather");
        const weatherRecords = response.data;

        setRecords(weatherRecords);

        const results = await Promise.all(
          weatherRecords.map(async (record) => {
            try {
              const verification = await api.get(
                `/weather/${record.record_id}/verify`,
              );

              return [record.record_id, verification.data];
            } catch (err) {
              console.error(
                `Verification failed for ${record.record_id}:`,
                err,
              );

              return [
                record.record_id,
                {
                  verified: false,
                  error: true,
                },
              ];
            }
          }),
        );

        setVerificationResults(Object.fromEntries(results));
        if (weatherRecords.length > 0) {
          setSelectedRecord(weatherRecords[0].record_id);
          fetchBlockchainRecord(weatherRecords[0].record_id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to connect to the backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const verifiedCount = Object.values(verificationResults).filter(
    (result) => result.verified === true,
  ).length;

  const tamperedCount = Object.values(verificationResults).filter(
    (result) => result.verified === false && !result.error,
  ).length;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="24" cy="24" r="19" className="logo-ring" />

              <circle
                cx="24"
                cy="24"
                r="11"
                className="logo-ring logo-ring-inner"
              />

              <circle cx="24" cy="24" r="3" className="logo-core" />

              <path d="M30 29 L34 33 L41 25" className="logo-check" />

              <path
                d="M24 5 V9 M43 24 H39 M24 43 V39 M5 24 H9"
                className="logo-ticks"
              />
            </svg>
          </div>

          <div>
            <h1>Weather Data Integrity</h1>
            <p>Blockchain-Based Verification System</p>
          </div>
        </div>

        <div className="blockchain-status">
          <span
            className={`status-dot ${
              blockchainConnected ? "connected" : "disconnected"
            }`}
          ></span>

          {blockchainConnected
            ? `Blockchain Connected · Block ${blockNumber}`
            : "Blockchain Disconnected"}
        </div>
      </header>

      <main className="main-content">
        <section className="summary-grid">
          <div className="summary-card">
            <span className="card-label">Total Records</span>
            <span className="card-value">{records.length}</span>
          </div>

          <div className="summary-card">
            <span className="card-label">Verified</span>
            <span className="card-value verified-value">{verifiedCount}</span>
          </div>

          <div className="summary-card">
            <span className="card-label">Tampered</span>
            <span className="card-value tampered-value">{tamperedCount}</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Weather Records</h2>
              <p>Weather observations stored off-chain in MongoDB</p>
            </div>
          </div>

          {loading && <p className="panel-message">Loading records...</p>}

          {error && <p className="error">{error}</p>}

          {!loading && !error && records.length === 0 && (
            <p className="panel-message">No weather records found.</p>
          )}

          {!loading && !error && records.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Station</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Pressure</th>
                    <th>Precipitation</th>
                    <th>Wind Speed</th>
                    <th>Integrity</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => {
                    const verification = verificationResults[record.record_id];

                    return (
                      <tr
                        key={record.record_id}
                        className={
                          selectedRecord === record.record_id
                            ? "selected-row"
                            : ""
                        }
                        onClick={() => {
                          setSelectedRecord(record.record_id);
                          setDetailedVerification(null);
                          fetchBlockchainRecord(record.record_id);
                        }}
                      >
                        <td>{record.record_id}</td>
                        <td>{record.station_id}</td>
                        <td>{record.temperature} °C</td>
                        <td>{record.relative_humidity} %</td>
                        <td>{record.pressure} hPa</td>
                        <td>{record.precipitation} mm</td>
                        <td>{record.wind_speed} km/h</td>

                        <td>
                          {verification ? (
                            <span
                              className={
                                verification.verified
                                  ? "integrity-badge verified"
                                  : "integrity-badge tampered"
                              }
                            >
                              {verification.verified ? "VERIFIED" : "TAMPERED"}
                            </span>
                          ) : (
                            <span className="integrity-badge pending">
                              CHECKING
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="verification-section">
          <div className="verification-heading">
            <div>
              <span className="section-index">01 / INTEGRITY</span>

              <h2>Cryptographic Verification</h2>

              <p>
                Recompute the record hash and compare it against the blockchain
                commitment.
              </p>
            </div>

            {selectedRecord && (
              <button
                className="verify-button"
                onClick={() => verifyRecord(selectedRecord)}
                disabled={verifying}
              >
                {verifying ? "VERIFYING..." : "VERIFY RECORD"}
              </button>
            )}
          </div>

          {selectedRecord && !detailedVerification && (
            <div className="verification-empty verification-ready">
              <span>RECORD {selectedRecord} SELECTED</span>

              <p>
                Run cryptographic verification to compare the current weather
                record against its blockchain commitment.
              </p>
            </div>
          )}

          {detailedVerification &&
            detailedVerification.record_id === selectedRecord &&
            !detailedVerification.error && (
              <div
                className={`verification-result ${
                  detailedVerification.verified
                    ? "result-verified"
                    : "result-tampered"
                }`}
              >
                <div className="result-header">
                  <div>
                    <span className="result-label">
                      RECORD {detailedVerification.record_id}
                    </span>

                    <h3>
                      {detailedVerification.verified
                        ? "INTEGRITY VERIFIED"
                        : "INTEGRITY CHECK FAILED"}
                    </h3>
                  </div>

                  <span className="result-symbol">
                    {detailedVerification.verified ? "✓" : "×"}
                  </span>
                </div>

                <div className="hash-grid">
                  <div className="hash-block">
                    <span>COMPUTED HASH</span>
                    <code>{detailedVerification.computed_hash}</code>
                  </div>

                  <div className="hash-block">
                    <span>REGISTERED HASH</span>
                    <code>{detailedVerification.registered_hash}</code>
                  </div>
                </div>

                <p className="verification-description">
                  {detailedVerification.verified
                    ? "The current weather record matches the cryptographic commitment registered on the blockchain."
                    : "The current weather record does not match the cryptographic commitment registered on the blockchain. The stored record has been modified."}
                </p>
              </div>
            )}

          {!selectedRecord && !loading && (
            <div className="verification-empty">
              <span>NO RECORD SELECTED</span>

              <p>
                Select a record from the table to begin cryptographic
                verification.
              </p>
            </div>
          )}
        </section>
        <section className="blockchain-section">
          <div className="blockchain-heading">
            <div>
              <span className="section-index">02 / BLOCKCHAIN</span>
              <h2>Blockchain Record</h2>
              <p>
                Immutable registration data retrieved directly from the local
                blockchain.
              </p>
            </div>
          </div>

          {blockchainLoading ? (
            <div className="blockchain-loading">
              Reading blockchain record...
            </div>
          ) : blockchainRecord ? (
            <div className="blockchain-evidence">
              <div className="evidence-item">
                <span>RECORD ID</span>
                <strong>{blockchainRecord.record_id}</strong>
              </div>

              <div className="evidence-item">
                <span>STATION ID</span>
                <strong>{blockchainRecord.station_id}</strong>
              </div>

              <div className="evidence-item">
                <span>REGISTERED TIMESTAMP</span>
                <strong>
                  {new Date(
                    Number(blockchainRecord.timestamp) * 1000,
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="evidence-item">
                <span>REGISTRANT</span>
                <strong className="hash-value">
                  {blockchainRecord.registrant}
                </strong>
              </div>

              <div className="evidence-item evidence-wide">
                <span>REGISTERED SHA-256 HASH</span>
                <strong className="hash-value">
                  {blockchainRecord.data_hash}
                </strong>
              </div>
            </div>
          ) : (
            <div className="blockchain-loading">
              No blockchain record selected.
            </div>
          )}
        </section>
        <section className="registration-section">
          <div className="registration-heading">
            <div>
              <span className="section-index">03 / REGISTER</span>
              <h2>Register Weather Observation</h2>
              <p>Create a cryptographic commitment for a new weather record.</p>
            </div>
          </div>

          <form
            className="registration-form"
            onSubmit={async (event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              const record = {
                record_id: formData.get("record_id"),
                station_id: formData.get("station_id"),
                timestamp: new Date(formData.get("timestamp")).toISOString(),
                temperature: Number(formData.get("temperature")),
                relative_humidity: Number(formData.get("relative_humidity")),
                pressure: Number(formData.get("pressure")),
                precipitation: Number(formData.get("precipitation")),
                wind_speed: Number(formData.get("wind_speed")),
              };

              await registerRecord(record);

              event.currentTarget.reset();
            }}
          >
            <div className="form-grid">
              <label>
                <span>RECORD ID</span>
                <input
                  name="record_id"
                  type="text"
                  placeholder="WX003"
                  required
                />
              </label>

              <label>
                <span>STATION ID</span>
                <input
                  name="station_id"
                  type="text"
                  placeholder="MBL001"
                  required
                />
              </label>

              <label>
                <span>TIMESTAMP</span>
                <input name="timestamp" type="datetime-local" required />
              </label>

              <label>
                <span>TEMPERATURE °C</span>
                <input
                  name="temperature"
                  type="number"
                  step="0.01"
                  placeholder="27.80"
                  required
                />
              </label>

              <label>
                <span>RELATIVE HUMIDITY %</span>
                <input
                  name="relative_humidity"
                  type="number"
                  step="0.01"
                  placeholder="68.00"
                  required
                />
              </label>

              <label>
                <span>PRESSURE hPa</span>
                <input
                  name="pressure"
                  type="number"
                  step="0.01"
                  placeholder="1009.40"
                  required
                />
              </label>

              <label>
                <span>PRECIPITATION mm</span>
                <input
                  name="precipitation"
                  type="number"
                  step="0.01"
                  placeholder="2.60"
                  required
                />
              </label>

              <label>
                <span>WIND SPEED km/h</span>
                <input
                  name="wind_speed"
                  type="number"
                  step="0.01"
                  placeholder="10.20"
                  required
                />
              </label>
            </div>

            <div className="registration-footer">
              <div className="registration-note">
                <span className="status-dot"></span>
                Hash generated server-side · commitment stored on-chain
              </div>

              <button
                type="submit"
                className="register-button"
                disabled={registering}
              >
                {registering ? "REGISTERING..." : "REGISTER OBSERVATION"}
              </button>
            </div>

            {registerMessage && (
              <div className="registration-success">{registerMessage}</div>
            )}
          </form>
        </section>
        <section className="tamper-section">
          <div className="tamper-heading">
            <div>
              <span className="section-index">04 / TAMPER TEST</span>
              <h2>Demonstrate Record Modification</h2>
              <p>
                Modify the off-chain record and observe how blockchain
                verification detects the change.
              </p>
            </div>
          </div>

          <div className="tamper-panel">
            <div className="tamper-record">
              <span>SELECTED RECORD</span>
              <strong>{selectedRecord || "NONE"}</strong>

              {selectedRecord && (
                <small>
                  CURRENT TEMPERATURE{" "}
                  {records
                    .find((record) => record.record_id === selectedRecord)
                    ?.temperature?.toFixed(2)}{" "}
                  °C
                </small>
              )}
            </div>

            <div className="tamper-input">
              <label htmlFor="tamper-temperature">NEW TEMPERATURE °C</label>

              <input
                id="tamper-temperature"
                type="number"
                step="0.01"
                value={tamperTemperature}
                onChange={(event) => setTamperTemperature(event.target.value)}
                placeholder="38.50"
              />
            </div>

            <button
              className="tamper-button"
              onClick={tamperRecord}
              disabled={tampering || !selectedRecord}
            >
              {tampering ? "MODIFYING..." : "MODIFY RECORD"}
            </button>
          </div>

          {tamperMessage && (
            <div className="tamper-message">{tamperMessage}</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
