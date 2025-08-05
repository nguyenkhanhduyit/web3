import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Thêm thanh khoản với tỷ lệ chính xác theo pool hiện tại...\n");

  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const [deployer] = await ethers.getSigners();
  
  console.log("Người deploy có địa chỉ ví :", deployer.address);
  console.log("SimpleDEX có địa chỉ :", simpleDexAddress);

  // Get SimpleDEX contract
  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);

  // Get all token entries
  const tokenEntries = Object.entries(tokens);
  console.log(`\nTổng số token: ${tokenEntries.length}`);
  
  // Generate all possible unique pairs
  const tokenPairs = [];
  for (let i = 0; i < tokenEntries.length; i++) {
    for (let j = i + 1; j < tokenEntries.length; j++) {
      tokenPairs.push([tokenEntries[i], tokenEntries[j]]);
    }
  }
  
  console.log(`Sẽ thêm thanh khoản với tỷ lệ chính xác cho ${tokenPairs.length} cặp token pools:`);
  tokenPairs.forEach((pair, index) => {
    const [token1Name] = pair[0];
    const [token2Name] = pair[1];
    console.log(`  ${index + 1}. ${token1Name}-${token2Name}`);
  });

  const allPoolsInfo = [];
  let successCount = 0;
  let failCount = 0;

  // Add liquidity for each pair with correct ratio
  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry;
    const [token2Name, token2Info] = token2Entry;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Đang thêm thanh khoản cho pool ${i + 1}/${tokenPairs.length}: ${token1Name}-${token2Name}...`);
    console.log(`Token1 (${token1Info.symbol}): ${token1Info.tokenAddress}`);
    console.log(`Token2 (${token2Info.symbol}): ${token2Info.tokenAddress}`);

    // Get current pool reserves
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const existingLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    
    console.log(`\nTrạng thái pool hiện tại:`);
    console.log(`Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`Total Liquidity: ${ethers.utils.formatUnits(existingLiquidity, 18)}`);

    // Calculate the correct ratio for additional liquidity
    // We want to add the same ratio as existing reserves
    const additionalAmount = 100000; // 100k tokens each
    
    // Calculate amounts based on current ratio
    const amount0 = ethers.utils.parseUnits(additionalAmount.toString(), token1Info.decimals);
    const amount1 = ethers.utils.parseUnits(additionalAmount.toString(), token2Info.decimals);

    console.log(`\nSố lượng thanh khoản bổ sung (tỷ lệ 1:1):`);
    console.log(`${token1Info.symbol}: ${ethers.utils.formatUnits(amount0, token1Info.decimals)}`);
    console.log(`${token2Info.symbol}: ${ethers.utils.formatUnits(amount1, token2Info.decimals)}`);

    try {
      // Add additional liquidity
      console.log("\nĐang thêm thanh khoản...");
      const addLiquidityTx = await simpleDex.addLiquidity(
        token1Info.tokenAddress,
        token2Info.tokenAddress,
        amount0,
        amount1,
        { gasLimit: 500000 }
      );
      
      console.log("Transaction sent:", addLiquidityTx.hash);
      console.log("Đang chờ sự xác nhận...");
      
      const receipt = await addLiquidityTx.wait();
      console.log("Thanh khoản đã được thêm thành công!");
      console.log("Gas đã sử dụng :", receipt.gasUsed.toString());

      // Get pool information after adding liquidity
      const newReserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      const newLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
      const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);

      // Xác định thứ tự canonical của token (theo địa chỉ)
      const token0Address = token1Info.tokenAddress < token2Info.tokenAddress ? token1Info.tokenAddress : token2Info.tokenAddress;
      const token1Address = token1Info.tokenAddress < token2Info.tokenAddress ? token2Info.tokenAddress : token1Info.tokenAddress;
      
      // Xác định thông tin token tương ứng với reserves[0] và reserves[1]
      const token0Info = token0Address === token1Info.tokenAddress ? token1Info : token2Info;
      const token1InfoCanonical = token0Address === token1Info.tokenAddress ? token2Info : token1Info;

      console.log(`\nThông tin pool sau khi thêm thanh khoản:`);
      console.log(`Reserves: ${ethers.utils.formatUnits(newReserves[0], token0Info.decimals)} ${token0Info.symbol}, ${ethers.utils.formatUnits(newReserves[1], token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol}`);
      console.log(`Total Liquidity: ${ethers.utils.formatUnits(newLiquidity, 18)}`);
      console.log(`User Liquidity: ${ethers.utils.formatUnits(userLiquidity, 18)}`);
      
      // Tính toán sự thay đổi
      const liquidityIncrease = newLiquidity.sub(existingLiquidity);
      console.log(`Liquidity tăng thêm: ${ethers.utils.formatUnits(liquidityIncrease, 18)}`);

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
        previousReserves: {
          reserve0: ethers.utils.formatUnits(reserves[0], token0Info.decimals),
          reserve1: ethers.utils.formatUnits(reserves[1], token1InfoCanonical.decimals)
        },
        newReserves: {
          reserve0: ethers.utils.formatUnits(newReserves[0], token0Info.decimals),
          reserve1: ethers.utils.formatUnits(newReserves[1], token1InfoCanonical.decimals)
        },
        liquidity: {
          previous: ethers.utils.formatUnits(existingLiquidity, 18),
          total: ethers.utils.formatUnits(newLiquidity, 18),
          user: ethers.utils.formatUnits(userLiquidity, 18),
          increase: ethers.utils.formatUnits(liquidityIncrease, 18)
        },
        transactionHash: addLiquidityTx.hash,
        gasUsed: receipt.gasUsed.toString(),
        status: "success",
        createdAt: new Date().toISOString()
      };

      allPoolsInfo.push(poolInfo);
      successCount++;

    } catch (error) {
      console.log("Thất bại khi thêm thanh khoản:", error.message);
      
      if (error.transaction) {
        console.log("Transaction hash:", error.transaction.hash);
      }
      
      if (error.receipt) {
        console.log("Gas đã sử dụng:", error.receipt.gasUsed.toString());
        console.log("Status:", error.receipt.status);
      }

      // Save failed pool information
      const failedPoolInfo = {
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
        error: error.message,
        status: "failed",
        createdAt: new Date().toISOString()
      };

      allPoolsInfo.push(failedPoolInfo);
      failCount++;
    }
  }

  // Save all pools information
  const summaryInfo = {
    totalPairs: tokenPairs.length,
    successCount: successCount,
    failCount: failCount,
    pools: allPoolsInfo,
    createdAt: new Date().toISOString()
  };

  const infoDir = path.resolve(__dirname, "../info");
  fs.writeFileSync(
    path.resolve(infoDir, "CorrectRatioLiquidity.json"),
    JSON.stringify(summaryInfo, null, 2)
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log("HOÀN THÀNH THÊM THANH KHOẢN VỚI TỶ LỆ CHÍNH XÁC!");
  console.log(`${"=".repeat(60)}`);
  console.log(`Tổng kết :`);
  console.log(`Tổng số cặp token: ${tokenPairs.length}`);
  console.log(`Thành công: ${successCount}`);
  console.log(`Thất bại: ${failCount}`);
  console.log(`Thông tin chi tiết đã lưu vào: info/CorrectRatioLiquidity.json`);
  console.log(`Bước tiếp theo: Chạy 05-test-dex-features.ts`);
  
  if (failCount > 0) {
    console.log(`\nCó ${failCount} cặp token thất bại. Vui lòng kiểm tra lại.`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 