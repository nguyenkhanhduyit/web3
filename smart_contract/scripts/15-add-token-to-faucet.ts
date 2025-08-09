import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Script để deployer thêm token mới vào faucet và gửi token vào faucet
 */
async function main() {
    console.log("Adding new token to faucet and funding it...");
    
    // Đọc thông tin faucet đã deploy
    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json");
    if (!fs.existsSync(faucetInfoPath)) {
        throw new Error("FaucetInfo.json không tồn tại. Hãy chạy 07-deploy-faucet.ts trước!");
    }
    
    const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"));
    console.log("Faucet address:", faucetInfo.faucetAddress);
    
    // Lấy signers
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Tạo contract instance cho Faucet
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(faucetInfo.faucetAddress);
    
    // Tạo token mới (có thể thay đổi thông tin token)
    const tokenName = "New Token";
    const tokenSymbol = "NEW";
    const tokenDecimals = 18;
    
    console.log(`\nDeploying new token: ${tokenName} (${tokenSymbol})`);
    
    const Token = await ethers.getContractFactory("Token");
    const newToken = await Token.deploy(tokenName, tokenSymbol, tokenDecimals);
    await newToken.waitForDeployment();
    
    const newTokenAddress = await newToken.getAddress();
    console.log(`New token deployed at: ${newTokenAddress}`);
    
    // Mint token cho deployer
    const mintAmount = ethers.parseUnits("10000", tokenDecimals); // 10,000 tokens
    await newToken.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, tokenDecimals)} ${tokenSymbol} to deployer`);
    
    // Thêm token vào faucet
    console.log(`\nAdding ${tokenSymbol} to faucet...`);
    const addTokenTx = await faucet.addToken(newTokenAddress);
    await addTokenTx.wait();
    console.log(`✅ ${tokenSymbol} added to faucet`);
    
    // Deployer gửi token vào faucet (có thể thay đổi số lượng)
    const fundAmount = ethers.parseUnits("1000", tokenDecimals); // 1,000 tokens
    console.log(`\nFunding faucet with ${ethers.formatUnits(fundAmount, tokenDecimals)} ${tokenSymbol}...`);
    
    const transferTx = await newToken.transfer(faucetInfo.faucetAddress, fundAmount);
    await transferTx.wait();
    console.log(`✅ Faucet funded with ${ethers.formatUnits(fundAmount, tokenDecimals)} ${tokenSymbol}`);
    
    // Kiểm tra thông tin
    console.log(`\nVerifying faucet information...`);
    
    // Kiểm tra thông tin token trong faucet
    const [faucetAmount, symbol, name] = await faucet.getTokenInfo(newTokenAddress);
    console.log(`Token in faucet: ${ethers.formatUnits(faucetAmount, tokenDecimals)} ${symbol} (${name})`);
    
    // Kiểm tra balance của faucet
    const faucetBalance = await newToken.balanceOf(faucetInfo.faucetAddress);
    console.log(`Faucet balance: ${ethers.formatUnits(faucetBalance, tokenDecimals)} ${tokenSymbol}`);
    
    // Kiểm tra balance của deployer
    const deployerBalance = await newToken.balanceOf(deployer.address);
    console.log(`Deployer balance: ${ethers.formatUnits(deployerBalance, tokenDecimals)} ${tokenSymbol}`);
    
    // Lưu thông tin token mới
    const tokenInfo = {
        tokenAddress: newTokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        faucetAmount: "0.5 tokens per user request",
        faucetFunded: ethers.formatUnits(fundAmount, tokenDecimals)
    };
    
    const tokenInfoPath = path.join(__dirname, "../info/NewTokenInfo.json");
    fs.writeFileSync(tokenInfoPath, JSON.stringify(tokenInfo, null, 2));
    console.log(`\nToken information saved to: ${tokenInfoPath}`);
    
    console.log(`\n=== Token Addition Complete ===`);
    console.log(`Summary:`);
    console.log(`- New token: ${tokenName} (${tokenSymbol})`);
    console.log(`- Token address: ${newTokenAddress}`);
    console.log(`- Added to faucet: ✅`);
    console.log(`- Faucet funded: ${ethers.formatUnits(fundAmount, tokenDecimals)} ${tokenSymbol}`);
    console.log(`- Users will receive: 0.5 ${tokenSymbol} per request`);
    console.log(`- Cooldown period: 24 hours`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    }); 