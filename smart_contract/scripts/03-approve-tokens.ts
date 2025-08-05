import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang approve tokens for SimpleDEX...\n");

  // Read deployed addresses
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const simpleDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SimpleDEXAddress.json"), "utf8")
  ).address;

  const [deployer] = await ethers.getSigners();
  
  console.log("Người deploy có địa chỉ ví :", deployer.address);
  console.log("Địa chỉ SimpleDEX :", simpleDexAddress);

  const approvalResults: any = {};

  // Approve all tokens for SimpleDEX
  for (const [tokenName, tokenInfo] of Object.entries(tokens)) {
    console.log(`\nĐang approve token có tên : ${tokenName} - (${tokenInfo.symbol})...`);
    console.log(`Có địa chỉ Token : ${tokenInfo.tokenAddress}`);
    
    const tokenContract = new ethers.Contract(tokenInfo.tokenAddress, [
      "function approve(address,uint256) external returns (bool)",
      "function allowance(address,address) external view returns (uint256)"
    ], deployer);

    try {
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(deployer.address, simpleDexAddress);
      console.log(`Current allowance: ${ethers.utils.formatUnits(currentAllowance, tokenInfo.decimals)} ${tokenInfo.symbol}`);
      
      if (currentAllowance.isZero()) {
        // Approve tokens for SimpleDEX
        const approveAmount = ethers.utils.parseUnits("10000000", tokenInfo.decimals); // 100M tokens
        console.log(`Đang approve ${ethers.utils.formatUnits(approveAmount, tokenInfo.decimals)} ${tokenInfo.symbol} for SimpleDEX...`);
        
        const approveTx = await tokenContract.approve(simpleDexAddress, approveAmount);
        console.log("Hash Giao dịch :", approveTx.hash);
        console.log("Đang chờ xác nhận...");
        
        const receipt = await approveTx.wait();
        console.log("Đã approve thành công");
        console.log("Gas đã sử dụng :", receipt.gasUsed.toString());
        
        approvalResults[tokenName] = {
          status: "approved",
          amount: ethers.utils.formatUnits(approveAmount, tokenInfo.decimals),
          transactionHash: approveTx.hash,
          gasUsed: receipt.gasUsed.toString(),
          timestamp: new Date().toISOString()
        };
      } else {
        console.log("Đã có đủ allowance");
        approvalResults[tokenName] = {
          status: "already_approved",
          currentAllowance: ethers.utils.formatUnits(currentAllowance, tokenInfo.decimals),
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.log("Approval lỗi :", error.message);
      approvalResults[tokenName] = {
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Save approval results
  const infoDir = path.resolve(__dirname, "../info");
  fs.writeFileSync(
    path.resolve(infoDir, "TokenApprovals.json"),
    JSON.stringify(approvalResults, null, 2)
  );

  console.log("\n" + "=".repeat(50));
  console.log("Tất cả tokens đã được approve");
  console.log("=".repeat(50));
  console.log("Thông tin approve lưu tại: info/TokenApprovals.json");
  console.log("Bước tiếp theo là thêm thanh khoản :  Run 04-add-initial-liquidity.ts");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 