import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("💧 Adding initial liquidity to SimpleDEX...\n");

  // Read deployed addresses
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const [deployer] = await ethers.getSigners();
  
  console.log("📍 Deployer:", deployer.address);
  console.log("🏦 SimpleDEX:", simpleDexAddress);

  // Get SimpleDEX contract
  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);

  // Get the first two tokens for initial liquidity
  const tokenEntries = Object.entries(tokens);
  const [token1Name, token1Info] = tokenEntries[0];
  const [token2Name, token2Info] = tokenEntries[1];

  console.log(`\n🪙 Adding liquidity for ${token1Name}-${token2Name} pool`);
  console.log(`Token1 (${token1Info.symbol}): ${token1Info.tokenAddress}`);
  console.log(`Token2 (${token2Info.symbol}): ${token2Info.tokenAddress}`);

  // Initial liquidity amounts
  const amount0 = ethers.utils.parseUnits("1000", token1Info.decimals);
  const amount1 = ethers.utils.parseUnits("1000", token2Info.decimals);

  console.log(`\n💧 Initial liquidity amounts:`);
  console.log(`${token1Info.symbol}: ${ethers.utils.formatUnits(amount0, token1Info.decimals)}`);
  console.log(`${token2Info.symbol}: ${ethers.utils.formatUnits(amount1, token2Info.decimals)}`);

  try {
    // Add initial liquidity
    console.log("\n🚀 Adding initial liquidity...");
    const addLiquidityTx = await simpleDex.addLiquidity(
      token1Info.tokenAddress,
      token2Info.tokenAddress,
      amount0,
      amount1,
      { gasLimit: 500000 }
    );
    
    console.log("⏳ Transaction sent:", addLiquidityTx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await addLiquidityTx.wait();
    console.log("✅ Initial liquidity added successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());

    // Get pool information after adding liquidity
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);

    console.log(`\n📊 Pool information after initial liquidity:`);
    console.log(`💰 Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`🏊 Total Liquidity: ${ethers.utils.formatUnits(liquidity, 18)}`);
    console.log(`👤 User Liquidity: ${ethers.utils.formatUnits(userLiquidity, 18)}`);

    // Save pool information
    const poolInfo = {
      poolName: `${token1Name}-${token2Name}`,
      token0: {
        name: token1Name,
        address: token1Info.tokenAddress,
        symbol: token1Info.symbol,
        decimals: token1Info.decimals,
        amount: ethers.utils.formatUnits(amount0, token1Info.decimals)
      },
      token1: {
        name: token2Name,
        address: token2Info.tokenAddress,
        symbol: token2Info.symbol,
        decimals: token2Info.decimals,
        amount: ethers.utils.formatUnits(amount1, token2Info.decimals)
      },
      reserves: {
        reserve0: ethers.utils.formatUnits(reserves[0], token1Info.decimals),
        reserve1: ethers.utils.formatUnits(reserves[1], token2Info.decimals)
      },
      liquidity: {
        total: ethers.utils.formatUnits(liquidity, 18),
        user: ethers.utils.formatUnits(userLiquidity, 18)
      },
      transactionHash: addLiquidityTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      createdAt: new Date().toISOString()
    };

    const infoDir = path.resolve(__dirname, "../info");
    fs.writeFileSync(
      path.resolve(infoDir, "InitialLiquidity.json"),
      JSON.stringify(poolInfo, null, 2)
    );

    console.log("\n" + "=".repeat(50));
    console.log("🎉 INITIAL LIQUIDITY ADDED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("📁 Pool information saved to: info/InitialLiquidity.json");
    console.log("📋 Next step: Run 05-test-dex-features.ts");
    
  } catch (error) {
    console.log("❌ Failed to add initial liquidity:", error.message);
    
    if (error.transaction) {
      console.log("Transaction hash:", error.transaction.hash);
    }
    
    if (error.receipt) {
      console.log("Gas used:", error.receipt.gasUsed.toString());
      console.log("Status:", error.receipt.status);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 