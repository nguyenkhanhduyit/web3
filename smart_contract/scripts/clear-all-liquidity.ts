import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang xóa tất cả thanh khoản để bắt đầu lại...\n");

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
  
  // Generate all possible unique pairs
  const tokenPairs = [];
  for (let i = 0; i < tokenEntries.length; i++) {
    for (let j = i + 1; j < tokenEntries.length; j++) {
      tokenPairs.push([tokenEntries[i], tokenEntries[j]]);
    }
  }

  console.log(`Sẽ xóa thanh khoản từ ${tokenPairs.length} pools...`);

  let removedCount = 0;
  let skippedCount = 0;

  // Remove liquidity from each pair
  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry as [string, any];
    const [token2Name, token2Info] = token2Entry as [string, any];

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Đang xử lý pool ${i + 1}/${tokenPairs.length}: ${token1Name}-${token2Name}...`);

    // Check current liquidity
    const existingLiquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    const userLiquidity = await simpleDex.getBalance(token1Info.tokenAddress, token2Info.tokenAddress, deployer.address);
    
    console.log(`Total Liquidity: ${ethers.utils.formatUnits(existingLiquidity, 18)}`);
    console.log(`User Liquidity: ${ethers.utils.formatUnits(userLiquidity, 18)}`);
    
    if (userLiquidity.gt(0)) {
      console.log(`Đang xóa thanh khoản của user...`);
      try {
        const removeLiquidityTx = await simpleDex.removeLiquidity(
          token1Info.tokenAddress,
          token2Info.tokenAddress,
          userLiquidity,
          { gasLimit: 500000 }
        );
        
        console.log("Transaction sent:", removeLiquidityTx.hash);
        console.log("Đang chờ xác nhận...");
        
        const receipt = await removeLiquidityTx.wait();
        console.log("Đã xóa thanh khoản thành công!");
        console.log("Gas đã sử dụng:", receipt.gasUsed.toString());
        
        removedCount++;
        
      } catch (error: any) {
        console.log("Thất bại khi xóa thanh khoản:", error.message);
        skippedCount++;
      }
    } else {
      console.log(`User không có thanh khoản trong pool này.`);
      skippedCount++;
    }
  }

  // Check final state
  console.log(`\n${"=".repeat(60)}`);
  console.log("KIỂM TRA TRẠNG THÁI SAU KHI XÓA THANH KHOẢN");
  console.log("=".repeat(60));
  
  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry as [string, any];
    const [token2Name, token2Info] = token2Entry as [string, any];

    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    
    console.log(`Pool ${token1Name}-${token2Name}:`);
    console.log(`  Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`  Total Liquidity: ${ethers.utils.formatUnits(liquidity, 18)} LP tokens`);
    console.log("");
  }

  // Check DEX token balances
  console.log("Kiểm tra số dư token trong DEX contract:");
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const balance = await tokenContract.balanceOf(simpleDexAddress);
    console.log(`${tokenName} (${(tokenInfo as any).symbol}): ${ethers.utils.formatUnits(balance, (tokenInfo as any).decimals)}`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("HOÀN THÀNH XÓA THANH KHOẢN!");
  console.log(`${"=".repeat(60)}`);
  console.log(`Tổng kết :`);
  console.log(`Tổng số pools: ${tokenPairs.length}`);
  console.log(`Đã xóa: ${removedCount}`);
  console.log(`Bỏ qua: ${skippedCount}`);
  console.log(`Bước tiếp theo: Chạy lại 04-add-initial-liquidity.ts`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 