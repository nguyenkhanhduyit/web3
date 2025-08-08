import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Testing pool prices and USD valuations...\n");

  // Read deployed addresses
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const priceOracleAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/PriceOracleAddress.json"), "utf8")
  ).address;

  const [deployer] = await ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  console.log("SimpleDEX address:", simpleDexAddress);
  console.log("PriceOracle address:", priceOracleAddress);

  // Get contracts
  const simpleDex = await ethers.getContractAt("SimpleDEX", simpleDexAddress);
  const priceOracle = await ethers.getContractAt("PriceOracle", priceOracleAddress);

  const usdTokenAddress = ethers.constants.AddressZero;
  const tokenEntries = Object.entries(tokens);

  console.log("\n" + "=".repeat(80));
  console.log("TESTING POOL PRICES AND USD VALUATIONS");
  console.log("=".repeat(80));

  // Generate all possible unique pairs
  const tokenPairs = [];
  for (let i = 0; i < tokenEntries.length; i++) {
    for (let j = i + 1; j < tokenEntries.length; j++) {
      tokenPairs.push([tokenEntries[i], tokenEntries[j]]);
    }
  }

  const results = [];

  for (let i = 0; i < tokenPairs.length; i++) {
    const [token1Entry, token2Entry] = tokenPairs[i];
    const [token1Name, token1Info] = token1Entry as [string, any];
    const [token2Name, token2Info] = token2Entry as [string, any];

    console.log(`\n${"-".repeat(60)}`);
    console.log(`Pool ${i + 1}/${tokenPairs.length}: ${token1Name}-${token2Name}`);
    console.log(`${"-".repeat(60)}`);

    try {
      // Get pool reserves
      const [reserve0, reserve1] = await simpleDex.getReserves(token1Info.tokenAddress, token2Info.tokenAddress);
      const liquidity = await simpleDex.getLiquidity(token1Info.tokenAddress, token2Info.tokenAddress);

      // Determine canonical order
      const token0Address = token1Info.tokenAddress < token2Info.tokenAddress ? token1Info.tokenAddress : token2Info.tokenAddress;
      const token1Address = token1Info.tokenAddress < token2Info.tokenAddress ? token2Info.tokenAddress : token1Info.tokenAddress;
      
      const token0Info = token0Address === token1Info.tokenAddress ? token1Info : token2Info;
      const token1InfoCanonical = token0Address === token1Info.tokenAddress ? token2Info : token1Info;

      // Get USD prices from PriceOracle
      const token0PriceUSD = await priceOracle.getPrice(token0Address, usdTokenAddress);
      const token1PriceUSD = await priceOracle.getPrice(token1Address, usdTokenAddress);

      // Calculate AMM price
      const ammPrice = reserve1 / reserve0; // Price of token1 in terms of token0
      const ammPriceReversed = reserve0 / reserve1; // Price of token0 in terms of token1

      // Calculate USD values of reserves
      const token0ReserveUSD = (reserve0 * token0PriceUSD) / ethers.utils.parseUnits("1", 18);
      const token1ReserveUSD = (reserve1 * token1PriceUSD) / ethers.utils.parseUnits("1", 18);
      const totalPoolValueUSD = token0ReserveUSD + token1ReserveUSD;

      // Calculate expected USD prices
      const expectedToken0PriceUSD = token0Info.symbol === "BTC" ? 113000 : 
                                   token0Info.symbol === "ETH" ? 3800 : 1;
      const expectedToken1PriceUSD = token1InfoCanonical.symbol === "BTC" ? 113000 : 
                                   token1InfoCanonical.symbol === "ETH" ? 3800 : 1;

      // Calculate price ratios
      const expectedPriceRatio = expectedToken1PriceUSD / expectedToken0PriceUSD;
      const actualPriceRatio = parseFloat(ethers.utils.formatUnits(token1PriceUSD, 18)) / 
                              parseFloat(ethers.utils.formatUnits(token0PriceUSD, 18));

      console.log(`Pool: ${token0Info.symbol}-${token1InfoCanonical.symbol}`);
      console.log(`Reserves: ${ethers.utils.formatUnits(reserve0, token0Info.decimals)} ${token0Info.symbol}, ${ethers.utils.formatUnits(reserve1, token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol}`);
      console.log(`Total Liquidity: ${ethers.utils.formatUnits(liquidity, 18)} LP tokens`);
      
      console.log(`\nUSD Prices (Oracle):`);
      console.log(`  ${token0Info.symbol}: $${ethers.utils.formatUnits(token0PriceUSD, 18)} USD`);
      console.log(`  ${token1InfoCanonical.symbol}: $${ethers.utils.formatUnits(token1PriceUSD, 18)} USD`);
      
      console.log(`\nExpected USD Prices:`);
      console.log(`  ${token0Info.symbol}: $${expectedToken0PriceUSD} USD`);
      console.log(`  ${token1InfoCanonical.symbol}: $${expectedToken1PriceUSD} USD`);
      
      console.log(`\nPrice Accuracy:`);
      console.log(`  Expected ratio: ${expectedPriceRatio}`);
      console.log(`  Actual ratio: ${actualPriceRatio.toFixed(6)}`);
      console.log(`  Accuracy: ${((actualPriceRatio / expectedPriceRatio) * 100).toFixed(2)}%`);
      
      console.log(`\nPool Value:`);
      console.log(`  ${token0Info.symbol} value: $${ethers.utils.formatUnits(token0ReserveUSD, 18)} USD`);
      console.log(`  ${token1InfoCanonical.symbol} value: $${ethers.utils.formatUnits(token1ReserveUSD, 18)} USD`);
      console.log(`  Total pool value: $${ethers.utils.formatUnits(totalPoolValueUSD, 18)} USD`);

      // Test swap estimation
      const testAmount = ethers.utils.parseUnits("1", token0Info.decimals); // 1 token0
      const estimatedOutput = await simpleDex.getAmountOut(token0Address, token1Address, testAmount);
      
      console.log(`\nSwap Test (1 ${token0Info.symbol}):`);
      console.log(`  Input: 1 ${token0Info.symbol}`);
      console.log(`  Output: ${ethers.utils.formatUnits(estimatedOutput, token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol}`);
      console.log(`  Effective price: ${ethers.utils.formatUnits(estimatedOutput, token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol} per ${token0Info.symbol}`);

      const result = {
        poolName: `${token0Info.symbol}-${token1InfoCanonical.symbol}`,
        reserves: {
          token0: {
            symbol: token0Info.symbol,
            amount: ethers.utils.formatUnits(reserve0, token0Info.decimals),
            usdPrice: ethers.utils.formatUnits(token0PriceUSD, 18),
            expectedPrice: expectedToken0PriceUSD
          },
          token1: {
            symbol: token1InfoCanonical.symbol,
            amount: ethers.utils.formatUnits(reserve1, token1InfoCanonical.decimals),
            usdPrice: ethers.utils.formatUnits(token1PriceUSD, 18),
            expectedPrice: expectedToken1PriceUSD
          }
        },
        priceAccuracy: {
          expectedRatio: expectedPriceRatio,
          actualRatio: actualPriceRatio,
          accuracyPercent: (actualPriceRatio / expectedPriceRatio) * 100
        },
        poolValue: {
          token0Value: ethers.utils.formatUnits(token0ReserveUSD, 18),
          token1Value: ethers.utils.formatUnits(token1ReserveUSD, 18),
          totalValue: ethers.utils.formatUnits(totalPoolValueUSD, 18)
        },
        swapTest: {
          input: `1 ${token0Info.symbol}`,
          output: `${ethers.utils.formatUnits(estimatedOutput, token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol}`,
          effectivePrice: `${ethers.utils.formatUnits(estimatedOutput, token1InfoCanonical.decimals)} ${token1InfoCanonical.symbol}/${token0Info.symbol}`
        },
        liquidity: ethers.utils.formatUnits(liquidity, 18)
      };

      results.push(result);

    } catch (error) {
      console.log(`Error testing pool ${token1Name}-${token2Name}:`, error.message);
      
      const errorResult = {
        poolName: `${token1Name}-${token2Name}`,
        error: error.message,
        status: "failed"
      };
      
      results.push(errorResult);
    }
  }

  // Save results
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "PoolPriceTest.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalPools: tokenPairs.length,
      results: results
    }, null, 2)
  );

  console.log(`\n${"=".repeat(80)}`);
  console.log("POOL PRICE TEST COMPLETED");
  console.log(`${"=".repeat(80)}`);
  console.log(`Results saved to: info/PoolPriceTest.json`);
  console.log(`Total pools tested: ${tokenPairs.length}`);
  
  // Summary
  const successfulTests = results.filter(r => !r.error).length;
  const failedTests = results.filter(r => r.error).length;
  
  console.log(`Successful tests: ${successfulTests}`);
  console.log(`Failed tests: ${failedTests}`);
  
  if (successfulTests > 0) {
    const avgAccuracy = results
      .filter(r => r.priceAccuracy)
      .reduce((sum, r) => sum + r.priceAccuracy.accuracyPercent, 0) / 
      results.filter(r => r.priceAccuracy).length;
    
    console.log(`Average price accuracy: ${avgAccuracy.toFixed(2)}%`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 