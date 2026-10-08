const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI = [
  "function registerRecord(string recordId, string stationId, uint256 timestamp, bytes32 dataHash) public",
  "function getRecord(string recordId) public view returns (tuple(string recordId, string stationId, uint256 timestamp, bytes32 dataHash, address registrant))",
];

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet,
);

module.exports = {
  provider,
  wallet,
  contract,
};
