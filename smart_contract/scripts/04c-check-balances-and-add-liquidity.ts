import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Kiểm tra số dư token và thêm thanh khoản với tỷ lệ chính xác...\n");

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
  
  console.log(`\nKiểm tra số dư token và trạng thái pool:`);
  
  // Check balances and pool status
  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry;
    const [token2Name, token2Info] = token2Entry;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Pool ${i + 1}/${tokenPairs.length}: ${token1Name}-${token2Name}`);
    
    // Get token contracts
    const token1Contract = await ethers.getContractAt("Token", token1Info.tokenAddress);
    const token2Contract = await ethers.getContractAt("Token", token2Info.tokenAddress);
    
    // Check balances
    const balance1 = await token1Contract.balanceOf(deployer.address);
    const balance2 = await token2Contract.balanceOf(deployer.address);
    
    console.log(`Số dư ${token1Info.symbol}: ${ethers.utils.formatUnits(balance1, token1Info.decimals)}`);
    console.log(`Số dư ${token2Info.symbol}: ${ethers.utils.formatUnits(balance2, token2Info.decimals)}`);
    
    // Check pool reserves
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    
    console.log(`Pool reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`Total Liquidity: ${ethers.utils.formatUnits(liquidity, 18)}`);
    
    // Calculate ratio
    if (reserves[0].gt(0) && reserves[1].gt(0)) {
      const ratio = reserves[1].mul(ethers.utils.parseUnits("1", token1Info.decimals)).div(reserves[0]);
      console.log(`Tỷ lệ ${token2Info.symbol}/${token1Info.symbol}: ${ethers.utils.formatUnits(ratio, token2Info.decimals)}`);
    }
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log("KIỂM TRA HOÀN TẤT!");
  console.log(`${"=".repeat(60)}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 