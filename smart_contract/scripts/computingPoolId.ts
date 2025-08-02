import fs from "fs";
import path from "path";
import { keccak256, defaultAbiCoder, getAddress } from "ethers/lib/utils";

// Address zero cho hooks (nếu không sử dụng hooks custom)
const HOOKS_ADDRESS = "0x0000000000000000000000000000000000000000";

// Hàm tính poolId từ PoolKey
function computePoolId(token0: string, token1: string, fee: number, tickSpacing: number, hooks: string): string {
  return keccak256(
    defaultAbiCoder.encode(
      ["address", "address", "uint24", "int24", "address"],
      [
        getAddress(token0),
        getAddress(token1),
        fee,
        tickSpacing,
        getAddress(hooks),
      ]
    )
  );
}

// Đọc file PoolAddress.json
const filePath = path.resolve(__dirname, "../info/PoolAddress.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

console.log("Pool IDs:\n");

for (const poolName of Object.keys(data)) {
  const pool = data[poolName];
  const { token0, token1, fee, tickSpacing } = pool;
  const poolId = computePoolId(token0, token1, fee, tickSpacing, HOOKS_ADDRESS);
  console.log(`${poolName}: ${poolId}`);
}
