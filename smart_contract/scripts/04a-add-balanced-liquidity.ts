import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang khởi tạo thanh khoản cân bằng đến SimpleDEX...\n");

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
  
  console.log(`Sẽ tạo ${tokenPairs.length} cặp token pools:`);
  tokenPairs.forEach((pair, index) => {
    const [token1Name] = pair[0];
    const [token2Name] = pair[1];
    console.log(`  ${index + 1}. ${token1Name}-${token2Name}`);
  });

  const allPoolsInfo = [];
  let successCount = 0;
  let failCount = 0;

  // Add liquidity for each pair
  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry;
    const [token2Name, token2Info] = token2Entry;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Đang thêm thanh khoản cho pool ${i + 1}/${tokenPairs.length}: ${token1Name}-${token2Name}...`);
    console.log(`Token1 (${token1Info.symbol}): ${token1Info.tokenAddress}`);
    console.log(`Token2 (${token2Info.symbol}): ${token2Info.tokenAddress}`);

    // Kiểm tra xem pool đã có thanh khoản chưa
    const existingReserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const existingLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    
    if (existingLiquidity.gt(0)) {
      console.log(`\nPool ${token1Name}-${token2Name} đã có thanh khoản:`);
      console.log(`Reserves: ${ethers.utils.formatUnits(existingReserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(existingReserves[1], token2Info.decimals)} ${token2Info.symbol}`);
      console.log(`Total Liquidity: ${ethers.utils.formatUnits(existingLiquidity, 18)}`);
      console.log(`Bỏ qua pool này vì đã có thanh khoản.`);
      
      // Save existing pool information
      const existingPoolInfo = {
        poolName: `${token1Name}-${token2Name}`,
        token0: {
          name: token1Name,
          address: token1Info.tokenAddress,
          symbol: token1Info.symbol,
          decimals: token1Info.decimals,
          amount: "0"
        },
        token1: {
          name: token2Name,
          address: token2Info.tokenAddress,
          symbol: token2Info.symbol,
          decimals: token2Info.decimals,
          amount: "0"
        },
        reserves: {
          reserve0: ethers.utils.formatUnits(existingReserves[0], token1Info.decimals),
          reserve1: ethers.utils.formatUnits(existingReserves[1], token2Info.decimals)
        },
        liquidity: {
          total: ethers.utils.formatUnits(existingLiquidity, 18),
          user: "0"
        },
        transactionHash: "N/A",
        gasUsed: "0",
        status: "skipped",
        createdAt: new Date().toISOString()
      };
      
      allPoolsInfo.push(existingPoolInfo);
      successCount++;
      continue;
    }

    // Tính toán số lượng token cân bằng dựa trên decimals
    // Mục tiêu: Tạo ra khoảng 10 LP tokens cho mỗi pool
    // Công thức: sqrt(amount0 * amount1) ≈ 10 * 1e18
    
    // Tính toán tỷ lệ cân bằng
    const maxDecimals = Math.max(token1Info.decimals, token2Info.decimals);
    const minDecimals = Math.min(token1Info.decimals, token2Info.decimals);
    const decimalDiff = maxDecimals - minDecimals;
    
    // Số lượng cơ bản (1 triệu token)
    const baseAmount = 1000000;
    
    // Điều chỉnh số lượng dựa trên decimals
    let amount0, amount1;
    
    if (token1Info.decimals === maxDecimals) {
      // Token1 có decimals cao hơn
      amount0 = baseAmount * Math.pow(10, token1Info.decimals);
      amount1 = baseAmount * Math.pow(10, token2Info.decimals) * Math.pow(10, decimalDiff);
    } else {
      // Token2 có decimals cao hơn
      amount0 = baseAmount * Math.pow(10, token1Info.decimals) * Math.pow(10, decimalDiff);
      amount1 = baseAmount * Math.pow(10, token2Info.decimals);
    }
    
    // Chuyển đổi thành BigNumber
    const amount0BN = ethers.BigNumber.from(amount0.toString());
    const amount1BN = ethers.BigNumber.from(amount1.toString());

    console.log(`\nSố lượng thanh khoản cân bằng:`);
    console.log(`${token1Info.symbol}: ${ethers.utils.formatUnits(amount0BN, token1Info.decimals)}`);
    console.log(`${token2Info.symbol}: ${ethers.utils.formatUnits(amount1BN, token2Info.decimals)}`);
    
    // Ước tính LP tokens sẽ nhận được
    const estimatedLiquidity = ethers.BigNumber.from(
      Math.sqrt(Number(amount0) * Number(amount1)).toString()
    );
    console.log(`Ước tính LP tokens: ${ethers.utils.formatUnits(estimatedLiquidity, 18)}`);

    try {
      // Add initial liquidity
      console.log("\nĐang thêm thanh khoản...");
      const addLiquidityTx = await simpleDex.addLiquidity(
        token1Info.tokenAddress,
        token2Info.tokenAddress,
        amount0BN,
        amount1BN,
        { gasLimit: 500000 }
      );
      
      console.log("Transaction sent:", addLiquidityTx.hash);
      console.log("Đang chờ sự xác nhận...");
      
      const receipt = await addLiquidityTx.wait();
      console.log("Thanh khoản đã được thêm thành công!");
      console.log("Gas đã sử dụng :", receipt.gasUsed.toString());

      // Get pool information after adding liquidity
      const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
      const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);

      // Xác định thứ tự canonical của token (theo địa chỉ)
      const token0Address = token1Info.tokenAddress < token2Info.tokenAddress ? token1Info.tokenAddress : token2Info.tokenAddress;
      const token1Address = token1Info.tokenAddress < token2Info.tokenAddress ? token2Info.tokenAddress : token1Info.tokenAddress;
      
      // Xác định thông tin token tương ứng với reserves[0] và reserves[1]
      const token0Info = token0Address === token1Info.tokenAddress ? token1Info : token2Info;
      const token1InfoCanonical = token0Address === token1Info.tokenAddress ? token2Info : token1Info;

      console.log(`\nThông tin pool sau khi thêm thanh khoản:`);
      console.log(`Reserves: ${ethers.utils.formatUnits(reserves[0], token0Info.decimals)} ${token0Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol}`);
      console.log(`Total Liquidity: ${ethers.utils.formatUnits(liquidity, 18)}`);
      console.log(`User Liquidity: ${ethers.utils.formatUnits(userLiquidity, 18)}`);

      // Save pool information
      const poolInfo = {
        poolName: `${token1Name}-${token2Name}`,
        token0: {
          name: token1Name,
          address: token1Info.tokenAddress,
          symbol: token1Info.symbol,
          decimals: token1Info.decimals,
          amount: ethers.utils.formatUnits(amount0BN, token1Info.decimals)
        },
        token1: {
          name: token2Name,
          address: token2Info.tokenAddress,
          symbol: token2Info.symbol,
          decimals: token2Info.decimals,
          amount: ethers.utils.formatUnits(amount1BN, token2Info.decimals)
        },
        reserves: {
          reserve0: ethers.utils.formatUnits(reserves[0], token0Info.decimals),
          reserve1: ethers.utils.formatUnits(reserves[1], token1InfoCanonical.decimals)
        },
        liquidity: {
          total: ethers.utils.formatUnits(liquidity, 18),
          user: ethers.utils.formatUnits(userLiquidity, 18)
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
          amount: ethers.utils.formatUnits(amount0BN, token1Info.decimals)
        },
        token1: {
          name: token2Name,
          address: token2Info.tokenAddress,
          symbol: token2Info.symbol,
          decimals: token2Info.decimals,
          amount: ethers.utils.formatUnits(amount1BN, token2Info.decimals)
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
    path.resolve(infoDir, "BalancedInitialLiquidity.json"),
    JSON.stringify(summaryInfo, null, 2)
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log("HOÀN THÀNH THÊM THANH KHOẢN CÂN BẰNG CHO TẤT CẢ CÁC CẶP TOKEN!");
  console.log(`${"=".repeat(60)}`);
  console.log(`Tổng kết :`);
  console.log(`Tổng số cặp token: ${tokenPairs.length}`);
  console.log(`Thành công: ${successCount}`);
  console.log(`Thất bại: ${failCount}`);
  console.log(`Thông tin chi tiết đã lưu vào: info/BalancedInitialLiquidity.json`);
  console.log(`Bước tiếp theo: Chạy 05-test-dex-features.ts`);
  
  if (failCount > 0) {
    console.log(`\nCó ${failCount} cặp token thất bại. Vui lòng kiểm tra lại.`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 