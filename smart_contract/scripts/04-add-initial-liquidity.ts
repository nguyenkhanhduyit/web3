import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang khởi tạo thanh khoản đến SimpleDEX...\n");

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

  // Check token balances before adding liquidity
  console.log("\n" + "=".repeat(60));
  console.log("KIỂM TRA SỐ DƯ TOKEN TRƯỚC KHI THÊM THANH KHOẢN");
  console.log("=".repeat(60));
  
  const tokenEntries = Object.entries(tokens);
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const balance = await tokenContract.balanceOf(deployer.address);
    console.log(`${tokenName} (${(tokenInfo as any).symbol}): ${ethers.utils.formatUnits(balance, (tokenInfo as any).decimals)}`);
  }

  // Get all token entries
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
    const [token1Name, token1Info] = token1Entry as [string, any];
    const [token2Name, token2Info] = token2Entry as [string, any];

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Đang thêm thanh khoản cho pool ${i + 1}/${tokenPairs.length}: ${token1Name}-${token2Name}...`);
    console.log(`Token1 (${token1Info.symbol}): ${token1Info.tokenAddress}`);
    console.log(`Token2 (${token2Info.symbol}): ${token2Info.tokenAddress}`);

    // Check current token balances for this pair
    const token1Contract = await ethers.getContractAt("Token", token1Info.tokenAddress);
    const token2Contract = await ethers.getContractAt("Token", token2Info.tokenAddress);
    const token1Balance = await token1Contract.balanceOf(deployer.address);
    const token2Balance = await token2Contract.balanceOf(deployer.address);
    
    console.log(`\nSố dư hiện tại:`);
    console.log(`${token1Info.symbol}: ${ethers.utils.formatUnits(token1Balance, token1Info.decimals)}`);
    console.log(`${token2Info.symbol}: ${ethers.utils.formatUnits(token2Balance, token2Info.decimals)}`);

    // Kiểm tra xem pool đã có thanh khoản chưa
    const existingReserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const existingLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    
    if (existingLiquidity.gt(0)) {
      console.log(`\nPool ${token1Name}-${token2Name} đã có thanh khoản:`);
      console.log(`Reserves: ${ethers.utils.formatUnits(existingReserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(existingReserves[1], token2Info.decimals)} ${token2Info.symbol}`);
      console.log(`Total Liquidity: ${ethers.utils.formatUnits(existingLiquidity, 18)}`);
      console.log(`User Liquidity: ${ethers.utils.formatUnits(userLiquidity, 18)}`);
      
      // Check if user has liquidity to remove
      if (userLiquidity.gt(0)) {
        console.log(`Đang xóa thanh khoản cũ để thêm thanh khoản cân bằng...`);
        try {
          const removeLiquidityTx = await simpleDex.removeLiquidity(
            token1Info.tokenAddress,
            token2Info.tokenAddress,
            userLiquidity,
            { gasLimit: 500000 }
          );
          
          console.log("Transaction xóa thanh khoản sent:", removeLiquidityTx.hash);
          console.log("Đang chờ xác nhận...");
          
          const removeReceipt = await removeLiquidityTx.wait();
          console.log("Đã xóa thanh khoản cũ thành công!");
          console.log("Gas đã sử dụng:", removeReceipt.gasUsed.toString());
          
        } catch (error: any) {
          console.log("Thất bại khi xóa thanh khoản cũ:", error.message);
          console.log("Bỏ qua pool này vì không thể xóa thanh khoản cũ.");
          
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
              user: ethers.utils.formatUnits(userLiquidity, 18)
            },
            transactionHash: "N/A",
            gasUsed: "0",
            status: "skipped_cannot_remove",
            createdAt: new Date().toISOString()
          };
          
          allPoolsInfo.push(existingPoolInfo);
          successCount++;
          continue;
        }
      } else {
        console.log(`Người dùng không có thanh khoản trong pool này. Bỏ qua.`);
        
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
            user: ethers.utils.formatUnits(userLiquidity, 18)
          },
          transactionHash: "N/A",
          gasUsed: "0",
          status: "skipped_no_user_liquidity",
          createdAt: new Date().toISOString()
        };
        
        allPoolsInfo.push(existingPoolInfo);
        successCount++;
        continue;
      }
    }

    // Calculate balanced liquidity amounts based on decimals
    // Use 1 million tokens for each token in each pool
    const baseAmount = 1000000; // 1 million tokens for each pool
    
    // For each pool, add 1 million tokens of each type
    let amount0, amount1;
    //parseUnits('1', 6) → 1000000
    amount0 = ethers.utils.parseUnits(baseAmount.toString(),token1Info.decimals);
    amount1 = ethers.utils.parseUnits(baseAmount.toString(),token2Info.decimals);

    /*
    // Giả sử bạn nhận được số dư token như sau (kiểu BigNumber):
const rawBalance = BigInt("100000000"); // 100,000,000 (số của BTC có decimals = 8)

// Decimals của token BTC là 8
const decimals = 8;

// Format về số dễ đọc
const formatted = formatUnits(rawBalance, decimals);

console.log(formatted); // 👉 "1.0"
    */
    console.log(`\nSố lượng thanh khoản ban đầu (1M token mỗi loại):`);
    console.log(`${token1Info.symbol}: ${ethers.utils.formatUnits(amount0,token1Info.decimals)}`);
    console.log(`${token2Info.symbol}: ${ethers.utils.formatUnits(amount1, token2Info.decimals)}`);
    console.log(`Token1 decimals: ${token1Info.decimals}, Token2 decimals: ${token2Info.decimals}`);
  
    // Check if we have enough tokens
    if (token1Balance.lt(amount0)) {
      console.log(`❌ Không đủ ${token1Info.symbol}! Cần: ${ethers.utils.formatUnits(amount0, token1Info.decimals)}, Có: ${ethers.utils.formatUnits(token1Balance, token1Info.decimals)}`);
      failCount++;
      continue;
    }
    
    if (token2Balance.lt(amount1)) {
      console.log(`❌ Không đủ ${token2Info.symbol}! Cần: ${ethers.utils.formatUnits(amount1, token2Info.decimals)}, Có: ${ethers.utils.formatUnits(token2Balance, token2Info.decimals)}`);
      failCount++;
      continue;
    }

    try {
      // Add initial liquidity
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

    } catch (error: any) {
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

  // Check final token balances
  console.log(`\n${"=".repeat(60)}`);
  console.log("KIỂM TRA SỐ DƯ TOKEN SAU KHI THÊM THANH KHOẢN");
  console.log("=".repeat(60));
  
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const balance = await tokenContract.balanceOf(deployer.address);
    console.log(`${tokenName} (${(tokenInfo as any).symbol}): ${ethers.utils.formatUnits(balance, (tokenInfo as any).decimals)}`);
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
    path.resolve(infoDir, "AllInitialLiquidity.json"),
    JSON.stringify(summaryInfo, null, 2)
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log("HOÀN THÀNH THÊM THANH KHOẢN CHO TẤT CẢ CÁC CẶP TOKEN!");
  console.log(`${"=".repeat(60)}`);
  console.log(`Tổng kết :`);
  console.log(`Tổng số cặp token: ${tokenPairs.length}`);
  console.log(`Thành công: ${successCount}`);
  console.log(`Thất bại: ${failCount}`);
  console.log(`Thông tin chi tiết đã lưu vào: info/AllInitialLiquidity.json`);
  console.log(`Bước tiếp theo: Chạy 05-test-dex-features.ts`);
  
  if (failCount > 0) {
    console.log(`\nCó ${failCount} cặp token thất bại. Vui lòng kiểm tra lại.`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 