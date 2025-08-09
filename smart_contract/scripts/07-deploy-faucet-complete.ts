import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script deploy hoàn chỉnh Faucet contract - chạy tất cả các bước
 */
async function main() {
    console.log("=== Complete Faucet Deployment ===");
    
    // Lấy deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Bước 1: Deploy Faucet contract
    console.log("\n=== Step 1: Deploying Faucet Contract ===");
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy();
    await faucet.waitForDeployment();
    
    const faucetAddress = await faucet.getAddress();
    console.log("✅ Faucet deployed tại:", faucetAddress);
    
    // Bước 2: Đọc thông tin token
    console.log("\n=== Step 2: Reading Token Information ===");
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    if (!fs.existsSync(tokenInfoPath)) {
        throw new Error("TokenAddress.json không tồn tại. Hãy chạy 01-deploy-tokens.ts trước!");
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    console.log("Thông tin token đã deploy:", Object.keys(tokenInfo));
    
    // Bước 3: Thêm token vào faucet
    console.log("\n=== Step 3: Adding Tokens to Faucet ===");
    const addedTokens = [];
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        
        console.log(`Thêm ${tokenName} vào faucet...`);
        
        try {
            const addTokenTx = await faucet.addToken(tokenAddress);
            await addTokenTx.wait();
            console.log(`✅ ${tokenName} đã được thêm vào faucet`);
            
            addedTokens.push({
                name: tokenName,
                address: tokenAddress,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals
            });
            
        } catch (error) {
            console.log(`❌ Error adding ${tokenName}:`, error.message);
        }
    }
    
    // Bước 4: Gửi token vào faucet
    console.log("\n=== Step 4: Funding Faucet with Tokens ===");
    
    const fundAmounts = {
        "Bitcoin": ethers.parseUnits("1000", 8),
        "Ethereum": ethers.parseUnits("100000", 18),
        "Tether USD": ethers.parseUnits("1000000", 6)
    };
    
    const fundingResults = [];
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        const fundAmount = fundAmounts[tokenName as keyof typeof fundAmounts];
        
        if (!fundAmount) continue;
        
        console.log(`\nFunding ${tokenName}...`);
        
        const tokenContract = new ethers.Contract(tokenAddress, [
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        
        const deployerBalance = await tokenContract.balanceOf(deployer.address);
        console.log(`Deployer ${tokenName} balance: ${ethers.formatUnits(deployerBalance, tokenData.decimals)} ${tokenData.symbol}`);
        
        if (deployerBalance >= fundAmount) {
            try {
                const transferTx = await tokenContract.transfer(faucetAddress, fundAmount);
                await transferTx.wait();
                console.log(`✅ Đã chuyển ${ethers.formatUnits(fundAmount, tokenData.decimals)} ${tokenData.symbol} vào faucet`);
                
                fundingResults.push({
                    tokenName,
                    symbol: tokenData.symbol,
                    amount: ethers.formatUnits(fundAmount, tokenData.decimals),
                    success: true
                });
                
            } catch (error) {
                console.log(`❌ Error transferring ${tokenName}:`, error.message);
                fundingResults.push({
                    tokenName,
                    symbol: tokenData.symbol,
                    amount: ethers.formatUnits(fundAmount, tokenData.decimals),
                    success: false,
                    error: error.message
                });
            }
        } else {
            console.log(`❌ Không đủ ${tokenName} để chuyển vào faucet`);
            fundingResults.push({
                tokenName,
                symbol: tokenData.symbol,
                amount: ethers.formatUnits(fundAmount, tokenData.decimals),
                success: false,
                error: "Insufficient balance"
            });
        }
    }
    
    // Bước 5: Test faucet functionality
    console.log("\n=== Step 5: Testing Faucet Functionality ===");
    
    const testAccounts = await ethers.getSigners();
    const testUser = testAccounts[1];
    
    console.log(`Test user address: ${testUser.address}`);
    
    try {
        console.log("Test user đang nhận tất cả token từ faucet...");
        const requestAllTx = await faucet.connect(testUser).requestAllFaucets();
        await requestAllTx.wait();
        console.log("✅ Test user đã nhận thành công tất cả token từ faucet");
        
        for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
            const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
                "function balanceOf(address account) external view returns (uint256)"
            ], testUser);
            
            const userBalance = await tokenContract.balanceOf(testUser.address);
            console.log(`Test user ${tokenName} balance: ${ethers.formatUnits(userBalance, tokenData.decimals)} ${tokenData.symbol}`);
        }
        
    } catch (error) {
        console.log("❌ Test faucet failed:", error.message);
    }
    
    // Lưu thông tin faucet hoàn chỉnh
    console.log("\n=== Step 6: Saving Complete Faucet Information ===");
    
    const faucetInfo = {
        faucetAddress: faucetAddress,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider!.getBlockNumber(),
        deployer: deployer.address,
        supportedTokens: addedTokens.map(token => token.name),
        addedTokens: addedTokens,
        fundingResults: fundingResults,
        fundAmounts: fundAmounts,
        userFaucetAmount: "0.5 tokens per request",
        cooldownPeriod: "24 hours",
        testUser: testUser.address
    };
    
    const infoPath = path.join(__dirname, '../info');
    if (!fs.existsSync(infoPath)) {
        fs.mkdirSync(infoPath, { recursive: true });
    }
    
    const faucetInfoPath = path.join(infoPath, 'FaucetInfo.json');
    fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2));
    console.log("✅ Complete faucet information saved to:", faucetInfoPath);
    
    // Tổng kết
    console.log("\n=== Complete Faucet Deployment Summary ===");
    console.log(`✅ Faucet address: ${faucetAddress}`);
    console.log(`✅ Supported tokens: ${addedTokens.length}`);
    console.log(`✅ Tokens: ${addedTokens.map(t => t.name).join(", ")}`);
    console.log(`✅ User faucet amount: 0.5 tokens per request`);
    console.log(`✅ Cooldown period: 24 hours`);
    
    const successfulFundings = fundingResults.filter(r => r.success);
    console.log(`✅ Successfully funded: ${successfulFundings.length} tokens`);
    
    console.log("\n🎉 Faucet deployment completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Run 15-add-token-to-faucet.ts to add new tokens");
    console.log("2. Use the faucet from frontend application");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Complete deployment failed:", error);
        process.exit(1);
    }); 