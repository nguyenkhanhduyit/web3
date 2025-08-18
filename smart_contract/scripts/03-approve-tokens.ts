import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang approve tokens for SwapDex...\n");

  // Read deployed addresses
  const tokens = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/TokenAddress.json"), "utf8")
  );
  
  const swapDexAddress = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../info/SwapDexAddress.json"), "utf8")
  ).address;

  const [deployer] = await ethers.getSigners();
  
  console.log("Người deploy có địa chỉ ví :", deployer.address);
  console.log("Địa chỉ SimpleDEX :", swapDexAddress);

  const approvalResults: any = {};

  // Approvals sized to cover planned liquidity across all pools with buffer
  // Planned liquidity usage (10x larger pools):
  // - BTC: 19,000 (BTC-USDT) + 19,000 (BTC-ETH) = 38,000
  // - ETH: 565,000 (BTC-ETH) + 565,000 (ETH-USDT) = 1,130,000
  // - USDT: 2,147,000,000 (BTC-USDT) + 2,147,000,000 (ETH-USDT) = 4,294,000,000
  const amounts = {
    "Bitcoin": "40000",         // buffer above 38,000
    "Ethereum": "1200000",      // buffer above 1,130,000
    "Tether USD": "4500000000"  // buffer above 4,294,000,000
  };

  // Approve all tokens for SwapDex
  for (const [tokenName, tokenInfo] of Object.entries(tokens)) {
     const amountToApprove = amounts[tokenName];
      if (!amountToApprove) {
        console.warn(`Không tìm thấy amount cho token ${tokenName}, bỏ qua.`);
        continue;
      }
    console.log(`\nĐang approve token có tên : ${tokenName} - (${tokenInfo.symbol})...`);
    console.log(`Có địa chỉ Token : ${tokenInfo.tokenAddress}`);
    /*
ethers.Contract là cách ethers.js tạo một đối tượng để tương tác với smart contract đã deploy trên blockchain.

tokenInfo.tokenAddress là địa chỉ token ERC20 mà bạn đã deploy trước đó ( BTC, ETH, USDT ).

ABI được truyền vào chỉ gồm hai hàm của chuẩn ERC20:

approve(address spender, uint256 amount) -> cho phép spender tiêu số lượng token nhất định.

allowance(address owner, address spender) -> kiểm tra hiện tại spender được phép tiêu bao nhiêu token của owner.

=>một phần ABI theo chuẩn ERC20 – trích ra 2 hàm approve và allowance cần dùng .
    */
    const tokenContract = new ethers.Contract(tokenInfo.tokenAddress, [
      "function approve(address,uint256) external returns (bool)",
      "function allowance(address,address) external view returns (uint256)"
    ], deployer);

    try {
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(deployer.address, swapDexAddress);
      console.log(`Current allowance: ${ethers.utils.formatUnits(currentAllowance, tokenInfo.decimals)}
       ${tokenInfo.symbol}`);
      if (currentAllowance.isZero()) {
        
        // Approve tokens for SwapDEX
        const approveAmount = ethers.utils.parseUnits(amountToApprove, tokenInfo.decimals);
        console.log(`Đang approve ${ethers.utils.formatUnits(approveAmount, tokenInfo.decimals)} 
        ${tokenInfo.symbol} for SimpleDEX...`);
        const approveTx = await tokenContract.approve(swapDexAddress, approveAmount);
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