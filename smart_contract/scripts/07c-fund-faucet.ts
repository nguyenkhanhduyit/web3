import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Funding faucet with tokens...");
    
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    if (!fs.existsSync(tokenInfoPath)) {
        throw new Error("TokenAddress.json không tồn tại. Hãy chạy 01-deploy-tokens.ts trước!");
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    console.log("Thông tin token đã deploy:", Object.keys(tokenInfo));
    
    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json");
    if (!fs.existsSync(faucetInfoPath)) {
        throw new Error("FaucetInfo.json không tồn tại. Hãy chạy 07a-deploy-faucet-contract.ts trước!");
    }
    
    const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"));
    console.log("Faucet address:", faucetInfo.faucetAddress);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    const fundAmounts = {
        "Bitcoin": ethers.parseUnits("1000", 8),     // 1000 BTC
        "Ethereum": ethers.parseUnits("100000", 18),  // 100.000 ETH  
        "Tether USD": ethers.parseUnits("1000000", 6) // 1.000.000 USDT
    };
    
    console.log("\nSố lượng token sẽ gửi vào faucet:");
    for (const [tokenName, amount] of Object.entries(fundAmounts)) {
        const tokenData = tokenInfo[tokenName];
        if (tokenData) {
            console.log(`- ${tokenName}: ${ethers.formatUnits(amount, tokenData.decimals)} ${tokenData.symbol}`);
        }
    }
    
    console.log("\nChuyển token vào faucet contract...");
    const fundingResults = [];
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        const fundAmount = fundAmounts[tokenName as keyof typeof fundAmounts];
        
        if (!fundAmount) {
            console.log(`No funding amount specified for ${tokenName}, skipping...`);
            continue;
        }
        
        console.log(`\nFunding ${tokenName}...`);
        
        const tokenContract = new ethers.Contract(tokenAddress, [
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        
        const deployerBalance = await tokenContract.balanceOf(deployer.address);
        console.log(`Deployer ${tokenName}
             balance: ${ethers.formatUnits(deployerBalance, tokenData.decimals)} ${tokenData.symbol}`);
        
        if (deployerBalance >= fundAmount) {
            try {
                const transferTx = await tokenContract.transfer(faucetInfo.faucetAddress, fundAmount);
                await transferTx.wait();
                console.log(`Đã chuyển ${ethers.formatUnits(fundAmount, tokenData.decimals)} ${tokenData.symbol} vào faucet`);
                
                fundingResults.push({
                    tokenName,
                    symbol: tokenData.symbol,
                    amount: ethers.formatUnits(fundAmount, tokenData.decimals),
                    success: true
                });
                
            } catch (error) {
                console.log(`Error transferring ${tokenName}:`, error.message);
                fundingResults.push({
                    tokenName,
                    symbol: tokenData.symbol,
                    amount: ethers.formatUnits(fundAmount, tokenData.decimals),
                    success: false,
                    error: error.message
                });
            }
        } else {
            console.log(`Không đủ ${tokenName} để chuyển vào faucet`);
            console.log(`Required: ${ethers.formatUnits(fundAmount, tokenData.decimals)} ${tokenData.symbol}`);
            console.log(`Available: ${ethers.formatUnits(deployerBalance, tokenData.decimals)} ${tokenData.symbol}`);
            
            fundingResults.push({
                tokenName,
                symbol: tokenData.symbol,
                amount: ethers.formatUnits(fundAmount, tokenData.decimals),
                success: false,
                error: "Insufficient balance"
            });
        }
    }
    
    faucetInfo.fundingResults = fundingResults;
    faucetInfo.fundedAt = new Date().toISOString();
    faucetInfo.fundAmounts = fundAmounts;
    
    fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2));
    console.log("\nFaucet info updated with funding results");
    
    // Hiển thị tổng kết
    console.log("\n=== Faucet Funding Complete ===");
    console.log("Summary:");
    
    const successfulFundings = fundingResults.filter(r => r.success);
    const failedFundings = fundingResults.filter(r => !r.success);
    
    console.log(`Successfully funded: ${successfulFundings.length} tokens`);
    successfulFundings.forEach(funding => {
        console.log(`- ${funding.tokenName}: ${funding.amount} ${funding.symbol}`);
    });
    
    if (failedFundings.length > 0) {
        console.log(`Failed to fund: ${failedFundings.length} tokens`);
        failedFundings.forEach(funding => {
            console.log(`- ${funding.tokenName}: ${funding.error}`);
        });
    }
    
    console.log(`\nUsers will receive: 0.5 tokens per request`);
    console.log(`Cooldown period: 24 hours`);
    
    console.log("\nNext steps:");
    console.log("1. Run 07d-test-faucet.ts to test functionality");
    console.log("2. Run 15-add-token-to-faucet.ts to add new tokens");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    }); 