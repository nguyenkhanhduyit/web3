import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const pmgr = process.env.POOL_MANAGER_ADDRESS;
  if (!pmgr) {
    throw new Error("POOL_MANAGER_ADDRESS not found in environment");
  }

  console.log("Pool Manager Address:", pmgr);
  
  // Read deployed addresses
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const pools = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/PoolAddress.json"), "utf8")
  );

  const [deployer] = await ethers.getSigners();
  const poolManager = await ethers.getContractAt("IPoolManager", pmgr);

  console.log("\nChecking pool manager...");
  
  // Check if pool manager is accessible
  try {
    const poolManagerCode = await deployer.provider?.getCode(pmgr);
    console.log("Pool Manager Code Length:", poolManagerCode?.length);
    if (poolManagerCode === "0x") {
      console.log("❌ Pool Manager not deployed or wrong address");
      return;
    }
    console.log("✅ Pool Manager is deployed");
  } catch (error) {
    console.log("❌ Error checking pool manager:", error.message);
    return;
  }

  console.log("\nChecking pools...");
  
  for (const [key, pool] of Object.entries(pools)) {
    console.log(`\nPool: ${key}`);
    console.log(`PoolId: ${pool.poolId}`);
    console.log(`Token0: ${pool.token0}`);
    console.log(`Token1: ${pool.token1}`);
    
    try {
      // Try to get pool info
      const poolKey = {
        currency0: ethers.utils.getAddress(pool.token0),
        currency1: ethers.utils.getAddress(pool.token1),
        fee: pool.fee,
        tickSpacing: pool.tickSpacing,
        hooks: ethers.constants.AddressZero
      };
      
      console.log("✅ Pool key constructed successfully");
    } catch (error) {
      console.log("❌ Error with pool:", error.message);
    }
  }

  console.log("\nChecking tokens...");
  
  for (const [name, token] of Object.entries(tokens)) {
    console.log(`\nToken: ${name}`);
    console.log(`Address: ${token.tokenAddress}`);
    console.log(`Symbol: ${token.symbol}`);
    
    try {
      const tokenContract = new ethers.Contract(
        token.tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        deployer
      );
      
      const balance = await tokenContract.balanceOf(deployer.address);
      console.log(`Balance: ${ethers.utils.formatUnits(balance, token.decimals)} ${token.symbol}`);
    } catch (error) {
      console.log("❌ Error checking token:", error.message);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 