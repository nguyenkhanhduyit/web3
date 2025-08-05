import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Debug: Kiểm tra vấn đề với pool Bitcoin-Ethereum...\n");

  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);

  // Get Bitcoin and Ethereum token info
  const btcInfo = tokens.Bitcoin;
  const ethInfo = tokens.Ethereum;

  console.log("Token Addresses:");
  console.log(`Bitcoin (BTC): ${btcInfo.tokenAddress}`);
  console.log(`Ethereum (ETH): ${ethInfo.tokenAddress}`);
  console.log(`SimpleDEX: ${simpleDexAddress}\n`);

  // Check token balances
  const btcContract = await ethers.getContractAt("Token", btcInfo.tokenAddress);
  const ethContract = await ethers.getContractAt("Token", ethInfo.tokenAddress);

  const btcBalance = await btcContract.balanceOf(simpleDexAddress);
  const ethBalance = await ethContract.balanceOf(simpleDexAddress);

  console.log("Token Balances in DEX:");
  console.log(`BTC: ${ethers.utils.formatUnits(btcBalance, btcInfo.decimals)}`);
  console.log(`ETH: ${ethers.utils.formatUnits(ethBalance, ethInfo.decimals)}\n`);

  // Check reserves
  const reserves = await simpleDex.getReserves(btcInfo.tokenAddress, ethInfo.tokenAddress);
  console.log("Pool Reserves:");
  console.log(`Reserve0: ${ethers.utils.formatUnits(reserves[0], btcInfo.decimals)} BTC`);
  console.log(`Reserve1: ${ethers.utils.formatUnits(reserves[1], ethInfo.decimals)} ETH\n`);

  // Check which token is token0 and which is token1
  const token0Address = btcInfo.tokenAddress < ethInfo.tokenAddress ? btcInfo.tokenAddress : ethInfo.tokenAddress;
  const token1Address = btcInfo.tokenAddress < ethInfo.tokenAddress ? ethInfo.tokenAddress : btcInfo.tokenAddress;

  console.log("Token Ordering:");
  console.log(`Token0 (lower address): ${token0Address}`);
  console.log(`Token1 (higher address): ${token1Address}\n`);

  // Check if the reserves match the token order
  if (btcInfo.tokenAddress < ethInfo.tokenAddress) {
    console.log("Bitcoin is Token0, Ethereum is Token1");
    console.log(`Expected BTC in reserve0: ${ethers.utils.formatUnits(reserves[0], btcInfo.decimals)}`);
    console.log(`Expected ETH in reserve1: ${ethers.utils.formatUnits(reserves[1], ethInfo.decimals)}`);
  } else {
    console.log("Ethereum is Token0, Bitcoin is Token1");
    console.log(`Expected ETH in reserve0: ${ethers.utils.formatUnits(reserves[0], ethInfo.decimals)}`);
    console.log(`Expected BTC in reserve1: ${ethers.utils.formatUnits(reserves[1], btcInfo.decimals)}`);
  }

  // Check liquidity
  const liquidity = await simpleDex.getLiquidity(btcInfo.tokenAddress, ethInfo.tokenAddress);
  console.log(`\nTotal Liquidity: ${ethers.utils.formatUnits(liquidity, 18)} LP tokens`);

  // Try to get reserves in reverse order
  console.log("\nTrying reserves in reverse order:");
  const reservesReverse = await simpleDex.getReserves(ethInfo.tokenAddress, btcInfo.tokenAddress);
  console.log(`Reserve0: ${ethers.utils.formatUnits(reservesReverse[0], ethInfo.decimals)} ETH`);
  console.log(`Reserve1: ${ethers.utils.formatUnits(reservesReverse[1], btcInfo.decimals)} BTC`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 