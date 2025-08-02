import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import PoolManagerABI from "../info/abi/PoolManager.json"
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

//ngày giờ Việt
function getVietnamTimeISO() {
  const now = new Date();
  const vietnamOffsetMs = 7 * 60 * 60 * 1000; // GMT+7 in milliseconds
  const vietnamTime = new Date(now.getTime() + vietnamOffsetMs);
  return vietnamTime.toISOString().replace("Z", "+07:00");
}

//tính poolId
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
  // if (!pmgr) {
  //   console.log("No POOL_MANAGER_ADDRESS found, skipping pool creation");
  //   // Create mock pool data for testing
  //   const out: Record<string, any> = {};
  //   const entries = Object.entries(tokens);
  //   for (let i = 0; i < entries.length; i++) {
  //     for (let j = i + 1; j < entries.length; j++) {
  //       const [nA, a] = entries[i], [nB, b] = entries[j];
  //       const [t0, t1] =
  //         a.tokenAddress.toLowerCase() < b.tokenAddress.toLowerCase()
  //           ? [a.tokenAddress, b.tokenAddress]
  //           : [b.tokenAddress, a.tokenAddress];
  //       const key = `${nA}-${nB}`;
  //       out[key] = { 
  //         token0: t0, 
  //          token1: t1, 
  //         fee: 3000, 
  //         tickSpacing: 60, 
  //         createdAt: new Date().toISOString() 
  //       };
  //       console.log(`Mock pool ${key} created`);
  //     }
  //   }
    
  //   fs.writeFileSync(
  //    path.resolve(__dirname, "../info/PoolAddress.json"),
  //     JSON.stringify(out, null, 2)
  //   );
  //   return out;
  // }

  const fee = 3000, tickSpacing = 60;

  const hooks = ethers.constants.AddressZero;

  const sqrtPriceX96 = ethers.BigNumber.from(
    "79228162514264337593543950336"
  );

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
      const tx = await poolManager.initialize(
        { currency0: t0, currency1: t1, fee, tickSpacing, hooks },
        sqrtPriceX96
      );
      const poolId = computePoolId(t0,t1,fee,tickSpacing,hooks)
      await tx.wait();
      out[key] = { poolId : poolId,token0: t0, token1: t1, fee, tickSpacing, createdAt: getVietnamTimeISO()};
      console.log(`=> Pool ${key} created`);
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, "../info/PoolAddress.json"),
    JSON.stringify(out, null, 2)
  );
  return out;
}

// --- 3) Deploy SimpleLiquidity contract ---
async function deploySimpleLiquidity() {
  const Factory = await ethers.getContractFactory("SimpleLiquidity");
  const liq = await Factory.deploy();
  await liq.deployed();
  console.log("=> Deployed SimpleLiquidity at", liq.address);

  fs.writeFileSync(
    path.resolve(__dirname, "../info/LiquidityAddress.json"),
    JSON.stringify({ address: liq.address }, null, 2)
  );
  return liq.address;
}

// --- 4) Approve tokens ---
async function approveAll(tokens: Record<string, any>, targets: string[]) {
  const erc20Abi = [
    "function approve(address,uint256) external returns (bool)",
    "function allowance(address,address) external view returns (uint256)"
  ];
 
  const [deployer] = await ethers.getSigners();

  for (const info of Object.values(tokens)) {
    const c = new ethers.Contract(info.tokenAddress, erc20Abi, deployer);
     const amount = ethers.utils.parseUnits("100000", info.decimals);
    for (const spender of targets) {
      const al = await c.allowance(deployer.address, spender);
      if (al.lt(amount)) {
        await (await c.approve(spender, amount)).wait();
        console.log(`=> Approved ${info.symbol} → ${spender}`);
      } else {
        console.log(`------------${info.symbol} already approved for ${spender}------------`);
      }
    }
  }
}

// --- 5) Add Liquidity via SimpleLiquidity ---
async function addLiquidity(tokens: Record<string, any>, pools: Record<string, any>) {
  const liqAddr = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/LiquidityAddress.json"), "utf8")
  ).address;

  const simpleLiquidity = await ethers.getContractAt("SimpleLiquidity", liqAddr);
  const [deployer] = await ethers.getSigners();
  // Uniswap V4 tick constants
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;
  for (const [key, p] of Object.entries(pools)) {
    const token0Info = Object.values(tokens).find(t => t.tokenAddress.toLowerCase() === p.token0.toLowerCase());
    const token1Info = Object.values(tokens).find(t => t.tokenAddress.toLowerCase() === p.token1.toLowerCase());

    if (!token0Info || !token1Info) {
     console.warn(`=>Skipping ${key} due to missing token info`);
      continue;
    }
    // Calculate usable tick range based on tick spacing
    const tickSpacing = p.tickSpacing || 60;
    const minUsableTick = Math.floor(MIN_TICK / tickSpacing) * tickSpacing;
    const maxUsableTick = Math.floor(MAX_TICK / tickSpacing) * tickSpacing;

    // Use a reasonable range around the current price (assumed to be around tick 0)
    const tickLower = -tickSpacing * 10; // This should be -600 for tickSpacing=60
    const tickUpper = tickSpacing * 10;   // This should be 600 for tickSpacing=60

    //     const amount0 = ethers.utils.parseUnits(
    //   (parseFloat(token0Info.initialSupply) / 2).toString(),
    //   token0Info.decimals
    // );

    // const amount1 = ethers.utils.parseUnits(
    //   (parseFloat(token1Info.initialSupply) / 2).toString(),
    //   token1Info.decimals
    // );

    const amount0 = ethers.utils.parseUnits("50000", token0Info.decimals);
    const amount1 = ethers.utils.parseUnits("50000", token1Info.decimals);

    const alignedTickLower = Math.max(minUsableTick, Math.floor(tickLower / tickSpacing) * tickSpacing);
    const alignedTickUpper = Math.min(maxUsableTick, Math.ceil(tickUpper / tickSpacing) * tickSpacing);
    
    console.log(`Adding liquidity to ${key}`);
    console.log(`Tick range: ${alignedTickLower} to ${alignedTickUpper}`);

    try {
      const tx = await simpleLiquidity.addLiquidity(
        p.token0,
        p.token1,
        alignedTickLower, // tickLower
        alignedTickUpper,  // tickUpper
        p.fee,
        amount0,
        amount1,
        { 
          value: ethers.constants.Zero,
          gasLimit: 500000
        }
      );
      await tx.wait();
      console.log(`=> Liquidity added for ${key}`);
    } catch (error) {
      console.error(`=>Failed to add liquidity for ${key}:`, error.message);
    }
  }
}


async function main() {
  // 1
  const tokens = await deployTokens();
  // 2
  const pools  = await createPools(tokens);
  // 3
  const liqAddr = await deploySimpleLiquidity();
  // 4
  await approveAll(tokens, [liqAddr]);
  // 5
  await addLiquidity(tokens, pools);

  console.log("------------ Added All done! ------------");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
