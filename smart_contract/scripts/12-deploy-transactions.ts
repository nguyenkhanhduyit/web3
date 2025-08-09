import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Transactions contract...");

  const Transactions = await ethers.getContractFactory("Transactions");
  const transactions = await Transactions.deploy();

  await transactions.waitForDeployment();

  const address = await transactions.getAddress();
  console.log("Transactions deployed to:", address);

  // Save the contract address to a JSON file
  const fs = require('fs');
  const path = require('path');
  
  const infoPath = path.join(__dirname, '../info');
  if (!fs.existsSync(infoPath)) {
    fs.mkdirSync(infoPath, { recursive: true });
  }

  const transactionsAddress = {
    TransactionsAddress: address
  };

  fs.writeFileSync(
    path.join(infoPath, 'TransactionsAddress.json'),
    JSON.stringify(transactionsAddress, null, 2)
  );

  console.log("Transactions contract address saved to info/TransactionsAddress.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 