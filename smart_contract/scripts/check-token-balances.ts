import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Kiểm tra số dư token và reserves trong DEX...\n");

  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);

  // Check balances for the DEX contract address
  const dexAddress = simpleDexAddress;
  console.log(`Kiểm tra số dư token trong DEX contract: ${dexAddress}\n`);

  const tokenEntries = Object.entries(tokens);
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const balance = await tokenContract.balanceOf(dexAddress);
    console.log(`${tokenName} (${(tokenInfo as any).symbol}): ${ethers.utils.formatUnits(balance, (tokenInfo as any).decimals)}`);
  }

  // Check the deployer address
  const [deployer] = await ethers.getSigners();
  console.log(`\nKiểm tra số dư cho deployer: ${deployer.address}\n`);
  
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const balance = await tokenContract.balanceOf(deployer.address);
    console.log(`${tokenName} (${(tokenInfo as any).symbol}): ${ethers.utils.formatUnits(balance, (tokenInfo as any).decimals)}`);
  }

  // Check DEX reserves for each pool
  console.log(`\nKiểm tra reserves trong các pool DEX:\n`);
  
  // Generate all possible unique pairs
  const tokenPairs = [];
  for (let i = 0; i < tokenEntries.length; i++) {
    for (let j = i + 1; j < tokenEntries.length; j++) {
      tokenPairs.push([tokenEntries[i], tokenEntries[j]]);
    }
  }

  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry as [string, any];
    const [token2Name, token2Info] = token2Entry as [string, any];

    console.log(`Pool ${token1Name}-${token2Name}:`);
    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);
    
    console.log(`  Reserves: ${ethers.utils.formatUnits(reserves[0], token1Info.decimals)} ${token1Info.symbol}, ${ethers.utils.formatUnits(reserves[1], token2Info.decimals)} ${token2Info.symbol}`);
    console.log(`  Total Liquidity: ${ethers.utils.formatUnits(liquidity, 18)} LP tokens`);
    console.log("");
  }

  // Check total supply of each token
  console.log(`Kiểm tra tổng cung của mỗi token:\n`);
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const totalSupply = await tokenContract.totalSupply();
    console.log(`${tokenName} (${(tokenInfo as any).symbol}): ${ethers.utils.formatUnits(totalSupply, (tokenInfo as any).decimals)}`);
  }

  // Verify that DEX balances match the sum of all reserves
  console.log(`\nKiểm tra tính nhất quán giữa số dư DEX và tổng reserves:\n`);
  
  let totalDexBalances: { [key: string]: any } = {};
  
  // Initialize total balances
  for (const [tokenName, tokenInfo] of tokenEntries) {
    totalDexBalances[tokenName] = ethers.BigNumber.from(0);
  }
  
  // Sum up all reserves - correctly handling token ordering
  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry as [string, any];
    const [token2Name, token2Info] = token2Entry as [string, any];

    const reserves = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
    
    // Determine which token is token0 and which is token1 based on address ordering
    const token0Address = token1Info.tokenAddress < token2Info.tokenAddress ? token1Info.tokenAddress : token2Info.tokenAddress;
    const token1Address = token1Info.tokenAddress < token2Info.tokenAddress ? token2Info.tokenAddress : token1Info.tokenAddress;
    
    // Map reserves to the correct tokens
    if (token1Info.tokenAddress === token0Address) {
      // Token1 is token0, Token2 is token1
      totalDexBalances[token1Name] = totalDexBalances[token1Name].add(reserves[0]);
      totalDexBalances[token2Name] = totalDexBalances[token2Name].add(reserves[1]);
    } else {
      // Token2 is token0, Token1 is token1
      totalDexBalances[token2Name] = totalDexBalances[token2Name].add(reserves[0]);
      totalDexBalances[token1Name] = totalDexBalances[token1Name].add(reserves[1]);
    }
  }
  
  // Compare with actual DEX balances
  for (const [tokenName, tokenInfo] of tokenEntries) {
    const tokenContract = await ethers.getContractAt("Token", (tokenInfo as any).tokenAddress);
    const actualBalance = await tokenContract.balanceOf(dexAddress);
    const calculatedBalance = totalDexBalances[tokenName];
    
    console.log(`${tokenName} (${(tokenInfo as any).symbol}):`);
    console.log(`  Số dư thực tế trong DEX: ${ethers.utils.formatUnits(actualBalance, (tokenInfo as any).decimals)}`);
    console.log(`  Tổng reserves: ${ethers.utils.formatUnits(calculatedBalance, (tokenInfo as any).decimals)}`);
    console.log(`  Khớp: ${actualBalance.eq(calculatedBalance) ? "✅" : "❌"}`);
    console.log("");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 