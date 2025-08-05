import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// --- 1) Deploy ERC20 tokens ---
async function deployTokens() {
  const artifactsDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

  const tokensCfg = [
    { name: "Bitcoin",  symbol: "BTC",  initialSupply: "1000000", decimals: 18 },
    { name: "Ethereum", symbol: "ETH",  initialSupply: "1000000", decimals: 18 },
    { name: "Tether",   symbol: "USDT", initialSupply: "1000000", decimals: 6  },
  ];

  const out: Record<string, any> = {};
  const [deployer] = await ethers.getSigners();

  for (const cfg of tokensCfg) {
    const Factory = await ethers.getContractFactory("Token");
    const supply = ethers.utils.parseUnits(cfg.initialSupply, cfg.decimals);
    const token = await Factory.deploy(cfg.name, cfg.symbol, supply);
    await token.deployed();
    const receipt = await token.deployTransaction.wait();
    out[cfg.name] = {
      ...cfg,
      tokenAddress: token.address,
      blockNumber: receipt.blockNumber,
      deployedAt: new Date().toISOString(),
    };
    console.log(`=> Deployed ${cfg.symbol} at ${token.address}`);
  }

  fs.writeFileSync(
    path.join(artifactsDir, "TokenAddress.json"),
    JSON.stringify(out, null, 2)
  );
  return out;
}

// Tính poolId
export function computePoolId(
  tokenA: string,
  tokenB: string,
  fee: number,
  tickSpacing: number,
  hook: string
): string {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint24", "int24", "address"],
    [token0, token1, fee, tickSpacing, hook]
  );

  return ethers.utils.keccak256(encoded);
}

// --- 2) Create Pools ---
async function createPools(tokens: Record<string, any>) {
  const pmgr = process.env.POOL_MANAGER_ADDRESS;
  if (!pmgr) {
    throw new Error("POOL_MANAGER_ADDRESS not found in environment");
  }

  const fee = 3000, tickSpacing = 60;
  const hooks = ethers.constants.AddressZero;
  const sqrtPriceX96 = ethers.BigNumber.from("79228162514264337593543950336");

  const out: Record<string, any> = {};
  const [deployer] = await ethers.getSigners();
  const poolManager = await ethers.getContractAt("IPoolManager", pmgr);

  const entries = Object.entries(tokens);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [nA, a] = entries[i], [nB, b] = entries[j];
      const [t0, t1] =
        a.tokenAddress.toLowerCase() < b.tokenAddress.toLowerCase()
          ? [a.tokenAddress, b.tokenAddress]
          : [b.tokenAddress, a.tokenAddress];
      const key = `${nA}-${nB}`;
      if (out[key]) continue;
      
      console.log(`------------ Initializing pool ${key} ------------`);
      
      try {
        const poolKey = {
          currency0: ethers.utils.getAddress(t0),
          currency1: ethers.utils.getAddress(t1),
          fee,
          tickSpacing,
          hooks
        };
        
        const tx = await poolManager.initialize(
          poolKey,
          sqrtPriceX96
        );
        const poolId = computePoolId(t0, t1, fee, tickSpacing, hooks);
        await tx.wait();
        out[key] = { 
          poolId: poolId,
          token0: t0, 
          token1: t1, 
          fee, 
          tickSpacing, 
          createdAt: new Date().toISOString()
        };
        console.log(`=> Pool ${key} created with poolId: ${poolId}`);
      } catch (error) {
        console.error(`Failed to create pool ${key}:`, error.message);
      }
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, "../info/PoolAddress.json"),
    JSON.stringify(out, null, 2)
  );
  return out;
}

// --- 3) Deploy V4LiquidityManager ---
async function deployV4LiquidityManager() {
  const pmgr = process.env.POOL_MANAGER_ADDRESS;
  
  if (!pmgr) {
    throw new Error("POOL_MANAGER_ADDRESS not found");
  }

  const Factory = await ethers.getContractFactory("V4LiquidityManager");
  const liqManager = await Factory.deploy(pmgr);
  await liqManager.deployed();
  console.log("=> Deployed V4LiquidityManager at", liqManager.address);

  fs.writeFileSync(
    path.resolve(__dirname, "../info/V4LiquidityManagerAddress.json"),
    JSON.stringify({ address: liqManager.address }, null, 2)
  );
  return liqManager.address;
}

// --- 4) Approve tokens ---
async function approveAll(tokens: Record<string, any>, target: string) {
  const erc20Abi = [
    "function approve(address,uint256) external returns (bool)",
    "function allowance(address,address) external view returns (uint256)"
  ];
 
  const [deployer] = await ethers.getSigners();

  for (const info of Object.values(tokens)) {
    const c = new ethers.Contract(info.tokenAddress, erc20Abi, deployer);
    const amount = ethers.utils.parseUnits("100000", info.decimals);
    
    const al = await c.allowance(deployer.address, target);
    if (al.lt(amount)) {
      await (await c.approve(target, amount)).wait();
      console.log(`=> Approved ${info.symbol} → ${target}`);
    } else {
      console.log(`=> ${info.symbol} already approved for ${target}`);
    }
  }
}

// --- 5) Add Liquidity via V4LiquidityManager ---
async function addLiquidity(tokens: Record<string, any>, pools: Record<string, any>) {
  const liqManagerAddr = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/V4LiquidityManagerAddress.json"), "utf8")
  ).address;

  const liqManager = await ethers.getContractAt("V4LiquidityManager", liqManagerAddr);
  const [deployer] = await ethers.getSigners();
  
  // Uniswap V4 tick constants
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;
  
  for (const [key, p] of Object.entries(pools)) {
    const token0Info = Object.values(tokens).find(t => t.tokenAddress.toLowerCase() === p.token0.toLowerCase());
    const token1Info = Object.values(tokens).find(t => t.tokenAddress.toLowerCase() === p.token1.toLowerCase());

    if (!token0Info || !token1Info) {
      console.warn(`=> Skipping ${key} due to missing token info`);
      continue;
    }
    
    // Calculate usable tick range based on tick spacing
    const tickSpacing = p.tickSpacing || 60;
    const minUsableTick = Math.floor(MIN_TICK / tickSpacing) * tickSpacing;
    const maxUsableTick = Math.floor(MAX_TICK / tickSpacing) * tickSpacing;

    // Use a more conservative range around the current price
    const tickLower = -tickSpacing * 5; // This should be -300 for tickSpacing=60
    const tickUpper = tickSpacing * 5;   // This should be 300 for tickSpacing=60

    const amount0 = ethers.utils.parseUnits("1000", token0Info.decimals);
    const amount1 = ethers.utils.parseUnits("1000", token1Info.decimals);

    const alignedTickLower = Math.max(minUsableTick, Math.floor(tickLower / tickSpacing) * tickSpacing);
    const alignedTickUpper = Math.min(maxUsableTick, Math.ceil(tickUpper / tickSpacing) * tickSpacing);
    
    console.log(`Adding liquidity to ${key}`);
    console.log(`Tick range: ${alignedTickLower} to ${alignedTickUpper}`);

    try {
      const poolKey = {
        currency0: ethers.utils.getAddress(p.token0),
        currency1: ethers.utils.getAddress(p.token1),
        fee: p.fee,
        tickSpacing: p.tickSpacing,
        hooks: ethers.constants.AddressZero
      };

      const tx = await liqManager.addLiquidity(
        poolKey,
        alignedTickLower,
        alignedTickUpper,
        amount0,
        amount1,
        0, // amount0Min
        0, // amount1Min
        { 
          value: ethers.constants.Zero,
          gasLimit: 1000000
        }
      );
      await tx.wait();
      console.log(`=> Liquidity added for ${key}`);
    } catch (error) {
      console.error(`=> Failed to add liquidity for ${key}:`, error.message);
    }
  }
}

async function main() {
  console.log("Starting deployment and liquidity addition...");
  
  // 1. Deploy tokens
  console.log("\n1. Deploying tokens...");
  const tokens = await deployTokens();
  
  // 2. Create pools
  console.log("\n2. Creating pools...");
  const pools = await createPools(tokens);
  
  // 3. Deploy V4LiquidityManager
  console.log("\n3. Deploying V4LiquidityManager...");
  const liqManagerAddr = await deployV4LiquidityManager();
  
  // 4. Approve tokens
  console.log("\n4. Approving tokens...");
  await approveAll(tokens, liqManagerAddr);
  
  // 5. Add liquidity
  console.log("\n5. Adding liquidity...");
  await addLiquidity(tokens, pools);

  console.log("\n✅ All done! Liquidity has been added to pools.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 