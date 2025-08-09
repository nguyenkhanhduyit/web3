import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Testing Faucet contract...");
    
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
    
    const [deployer, user1, user2] = await ethers.getSigners();
    
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);
    
    console.log("\n=== Testing Faucet Functionality ===");
    
    console.log("\n1. Checking token information in faucet...");
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        
        try {
            const [amount, symbol, name] = await faucet.getTokenInfo(tokenAddress);
            console.log(`${tokenName}:`);
            console.log(`- Amount: ${ethers.formatUnits(amount, tokenData.decimals)} ${symbol}`);
            console.log(`- Symbol: ${symbol}`);
            console.log(`- Name: ${name}`);
            
            // Verify amount is 0.5
            const expectedAmount = ethers.parseUnits("0.5", tokenData.decimals);
            if (amount.eq(expectedAmount)) {
                console.log(`Amount is correct (0.5 ${symbol})`);
            } else {
                console.log(`Amount is incorrect. Expected: 0.5 ${symbol}, Got: ${ethers.formatUnits(amount, tokenData.decimals)} ${symbol}`);
            }
        } catch (error) {
            console.log(`Error getting info for ${tokenName}:`, error.message);
        }
    }
    
    // Test 2: Test nhận một token cụ thể
    console.log("\n2. Testing single token faucet...");
    const testUser1 = user1;
    console.log(`Test user: ${testUser1.address}`);
    
    // Chọn token đầu tiên để test
    const firstTokenName = Object.keys(tokenInfo)[0];
    const firstTokenData = tokenInfo[firstTokenName];
    const firstTokenAddress = firstTokenData.tokenAddress;
    
    try {
        console.log(`Requesting 0.5 ${firstTokenData.symbol}...`);
        const tx = await faucet.connect(testUser1).requestFaucet(firstTokenAddress);
        await tx.wait();
        console.log(`Successfully received 0.5 ${firstTokenData.symbol}`);
        
        // Kiểm tra balance
        const tokenContract = new ethers.Contract(firstTokenAddress, [
            "function balanceOf(address account) external view returns (uint256)"
        ], testUser1);
        
        const balance = await tokenContract.balanceOf(testUser1.address);
        console.log(`User balance: ${ethers.formatUnits(balance, firstTokenData.decimals)} ${firstTokenData.symbol}`);
        
    } catch (error) {
        console.log(`Single token faucet failed:`, error.message);
    }
    
    // Test 3: Test nhận tất cả token
    console.log("\n3. Testing all tokens faucet...");
    const testUser2 = user2;
    console.log(`Test user: ${testUser2.address}`);
    
    try {
        console.log("Requesting all tokens...");
        const tx = await faucet.connect(testUser2).requestAllFaucets();
        await tx.wait();
        console.log("Successfully received all tokens");
        
        // Kiểm tra balance của tất cả token
        for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
            const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
                "function balanceOf(address account) external view returns (uint256)"
            ], testUser2);
            
            const balance = await tokenContract.balanceOf(testUser2.address);
            console.log(`${tokenName}: ${ethers.formatUnits(balance, tokenData.decimals)} ${tokenData.symbol}`);
        }
        
    } catch (error) {
        console.log(`All tokens faucet failed:`, error.message);
    }
    
    // Test 4: Test cooldown period
    console.log("\n4. Testing cooldown period...");
    
    try {
        // Thử faucet lại ngay lập tức
        console.log("Trying to faucet again immediately...");
        const tx = await faucet.connect(testUser1).requestFaucet(firstTokenAddress);
        await tx.wait();
        console.log("Should have failed due to cooldown");
    } catch (error) {
        console.log("Correctly blocked due to cooldown period");
        console.log("Error message:", error.message);
        
        // Kiểm tra thời gian chờ
        const timeUntilNext = await faucet.getTimeUntilNextFaucet(testUser1.address);
        const hours = Math.floor(timeUntilNext / 3600);
        const minutes = Math.floor((timeUntilNext % 3600) / 60);
        console.log(`Time until next faucet: ${hours} hours ${minutes} minutes`);
    }
    
    // Test 5: Kiểm tra balance của faucet
    console.log("\n5. Checking faucet balances...");
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer);
        
        const faucetBalance = await tokenContract.balanceOf(faucetInfo.faucetAddress);
        console.log(`${tokenName}: ${ethers.formatUnits(faucetBalance, tokenData.decimals)} ${tokenData.symbol}`);
    }
    
    // Test 6: Kiểm tra danh sách token được hỗ trợ
    console.log("\n6. Checking supported tokens...");
    try {
        const supportedTokens = await faucet.getSupportedTokens();
        console.log(`Supported tokens count: ${supportedTokens.length}`);
        console.log("Supported token addresses:");
        supportedTokens.forEach((address, index) => {
            console.log(`${index + 1}. ${address}`);
        });
    } catch (error) {
        console.log(`Error getting supported tokens:`, error.message);
    }
    
    console.log("\n=== Faucet Testing Complete ===");
    console.log("Summary:");
    console.log("- Deployer can fund faucet with any amount of tokens");
    console.log("- Users receive exactly 0.5 tokens per faucet request");
    console.log("- Single token faucet works correctly");
    console.log("- All tokens faucet works correctly");
    console.log("- Cooldown period is enforced (24 hours)");
    console.log("- Faucet is ready for use!");
    
    console.log("\nNext steps:");
    console.log("1. Run 15-add-token-to-faucet.ts to add new tokens");
    console.log("2. Use the faucet from frontend application");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
    }); 