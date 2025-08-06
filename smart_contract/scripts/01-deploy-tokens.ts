import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang deploy tokens...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Người deploy có địa chỉ  :", deployer.address);

  // Token configurations
  //lưu ý token có decimals khác nhưng decimals mặc định của contract là 18
  const tokens = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 18,
      totalSupply: "1000000000" // 1.000.000.000
    },
    {
      name: "Ethereum", 
      symbol: "ETH",
      decimals: 18,
      totalSupply: "1000000000" // 1.000.000.000
    },
    {
      name: "Tether USD",
      symbol: "USDT", 
      decimals: 18,
      totalSupply: "1000000000" // 1.000.000.000
    }
  ];

  const deployedTokens: any = {};

  for (const tokenConfig of tokens) {
    console.log(`\nĐang deploy token có thông tin : ${tokenConfig.name} (${tokenConfig.symbol})...`);
  //Hàm parseUnits() chuyển tổng cung từ dạng hiển thị
  //  "100000000" (một trăm triệu) sang đơn vị wei dựa trên decimals.
  /*
  Ví dụ từng token:
1. BTC — decimals: 8
parseUnits("1000000000", 8) = 100000000 * 10^8 = 100,000,000,000,000,000
  */
 /*
 3. USDT — decimals: 6
parseUnits("1000000000", 6) = 1000000000 * 10^6 = 1,000,000,000,000,000
 */
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
      tokenConfig.name,
      tokenConfig.symbol,
      ethers.utils.parseUnits(tokenConfig.totalSupply, tokenConfig.decimals),
      { gasLimit: 3000000 } // Thêm gasLimit rõ ràng để tránh lỗi _hex
    );
    
    await token.deployed();
    /*
    100.000.000 = 10^7 = 100M
    10.000.000 = 10^6 = 10M
    */
   console.log("-".repeat(50))
    console.log(`Đã deploy token có tên : ${tokenConfig.name} và có địa chỉ : ${token.address}`);
    console.log(`Với tổng cung : 
      ${(tokenConfig.totalSupply % 10 ** 8 === 0) ?
      "1B" : (tokenConfig.totalSupply % 10 ** 7 === 0) ? "100M" :
       (tokenConfig.totalSupply % 10 ** 6 === 0) ? '10M' :
        (tokenConfig.totalSupply % 10 ** 5 === 0)? "1M": 
        tokenConfig.totalSupply
  } - ${tokenConfig.symbol}`);
    
    deployedTokens[tokenConfig.name] = {
      tokenAddress: token.address,
      symbol: tokenConfig.symbol,
      decimals: tokenConfig.decimals,
      totalSupply: tokenConfig.totalSupply,
      deployedAt: new Date().toISOString()
    };
  }

  // Lưu lại thông tin token
  const infoDir = path.resolve(__dirname, "../info");
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(infoDir, "TokenAddress.json"),
    JSON.stringify(deployedTokens, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("Tất cả token đã được deploy...");
  console.log("=".repeat(50));
  console.log("Thông tin về token được lưu tại : info/TokenAddress.json");
  console.log("Bước tiếp theo sẽ là 02-deploy-simple-dex.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 