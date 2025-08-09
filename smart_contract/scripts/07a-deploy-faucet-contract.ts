import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Deploying Faucet contract...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address :", deployer.address);
    console.log("Deployer balance :", ethers.utils.formatEther(await deployer.provider!.getBalance(deployer.address)),"ETH Sepolia");
    
    console.log("\nDeploying Faucet contract...");
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy();
    await faucet.deployed();
    
    console.log("Faucet deployed tại:", faucet.address);
    
    const faucetInfo = {
        faucetAddress: faucet.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider!.getBlockNumber(),
        deployer: deployer.address,
        cooldownPeriod: "24 hours",
        userFaucetAmount: "0.5 tokens per request"
    };
    
    const infoPath = path.join(__dirname, '../info');
    if (!fs.existsSync(infoPath)) {
        fs.mkdirSync(infoPath, { recursive: true });
    }
    
    const faucetInfoPath = path.join(infoPath, 'FaucetInfo.json');
    fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2));
    console.log("Faucet contract info saved to:", faucetInfoPath);
    
    console.log("\n=== Deployed Faucet Thành Công ===");
    console.log("1. Run 07b-add-tokens-to-faucet.ts to add tokens");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    }); 