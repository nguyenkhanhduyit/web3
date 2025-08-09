import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Simple Faucet Test...");
    
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
    console.log(`Deployer address: ${deployer.address}`);
    
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);
    
    console.log("\n=== Faucet Status Check ===");
    
    // Check faucet balances
    console.log("\n1. Checking faucet balances...");
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        
        try {
            const tokenContract = new ethers.Contract(tokenAddress, [
                "function balanceOf(address account) external view returns (uint256)"
            ], deployer);
            
            const faucetBalance = await tokenContract.balanceOf(faucetInfo.faucetAddress);
            console.log(`${tokenName}: ${ethers.utils.formatUnits(faucetBalance, tokenData.decimals)} ${tokenData.symbol}`);
            
        } catch (error) {
            console.log(`Error checking ${tokenName} balance:`, error.message);
        }
    }
    
    // Check faucet configuration
    console.log("\n2. Checking faucet configuration...");
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress;
        
        try {
            const [amount, symbol, name] = await faucet.getTokenInfo(tokenAddress);
            console.log(`${tokenName}:`);
            console.log(`- Amount per request: ${ethers.utils.formatUnits(amount, tokenData.decimals)} ${symbol}`);
            console.log(`- Symbol: ${symbol}`);
            console.log(`- Name: ${name}`);
            
        } catch (error) {
            console.log(`Error getting info for ${tokenName}:`, error.message);
        }
    }
    
    // Check supported tokens
    console.log("\n3. Checking supported tokens...");
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
    
    console.log("\n=== Faucet Test Complete ===");
    console.log("The faucet is now ready for users to request tokens!");
    console.log("Users can request 0.5 tokens of each type every 24 hours.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    }); 