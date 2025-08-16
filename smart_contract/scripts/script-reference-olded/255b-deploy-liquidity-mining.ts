import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("⛏️ Deploy Liquidity Mining...\n");

  // Đọc địa chỉ các contract đã deploy
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  // Lấy thông tin người deploy
  const [deployer] = await ethers.getSigners();
  
  console.log("📍 Người deploy:", deployer.address);
  console.log("🏦 SimpleDEX:", simpleDexAddress);

  // Lưu kết quả deploy
  const deployResults: any = {
    timestamp: new Date().toISOString(),
    deployName: "Liquidity Mining",
    status: "completed"
  };

  console.log("\n" + "=".repeat(50));
  console.log("⛏️ DEPLOY LIQUIDITY MINING");
  console.log("=".repeat(50));

  try {
    // Bước 1: Deploy Liquidity Mining contract
    console.log("🔍 Bước 1: Deploy Liquidity Mining contract...");
    const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
    const liquidityMining = await LiquidityMining.deploy(
      simpleDexAddress, // Địa chỉ SimpleDEX
      { gasLimit: 3000000 } // Thêm gasLimit rõ ràng để tránh lỗi _hex
    );
    
    await liquidityMining.deployed();
    console.log("✅ Liquidity Mining đã được deploy thành công!");
    console.log("📍 Địa chỉ Liquidity Mining:", liquidityMining.address);

    // Bước 2: Thiết lập reward token
    console.log("🔍 Bước 2: Thiết lập reward token...");
    
    // Sử dụng token đầu tiên làm reward token
    const [rewardTokenName, rewardTokenInfo] = Object.entries(tokens)[0];
    console.log(`🎁 Sử dụng ${rewardTokenName} (${rewardTokenInfo.symbol}) làm reward token`);
    
    const rewardAmount = ethers.utils.parseUnits("1000", rewardTokenInfo.decimals); // 1000 token làm reward
    console.log(`💰 Tổng reward: ${ethers.utils.formatUnits(rewardAmount, rewardTokenInfo.decimals)} ${rewardTokenInfo.symbol}`);

    // Bước 3: Transfer reward token cho Liquidity Mining contract
    console.log("🔍 Bước 3: Transfer reward token cho Liquidity Mining contract...");
    
    const rewardTokenContract = new ethers.Contract(rewardTokenInfo.tokenAddress, [
      "function transfer(address,uint256) external returns (bool)",
      "function balanceOf(address) external view returns (uint256)"
    ], deployer);

    // Kiểm tra số dư reward token
    const rewardBalance = await rewardTokenContract.balanceOf(deployer.address);
    console.log(`💳 Số dư ${rewardTokenName}: ${ethers.utils.formatUnits(rewardBalance, rewardTokenInfo.decimals)}`);

    if (rewardBalance.lt(rewardAmount)) {
      throw new Error(`Số dư ${rewardTokenName} không đủ! Cần: ${ethers.utils.formatUnits(rewardAmount, rewardTokenInfo.decimals)}, Có: ${ethers.utils.formatUnits(rewardBalance, rewardTokenInfo.decimals)}`);
    }

    // Transfer reward token
    const transferTx = await rewardTokenContract.transfer(liquidityMining.address, rewardAmount);
    await transferTx.wait();
    console.log("✅ Đã transfer reward token thành công!");

    // Bước 4: Thiết lập mining pool
    console.log("🔍 Bước 4: Thiết lập mining pool...");
    
    const [token1Name, token1Info] = Object.entries(tokens)[0];
    const [token2Name, token2Info] = Object.entries(tokens)[1];
    
    console.log(`🏊 Thiết lập mining pool cho cặp: ${token1Name}-${token2Name}`);
    
    const rewardPerBlock = ethers.utils.parseUnits("1", rewardTokenInfo.decimals); // 1 token per block
    const startBlock = await ethers.provider.getBlockNumber();
    const endBlock = startBlock + 1000; // Mining trong 1000 blocks
    
    const addPoolTx = await liquidityMining.addPool(
      token1Info.tokenAddress,
      token2Info.tokenAddress,
      rewardPerBlock,
      startBlock,
      endBlock,
      { gasLimit: 300000 }
    );
    
    await addPoolTx.wait();
    console.log("✅ Đã thiết lập mining pool thành công!");
    console.log(`📊 Reward per block: ${ethers.utils.formatUnits(rewardPerBlock, rewardTokenInfo.decimals)} ${rewardTokenInfo.symbol}`);
    console.log(`📅 Start block: ${startBlock}, End block: ${endBlock}`);

    // Bước 5: Test các hàm của Liquidity Mining
    console.log("🔍 Bước 5: Test các hàm của Liquidity Mining...");
    
    // Test getPoolInfo
    const poolInfo = await liquidityMining.getPoolInfo(0); // Pool đầu tiên
    console.log("📊 Thông tin pool:");
    console.log(`   - Token0: ${poolInfo.token0}`);
    console.log(`   - Token1: ${poolInfo.token1}`);
    console.log(`   - Reward per block: ${ethers.utils.formatUnits(poolInfo.rewardPerBlock, rewardTokenInfo.decimals)} ${rewardTokenInfo.symbol}`);
    console.log(`   - Start block: ${poolInfo.startBlock}`);
    console.log(`   - End block: ${poolInfo.endBlock}`);
    console.log(`   - Total staked: ${ethers.utils.formatUnits(poolInfo.totalStaked, 18)} LP tokens`);

    // Test getRewardToken
    const rewardTokenAddress = await liquidityMining.rewardToken();
    console.log(`🎁 Reward token: ${rewardTokenAddress}`);

    // Test getPendingReward
    const pendingReward = await liquidityMining.getPendingReward(0, deployer.address);
    console.log(`⏳ Pending reward: ${ethers.utils.formatUnits(pendingReward, rewardTokenInfo.decimals)} ${rewardTokenInfo.symbol}`);

    // Bước 6: Lưu thông tin deploy
    const miningInfo = {
      address: liquidityMining.address,
      deployer: deployer.address,
      simpleDexAddress: simpleDexAddress,
      deployedAt: new Date().toISOString(),
      rewardToken: {
        name: rewardTokenName,
        symbol: rewardTokenInfo.symbol,
        address: rewardTokenInfo.tokenAddress,
        totalReward: ethers.utils.formatUnits(rewardAmount, rewardTokenInfo.decimals)
      },
      pool: {
        poolId: 0,
        token0: token1Info.tokenAddress,
        token1: token2Info.tokenAddress,
        rewardPerBlock: ethers.utils.formatUnits(rewardPerBlock, rewardTokenInfo.decimals),
        startBlock: startBlock,
        endBlock: endBlock
      },
      transactions: {
        deploy: liquidityMining.deployTransaction?.hash,
        transfer: transferTx.hash,
        addPool: addPoolTx.hash
      },
      testResults: {
        poolInfo: {
          token0: poolInfo.token0,
          token1: poolInfo.token1,
          rewardPerBlock: ethers.utils.formatUnits(poolInfo.rewardPerBlock, rewardTokenInfo.decimals),
          startBlock: poolInfo.startBlock.toString(),
          endBlock: poolInfo.endBlock.toString(),
          totalStaked: ethers.utils.formatUnits(poolInfo.totalStaked, 18)
        },
        rewardTokenAddress: rewardTokenAddress,
        pendingReward: ethers.utils.formatUnits(pendingReward, rewardTokenInfo.decimals)
      }
    };

    // Lưu vào file
    const infoDir = path.resolve(__dirname, "../info");
    if (!fs.existsSync(infoDir)) {
      fs.mkdirSync(infoDir, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(infoDir, "LiquidityMiningAddress.json"),
      JSON.stringify(miningInfo, null, 2)
    );

    deployResults.data = miningInfo;
    deployResults.status = "success";

    console.log("\n✅ Deploy Liquidity Mining hoàn thành thành công!");
    console.log("📁 Thông tin đã lưu vào: info/LiquidityMiningAddress.json");

  } catch (error) {
    console.log("❌ Lỗi khi deploy Liquidity Mining:", error.message);
    deployResults.status = "failed";
    deployResults.error = error.message;
  }

  // Lưu kết quả deploy
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "06b-deploy-liquidity-mining.json"),
    JSON.stringify(deployResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("📁 Kết quả deploy đã lưu vào: info/06b-deploy-liquidity-mining.json");
  console.log("🎯 Bước tiếp theo: Chạy 06c-test-advanced-features.ts");
  console.log("=".repeat(50));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 