import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 DEPLOYING COMPLETE SIMPLEDEX ECOSYSTEM\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log("🌐 Network: Sepolia");
  console.log("=".repeat(60));

  const deploymentResults: any = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    network: "sepolia",
    steps: {}
  };

  // Step 1: Deploy Tokens
  console.log("\n🪙 STEP 1: Deploying Tokens...");
  console.log("-".repeat(40));
  
  try {
    const { execSync } = require('child_process');
    execSync('npx hardhat run scripts/01-deploy-tokens.ts --network sepolia', { stdio: 'inherit' });
    console.log("✅ Tokens deployed successfully!");
    deploymentResults.steps.tokens = { status: "success", timestamp: new Date().toISOString() };
  } catch (error) {
    console.log("❌ Token deployment failed:", error.message);
    deploymentResults.steps.tokens = { status: "failed", error: error.message, timestamp: new Date().toISOString() };
    return;
  }

  // Step 2: Deploy SimpleDEX
  console.log("\n🏦 STEP 2: Deploying SimpleDEX...");
  console.log("-".repeat(40));
  
  try {
    const { execSync } = require('child_process');
    execSync('npx hardhat run scripts/02-deploy-simple-dex.ts --network sepolia', { stdio: 'inherit' });
    console.log("✅ SimpleDEX deployed successfully!");
    deploymentResults.steps.simpleDex = { status: "success", timestamp: new Date().toISOString() };
  } catch (error) {
    console.log("❌ SimpleDEX deployment failed:", error.message);
    deploymentResults.steps.simpleDex = { status: "failed", error: error.message, timestamp: new Date().toISOString() };
    return;
  }

  // Step 3: Approve Tokens
  console.log("\n🔐 STEP 3: Approving Tokens...");
  console.log("-".repeat(40));
  
  try {
    const { execSync } = require('child_process');
    execSync('npx hardhat run scripts/03-approve-tokens.ts --network sepolia', { stdio: 'inherit' });
    console.log("✅ Tokens approved successfully!");
    deploymentResults.steps.approvals = { status: "success", timestamp: new Date().toISOString() };
  } catch (error) {
    console.log("❌ Token approval failed:", error.message);
    deploymentResults.steps.approvals = { status: "failed", error: error.message, timestamp: new Date().toISOString() };
    return;
  }

  // Step 4: Add Initial Liquidity
  console.log("\n💧 STEP 4: Adding Initial Liquidity...");
  console.log("-".repeat(40));
  
  try {
    const { execSync } = require('child_process');
    execSync('npx hardhat run scripts/04-add-initial-liquidity.ts --network sepolia', { stdio: 'inherit' });
    console.log("✅ Initial liquidity added successfully!");
    deploymentResults.steps.initialLiquidity = { status: "success", timestamp: new Date().toISOString() };
  } catch (error) {
    console.log("❌ Initial liquidity failed:", error.message);
    deploymentResults.steps.initialLiquidity = { status: "failed", error: error.message, timestamp: new Date().toISOString() };
    return;
  }

  // Step 5: Test DEX Features
  console.log("\n🧪 STEP 5: Testing DEX Features...");
  console.log("-".repeat(40));
  
  try {
    const { execSync } = require('child_process');
    execSync('npx hardhat run scripts/05-test-dex-features.ts --network sepolia', { stdio: 'inherit' });
    console.log("✅ DEX features tested successfully!");
    deploymentResults.steps.testing = { status: "success", timestamp: new Date().toISOString() };
  } catch (error) {
    console.log("❌ DEX testing failed:", error.message);
    deploymentResults.steps.testing = { status: "failed", error: error.message, timestamp: new Date().toISOString() };
  }

  // Save deployment results
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "DeploymentResults.json"),
    JSON.stringify(deploymentResults, null, 2)
  );

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED!");
  console.log("=".repeat(60));
  
  // Read and display addresses
  try {
    const tokens = JSON.parse(fs.readFileSync(path.resolve(infoDir, "TokenAddress.json"), "utf8"));
    const simpleDex = JSON.parse(fs.readFileSync(path.resolve(infoDir, "SimpleDEXAddress.json"), "utf8"));
    
    console.log("\n📋 DEPLOYED CONTRACTS:");
    console.log("-".repeat(40));
    console.log("🏦 SimpleDEX:", simpleDex.address);
    
    for (const [tokenName, tokenInfo] of Object.entries(tokens)) {
      console.log(`🪙 ${tokenName} (${tokenInfo.symbol}):`, tokenInfo.tokenAddress);
    }
    
    console.log("\n📁 SAVED FILES:");
    console.log("-".repeat(40));
    console.log("📄 TokenAddress.json - Token contract addresses");
    console.log("📄 SimpleDEXAddress.json - SimpleDEX contract address");
    console.log("📄 TokenApprovals.json - Token approval results");
    console.log("📄 InitialLiquidity.json - Initial liquidity information");
    console.log("📄 TestResults.json - DEX feature test results");
    console.log("📄 DeploymentResults.json - Complete deployment summary");
    
    console.log("\n🚀 NEXT STEPS:");
    console.log("-".repeat(40));
    console.log("1. Use SimpleDEX for trading");
    console.log("2. Add more liquidity to pools");
    console.log("3. Create additional token pairs");
    console.log("4. Build frontend interface");
    
  } catch (error) {
    console.log("⚠️ Could not read deployment files:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ SIMPLEDEX ECOSYSTEM IS READY!");
  console.log("=".repeat(60));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 