import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts with history tracking features...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy tokens
  console.log("\nDeploying tokens...");
  const Token = await ethers.getContractFactory("Token");
  
  const bitcoin = await Token.deploy("Bitcoin", "BTC", 8);
  await bitcoin.deployed();
  console.log("Bitcoin deployed to:", bitcoin.address);

  const ethereum = await Token.deploy("Ethereum", "ETH", 18);
  await ethereum.deployed();
  console.log("Ethereum deployed to:", ethereum.address);

  const tether = await Token.deploy("Tether USD", "USDT", 6);
  await tether.deployed();
  console.log("Tether USD deployed to:", tether.address);

  // Deploy SimpleDEX
  console.log("\nDeploying SimpleDEX...");
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDEX = await SimpleDEX.deploy();
  await simpleDEX.deployed();
  console.log("SimpleDEX deployed to:", simpleDEX.address);

  // Deploy Faucet
  console.log("\nDeploying Faucet...");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy();
  await faucet.deployed();
  console.log("Faucet deployed to:", faucet.address);

  // Add tokens to faucet
  console.log("\nAdding tokens to faucet...");
  await faucet.addToken(bitcoin.address);
  await faucet.addToken(ethereum.address);
  await faucet.addToken(tether.address);
  console.log("All tokens added to faucet");

  // Mint tokens to faucet for distribution
  console.log("\nMinting tokens to faucet...");
  const faucetAmounts = {
    bitcoin: ethers.utils.parseUnits("1000", 8),    // 1000 BTC
    ethereum: ethers.utils.parseEther("100000"),    // 100,000 ETH
    tether: ethers.utils.parseUnits("1000000", 6)   // 1,000,000 USDT
  };

  await bitcoin.mint(faucet.address, faucetAmounts.bitcoin);
  await ethereum.mint(faucet.address, faucetAmounts.ethereum);
  await tether.mint(faucet.address, faucetAmounts.tether);
  console.log("Tokens minted to faucet");

  // Add initial liquidity to DEX
  console.log("\nAdding initial liquidity to DEX...");
  const initialLiquidity = {
    bitcoin: ethers.utils.parseUnits("100", 8),     // 100 BTC
    ethereum: ethers.utils.parseEther("10000"),     // 10,000 ETH
    tether: ethers.utils.parseUnits("100000", 6)    // 100,000 USDT
  };

  // Mint tokens to deployer for liquidity
  await bitcoin.mint(deployer.address, initialLiquidity.bitcoin);
  await ethereum.mint(deployer.address, initialLiquidity.ethereum);
  await tether.mint(deployer.address, initialLiquidity.tether);

  // Approve tokens for DEX
  await bitcoin.approve(simpleDEX.address, initialLiquidity.bitcoin);
  await ethereum.approve(simpleDEX.address, initialLiquidity.ethereum);
  await tether.approve(simpleDEX.address, initialLiquidity.tether);

  // Add liquidity pairs
  await simpleDEX.addLiquidity(
    bitcoin.address,
    ethereum.address,
    initialLiquidity.bitcoin,
    initialLiquidity.ethereum
  );

  await simpleDEX.addLiquidity(
    ethereum.address,
    tether.address,
    initialLiquidity.ethereum,
    initialLiquidity.tether
  );

  await simpleDEX.addLiquidity(
    bitcoin.address,
    tether.address,
    initialLiquidity.bitcoin,
    initialLiquidity.tether
  );

  console.log("Initial liquidity added to DEX");

  // Test history tracking features
  console.log("\nTesting history tracking features...");

  // Test faucet history
  console.log("Testing faucet history...");
  const testUser = deployer; // Using deployer as test user

  // Request single token
  await faucet.connect(testUser).requestFaucet(bitcoin.address);
  console.log("Single token faucet completed");

  // Check faucet history
  const faucetCount = await faucet.getUserFaucetCount(testUser.address);
  console.log("Faucet count for user:", faucetCount.toString());

  const faucetHistory = await faucet.getAllUserFaucetHistory(testUser.address);
  console.log("Faucet history entries:", faucetHistory.length);

  // Test swap history
  console.log("Testing swap history...");
  
  // Mint some tokens to test user for swapping
  await bitcoin.mint(testUser.address, ethers.utils.parseUnits("10", 8));
  await ethereum.mint(testUser.address, ethers.utils.parseEther("1000"));

  // Approve tokens for swap
  await bitcoin.connect(testUser).approve(simpleDEX.address, ethers.utils.parseUnits("5", 8));
  await ethereum.connect(testUser).approve(simpleDEX.address, ethers.utils.parseEther("500"));

  // Perform swaps
  await simpleDEX.connect(testUser).swapExactTokensForTokens(
    bitcoin.address,
    ethereum.address,
    ethers.utils.parseUnits("1", 8)
  );

  await simpleDEX.connect(testUser).swapExactTokensForTokens(
    ethereum.address,
    bitcoin.address,
    ethers.utils.parseEther("100")
  );

  console.log("Swaps completed");

  // Check swap history
  const swapCount = await simpleDEX.getUserSwapCount(testUser.address);
  console.log("Swap count for user:", swapCount.toString());

  const swapHistory = await simpleDEX.getAllUserSwapHistory(testUser.address);
  console.log("Swap history entries:", swapHistory.length);

  // Display detailed history
  console.log("\nDetailed History Summary:");
  console.log("=== FAUCET HISTORY ===");
  for (let i = 0; i < faucetHistory.length; i++) {
    const entry = faucetHistory[i];
    console.log(`Entry ${i + 1}:`);
    console.log(`  User: ${entry.user}`);
    console.log(`  Token: ${entry.token}`);
    console.log(`  Amount: ${ethers.utils.formatUnits(entry.amount, 8)}`);
    console.log(`  Timestamp: ${new Date(entry.timestamp.toNumber() * 1000).toLocaleString()}`);
    console.log(`  Block: ${entry.blockNumber.toString()}`);
  }

  console.log("\n=== SWAP HISTORY ===");
  for (let i = 0; i < swapHistory.length; i++) {
    const entry = swapHistory[i];
    console.log(`Entry ${i + 1}:`);
    console.log(`  Trader: ${entry.trader}`);
    console.log(`  Token In: ${entry.tokenIn}`);
    console.log(`  Token Out: ${entry.tokenOut}`);
    console.log(`  Amount In: ${ethers.utils.formatUnits(entry.amountIn, 8)}`);
    console.log(`  Amount Out: ${ethers.utils.formatUnits(entry.amountOut, 8)}`);
    console.log(`  Timestamp: ${new Date(entry.timestamp.toNumber() * 1000).toLocaleString()}`);
    console.log(`  Block: ${entry.blockNumber.toString()}`);
  }

  // Save deployment info
  const deploymentInfo = {
    tokens: {
      bitcoin: bitcoin.address,
      ethereum: ethereum.address,
      tether: tether.address
    },
    contracts: {
      simpleDEX: simpleDEX.address,
      faucet: faucet.address
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    features: {
      historyTracking: true,
      swapHistory: true,
      faucetHistory: true
    }
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\nDeployment completed successfully!");
  console.log("All contracts now support history tracking features.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
