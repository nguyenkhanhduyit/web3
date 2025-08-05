import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying advanced features for SimpleDEX...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  // Read existing addresses
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const deploymentResults: any = {
    timestamp: new Date().toISOString(),
    features: {}
  };

  // ===== DEPLOY PRICE ORACLE =====
  console.log("\n" + "=".repeat(50));
  console.log("📊 Deploying Price Oracle");
  console.log("=".repeat(50));

  try {
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy();
    await priceOracle.deployed();

    console.log("✅ PriceOracle deployed at:", priceOracle.address);

    // Test price oracle functionality
    const tokenEntries = Object.entries(tokens);
    const [token1Name, token1Info] = tokenEntries[0];
    const [token2Name, token2Info] = tokenEntries[1];

    // Update price (1 BTC = 15 ETH)
    const price = ethers.utils.parseEther("15"); // 15 ETH per BTC
    await priceOracle.updatePrice(token1Info.tokenAddress, token2Info.tokenAddress, price);
    console.log(`💰 Updated price: 1 ${token1Info.symbol} = 15 ${token2Info.symbol}`);

    // Get price
    const retrievedPrice = await priceOracle.getPrice(token1Info.tokenAddress, token2Info.tokenAddress);
    console.log(`📈 Retrieved price: ${ethers.utils.formatEther(retrievedPrice)} ETH per BTC`);

    // Calculate price from reserves
    const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    
    const calculatedPrice = await priceOracle.calculatePriceFromReserves(
      reserves[0],
      reserves[1],
      token1Info.decimals,
      token2Info.decimals
    );
    console.log(`🧮 Calculated price from reserves: ${ethers.utils.formatEther(calculatedPrice)} ETH per BTC`);

    deploymentResults.features.priceOracle = {
      status: "success",
      address: priceOracle.address,
      testPrice: ethers.utils.formatEther(price),
      calculatedPrice: ethers.utils.formatEther(calculatedPrice),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.log("❌ PriceOracle deployment failed:", error.message);
    deploymentResults.features.priceOracle = {
      status: "failed",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // ===== DEPLOY LIQUIDITY MINING =====
  console.log("\n" + "=".repeat(50));
  console.log("⛏️ Deploying Liquidity Mining");
  console.log("=".repeat(50));

  try {
    // Use USDT as reward token
    const usdtInfo = tokens["Tether USD"];
    const rewardToken = usdtInfo.tokenAddress;
    const totalRewards = ethers.utils.parseUnits("10000", usdtInfo.decimals); // 10,000 USDT
    const duration = 30 * 24 * 60 * 60; // 30 days

    const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
    const liquidityMining = await LiquidityMining.deploy(rewardToken, totalRewards, duration);
    await liquidityMining.deployed();

    console.log("✅ LiquidityMining deployed at:", liquidityMining.address);
    console.log(`🎁 Reward token: ${usdtInfo.symbol} (${rewardToken})`);
    console.log(`💰 Total rewards: ${ethers.utils.formatUnits(totalRewards, usdtInfo.decimals)} ${usdtInfo.symbol}`);
    console.log(`⏱️ Duration: ${duration / (24 * 60 * 60)} days`);

    // Add pool to liquidity mining
    const rewardRate = ethers.utils.parseUnits("0.1", usdtInfo.decimals); // 0.1 USDT per second
    await liquidityMining.addPool(token1Info.tokenAddress, token2Info.tokenAddress, rewardRate);
    console.log(`🏊 Added BTC-ETH pool with reward rate: ${ethers.utils.formatUnits(rewardRate, usdtInfo.decimals)} ${usdtInfo.symbol}/second`);

    // Get pool info
    const poolInfo = await liquidityMining.getPoolInfo(token1Info.tokenAddress);
    console.log(`📊 Pool info - Total staked: ${poolInfo.totalStaked}, Reward rate: ${ethers.utils.formatUnits(poolInfo.rewardRate, usdtInfo.decimals)}`);

    deploymentResults.features.liquidityMining = {
      status: "success",
      address: liquidityMining.address,
      rewardToken: {
        symbol: usdtInfo.symbol,
        address: rewardToken,
        totalRewards: ethers.utils.formatUnits(totalRewards, usdtInfo.decimals)
      },
      duration: duration / (24 * 60 * 60),
      rewardRate: ethers.utils.formatUnits(rewardRate, usdtInfo.decimals),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.log("❌ LiquidityMining deployment failed:", error.message);
    deploymentResults.features.liquidityMining = {
      status: "failed",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // Save deployment results
  const infoDir = path.resolve(__dirname, "../info");
  fs.writeFileSync(
    path.resolve(infoDir, "AdvancedFeatures.json"),
    JSON.stringify(deploymentResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("🎉 ADVANCED FEATURES DEPLOYED!");
  console.log("=".repeat(50));
  console.log("📁 Results saved to: info/AdvancedFeatures.json");
  
  if (deploymentResults.features.priceOracle?.status === "success") {
    console.log("✅ PriceOracle: Ready for price feeds");
  }
  
  if (deploymentResults.features.liquidityMining?.status === "success") {
    console.log("✅ LiquidityMining: Ready for staking rewards");
  }

  console.log("\n🚀 NEXT STEPS:");
  console.log("-".repeat(40));
  console.log("1. Integrate PriceOracle with SimpleDEX");
  console.log("2. Connect LiquidityMining with SimpleDEX pools");
  console.log("3. Build frontend for advanced features");
  console.log("4. Add more sophisticated price feeds");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 