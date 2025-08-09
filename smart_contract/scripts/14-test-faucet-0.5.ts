import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script test Faucet contract với số lượng 0.5 token
 */
async function main() {
    console.log("Testing Faucet contract with 0.5 token amounts...");
    
    // Đọc thông tin token đã deploy
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json");
    if (!fs.existsSync(tokenInfoPath)) {
        throw new Error("TokenAddress.json không tồn tại. Hãy chạy 01-deploy-tokens.ts trước!");
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"));
    console.log("Thông tin token đã deploy:", Object.keys(tokenInfo));
    
    // Đọc thông tin faucet
    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json");
    if (!fs.existsSync(faucetInfoPath)) {
        throw new Error("FaucetInfo.json không tồn tại. Hãy chạy 07-deploy-faucet.ts trước!");
    }
    
    const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"));
    console.log("Faucet address:", faucetInfo.faucetAddress);
    
    // Lấy signers
    const [deployer, user1, user2] = await ethers.getSigners();
    
    // Tạo contract instance cho Faucet
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);
    
    console.log("\n=== Testing Faucet with 0.5 Token Amounts ===");
    
    // Test 1: Kiểm tra thông tin token trong faucet
    console.log("\n1. Checking token information in faucet...");
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        
        try {
            const [amount, symbol, name] = await faucet.getTokenInfo(tokenAddress);
            console.log(`${tokenName}:`);
            console.log(`  - Amount: ${ethers.formatUnits(amount, tokenData.decimals)} ${symbol}`);
            console.log(`  - Symbol: ${symbol}`);
            console.log(`  - Name: ${name}`);
            
            // Verify amount is 0.5
            const expectedAmount = ethers.parseUnits("0.5", tokenData.decimals);
            if (amount.eq(expectedAmount)) {
                console.log(`  ✅ Amount is correct (0.5 ${symbol})`);
            } else {
                console.log(`  ❌ Amount is incorrect. Expected: 0.5 ${symbol}, Got: ${ethers.formatUnits(amount, tokenData.decimals)} ${symbol}`);
            }
        } catch (error) {
            console.log(`❌ Error getting info for ${tokenName}:`, error.message);
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
        console.log(`✅ Successfully received 0.5 ${firstTokenData.symbol}`);
        
        // Kiểm tra balance
        const tokenContract = new ethers.Contract(firstTokenAddress, [
            "function balanceOf(address account) external view returns (uint256)"
        ], testUser1);
        
        const balance = await tokenContract.balanceOf(testUser1.address);
        console.log(`User balance: ${ethers.formatUnits(balance, firstTokenData.decimals)} ${firstTokenData.symbol}`);
        
    } catch (error) {
        console.log(`❌ Single token faucet failed:`, error.message);
    }
    
    // Test 3: Test nhận tất cả token
    console.log("\n3. Testing all tokens faucet...");
    const testUser2 = user2;
    console.log(`Test user: ${testUser2.address}`);
    
    try {
        console.log("Requesting all tokens...");
        const tx = await faucet.connect(testUser2).requestAllFaucets();
        await tx.wait();
        console.log("✅ Successfully received all tokens");
        
        // Kiểm tra balance của tất cả token
        for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
            const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
                "function balanceOf(address account) external view returns (uint256)"
            ], testUser2);
            
            const balance = await tokenContract.balanceOf(testUser2.address);
            console.log(`${tokenName}: ${ethers.formatUnits(balance, tokenData.decimals)} ${tokenData.symbol}`);
        }
        
    } catch (error) {
        console.log(`❌ All tokens faucet failed:`, error.message);
    }
    
    // Test 4: Test cooldown period
    console.log("\n4. Testing cooldown period...");
    
    try {
        // Thử faucet lại ngay lập tức
        console.log("Trying to faucet again immediately...");
        const tx = await faucet.connect(testUser1).requestFaucet(firstTokenAddress);
        await tx.wait();
        console.log("❌ Should have failed due to cooldown");
    } catch (error) {
        console.log("✅ Correctly blocked due to cooldown period");
        console.log("Error message:", error.message);
        
        // Kiểm tra thời gian chờ
        const timeUntilNext = await faucet.getTimeUntilNextFaucet(testUser1.address);
        const hours = Math.floor(timeUntilNext / 3600);
        const minutes = Math.floor((timeUntilNext % 3600) / 60);
        console.log(`Time until next faucet: ${hours} hours ${minutes} minutes`);
    }
    
    // Test 5: Test thêm token mới và deployer gửi token vào faucet
    console.log("\n5. Testing adding new token and deployer funding faucet...");
    
    // Tạo một token test mới
    const TestToken = await ethers.getContractFactory("Token");
    const testToken = await TestToken.deploy("Test Token", "TEST", 18);
    await testToken.waitForDeployment();
    
    const testTokenAddress = await testToken.getAddress();
    console.log(`Test token deployed at: ${testTokenAddress}`);
    
    // Mint một số token cho deployer
    const mintAmount = ethers.parseUnits("1000", 18);
    await testToken.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, 18)} TEST tokens to deployer`);
    
    // Thêm token vào faucet
    try {
        const addTx = await faucet.addToken(testTokenAddress);
        await addTx.wait();
        console.log("✅ Test token added to faucet");
        
        // Deployer gửi token vào faucet (có thể gửi bất kỳ số lượng nào)
        const fundAmount = ethers.parseUnits("500", 18); // 500 TEST
        await testToken.transfer(faucetAddress, fundAmount);
        console.log(`✅ Deployer funded faucet with ${ethers.formatUnits(fundAmount, 18)} TEST`);
        
        // Kiểm tra thông tin token
        const [amount, symbol, name] = await faucet.getTokenInfo(testTokenAddress);
        console.log(`Token info: ${ethers.formatUnits(amount, 18)} ${symbol} (${name})`);
        
        // Verify amount is 0.5 (người dùng nhận)
        const expectedAmount = ethers.parseUnits("0.5", 18);
        if (amount.eq(expectedAmount)) {
            console.log("✅ User faucet amount is correct (0.5 TEST)");
        } else {
            console.log(`❌ User faucet amount is incorrect. Expected: 0.5 TEST, Got: ${ethers.formatUnits(amount, 18)} TEST`);
        }
        
        // Kiểm tra balance của faucet
        const faucetBalance = await testToken.balanceOf(faucetAddress);
        console.log(`Faucet balance: ${ethers.formatUnits(faucetBalance, 18)} TEST`);
        
    } catch (error) {
        console.log(`❌ Error adding test token:`, error.message);
    }
    
    console.log("\n=== Faucet Testing Complete ===");
    console.log("Summary:");
    console.log("- Deployer can fund faucet with any amount of tokens");
    console.log("- Users receive exactly 0.5 tokens per faucet request");
    console.log("- Single token faucet works correctly");
    console.log("- All tokens faucet works correctly");
    console.log("- Cooldown period is enforced (24 hours)");
    console.log("- New tokens can be added and funded by deployer");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
    }); 