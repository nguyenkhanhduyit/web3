import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Transaction Dex contract...");

  const Transactions = await ethers.getContractFactory("TransactionDex");
  const transactions = await Transactions.deploy();

  await transactions.deployed();

  const address = transactions.address;
  console.log("Transaction Dex deployed to:", address);

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
    path.join(infoPath, 'TransactionDexAddress.json'),
    JSON.stringify(transactionsAddress, null, 2)
  );
  console.log("Transaction Dex contract address saved to info/TransactionDexAddress.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 