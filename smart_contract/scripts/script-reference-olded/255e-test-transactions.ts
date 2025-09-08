import { ethers } from "hardhat";

async function main() {
  console.log("Testing Transactions contract...");

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();

  // Deploy Transactions contract
  const Transactions = await ethers.getContractFactory("Transactions");
  const transactions = await Transactions.deploy();
  await transactions.waitForDeployment();

  const address = await transactions.getAddress();
  console.log("Transactions deployed to:", address);

  console.log("\n=== Testing Transaction Features ===");

  // Test 1: Make a successful transaction
  console.log("\n1. Testing successful transaction...");
  const txValue = ethers.parseEther("0.006"); // 0.006 ETH
  
  try {
    const tx = await transactions.connect(user1).makeTransaction(user2.address, txValue, {
      value: txValue
    });
    await tx.wait();
    console.log("Successful transaction made from", user1.address, "to", user2.address);
  } catch (error) {
    console.log("Transaction failed:", error);
  }

  // Test 2: Get transaction count
  console.log("\n2. Testing getMyTransactionCount...");
  const count = await transactions.connect(user1).getMyTransactionCount();
  console.log("Transaction count for user1:", count.toString());

  // Test 3: Get transaction history
  console.log("\n3. Testing getMyTransactions...");
  try {
    const userTransactions = await transactions.connect(user1).getMyTransactions(0, 10);
    console.log("User transactions:", userTransactions.length);
    if (userTransactions.length > 0) {
      const tx = userTransactions[0];
      console.log("First transaction:");
      console.log("  Sender:", tx.sender);
      console.log("  Receiver:", tx.receiver);
      console.log("  Value:", ethers.formatEther(tx.value), "ETH");
      console.log("  Timestamp:", new Date(Number(tx.timestamp) * 1000).toLocaleString());
      console.log("  State:", tx.state); // 0=Pending, 1=Success, 2=Failed
    }
  } catch (error) {
    console.log("Error getting transactions:", error);
  }

  // Test 4: Test transaction with invalid value (too low)
  console.log("\n4. Testing transaction with invalid value (too low)...");
  try {
    const lowValue = ethers.parseEther("0.004"); // Below minimum
    const tx = await transactions.connect(user1).makeTransaction(user2.address, lowValue, {
      value: lowValue
    });
    await tx.wait();
    console.log("Transaction should have failed but succeeded");
  } catch (error) {
    console.log("Transaction correctly failed with low value");
  }

  // Test 5: Test transaction with invalid value (too high)
  console.log("\n5. Testing transaction with invalid value (too high)...");
  try {
    const highValue = ethers.parseEther("0.015"); // Above maximum
    const tx = await transactions.connect(user1).makeTransaction(user2.address, highValue, {
      value: highValue
    });
    await tx.wait();
    console.log("Transaction should have failed but succeeded");
  } catch (error) {
    console.log("Transaction correctly failed with high value");
  }

  // Test 6: Test transaction with invalid receiver address
  console.log("\n6. Testing transaction with invalid receiver address...");
  try {
    const tx = await transactions.connect(user1).makeTransaction(ethers.ZeroAddress, txValue, {
      value: txValue
    });
    await tx.wait();
    console.log("Transaction should have failed but succeeded");
  } catch (error) {
    console.log("Transaction correctly failed with invalid receiver");
  }

  // Test 7: Test pending withdrawals
  console.log("\n7. Testing pending withdrawals...");
  const pendingAmount = await transactions.pendingWithdrawals(user1.address);
  console.log("Pending withdrawals for user1:", ethers.formatEther(pendingAmount), "ETH");

  // Test 8: Test withdrawFailed function (if there are pending withdrawals)
  if (pendingAmount > 0) {
    console.log("\n8. Testing withdrawFailed...");
    try {
      const tx = await transactions.connect(user1).withdrawFailed();
      await tx.wait();
      console.log("Withdrawal successful");
    } catch (error) {
      console.log("Withdrawal failed:", error);
    }
  } else {
    console.log("\n8. No pending withdrawals to test");
  }

  console.log("\n=== Transaction Testing Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
