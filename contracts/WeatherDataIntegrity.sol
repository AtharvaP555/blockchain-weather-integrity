// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract WeatherDataIntegrity {
    struct WeatherRecord {
        string recordId;
        string stationId;
        uint256 timestamp;
        bytes32 dataHash;
        address registrant;
    }

    mapping(string => WeatherRecord) private records;

    event RecordRegistered(
        string indexed recordId,
        string stationId,
        uint256 timestamp,
        bytes32 dataHash,
        address registrant
    );

    function registerRecord(
        string memory recordId,
        string memory stationId,
        uint256 timestamp,
        bytes32 dataHash
    ) public {
        require(records[recordId].timestamp == 0, "Record already exists");

        records[recordId] = WeatherRecord(
            recordId,
            stationId,
            timestamp,
            dataHash,
            msg.sender
        );

        emit RecordRegistered(
            recordId,
            stationId,
            timestamp,
            dataHash,
            msg.sender
        );
    }

    function getRecord(
        string memory recordId
    ) public view returns (WeatherRecord memory) {
        require(records[recordId].timestamp != 0, "Record not found");
        return records[recordId];
    }
}