import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"

async function main() {

    console.log("\nBắt đầu deploy Faucet contract...\n")
    
    console.log('='.repeat(50))
    const [deployer] = await ethers.getSigners()
    console.log("Deployer address:", deployer.address)
    console.log("Deployer balance:", ethers.utils.formatEther(await deployer.provider!.getBalance(deployer.address)))
    console.log('='.repeat(50))
    console.log('\n')
    const tokenInfoPath = path.join(__dirname, "../info/TokenAddress.json")
    if (!fs.existsSync(tokenInfoPath)) {
        throw new Error("\nTokenAddress.json không tồn tại. Hãy chạy 01-deploy-tokens.ts trước!\n")
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(tokenInfoPath, "utf8"))
    console.log('='.repeat(50))
    console.log("Thông tin token đã deploy:", Object.keys(tokenInfo))
    console.log('='.repeat(50))

    const faucetInfoPath = path.join(__dirname, "../info/FaucetInfo.json")

    let faucet
    if (!fs.existsSync(faucetInfoPath)) {

        console.log('\n')
        console.log('='.repeat(50))
        console.log("\nFaucetInfo.json chưa tồn tại -> Deploy faucet mới...")
        const Faucet = await ethers.getContractFactory("Faucet")
        faucet = await Faucet.deploy()
        await faucet.deployed()
        console.log("Faucet deployed tại:", faucet.address)
        console.log('='.repeat(50))
        console.log('\n')

        const faucetInfo = {
            faucetAddress: faucet.address,
            deployedAt: new Date().toISOString(),
            blockNumber: await ethers.provider.getBlockNumber(),
            deployer: deployer.address,
            supportedTokens: [],
            userFaucetAmount: "0.5 token/request",
            cooldownPeriod: "24 hours"
        }

        fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2))

    } else {
        console.log('\n')
        console.log('='.repeat(50))
        console.log("\nFaucetInfo.json đã tồn tại -> Attach contract...")
        const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"))
        const Faucet = await ethers.getContractFactory("Faucet")
        faucet = Faucet.attach(faucetInfo.faucetAddress)
        console.log("Đã attach tới faucet tại:", faucetInfo.faucetAddress)
        console.log('='.repeat(50))
        console.log('\n')
    }
    
    console.log("Thiết lập số lượng faucet cho các token...")
    
    const addedTokens: any[] = []
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress
        const supportedTokens = await faucet.getSupportedTokens()

        if (supportedTokens.includes(tokenAddress)) {
            console.log('\n')
            console.log(`${tokenName} đã tồn tại trong faucet -> bỏ qua`)
            continue
        }

        console.log('\n')
        console.log('='.repeat(50))
        console.log(`Thêm ${tokenName} vào faucet...`)
        console.log(`- Với Token address : ${tokenAddress}`)
        console.log(`- Để user sẽ nhận được : 0.5 ${tokenData.symbol} / request`)

        const addTokenTx = await faucet.addToken(tokenAddress)
        await addTokenTx.wait()

        addedTokens.push({
            name: tokenName,
            address: tokenAddress,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals
        })

        console.log(`${tokenName} đã được thêm vào faucet`)
        console.log('='.repeat(50))
        console.log('\n')
    }

    console.log("\nChuyển token vào faucet contract...")
    
    const deployAmounts = {
        "Bitcoin": ethers.utils.parseUnits("10", 8),   
        "Ethereum": ethers.utils.parseUnits("10", 18), 
        "Tether USD": ethers.utils.parseUnits("10", 6)
    }
    
    for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
        const tokenAddress = tokenData.tokenAddress
        const deployAmount = deployAmounts[tokenName as keyof typeof deployAmounts]
        
        // Tạo contract instance cho token
        const tokenContract = new ethers.Contract(tokenAddress, [
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)"
        ], deployer)
        
        // Kiểm tra balance của deployer
        console.log('\n')
        console.log('='.repeat(50))
        const deployerBalance = await tokenContract.balanceOf(deployer.address)
        console.log(`Deployer ${tokenName} balance: ${ethers.utils.formatUnits(deployerBalance, tokenData.decimals)} ${tokenData.symbol}`)
        
        if (deployerBalance >= deployAmount) {
            // Chuyển token vào faucet
            const transferTx = await tokenContract.transfer(faucet.address, deployAmount)
            await transferTx.wait()
            console.log(`Đã chuyển ${ethers.utils.formatUnits(deployAmount, tokenData.decimals)} ${tokenData.symbol} vào faucet`)
            console.log(`Người dùng sẽ nhận 0.5 ${tokenData.symbol} mỗi lần faucet`)
        } else {
            console.log(`Không đủ ${tokenName} để chuyển vào faucet`)
        }
        console.log('='.repeat(50))
        console.log('\n')
    }
    
    const faucetInfo = JSON.parse(fs.readFileSync(faucetInfoPath, "utf8"))
    faucetInfo.supportedTokens = addedTokens.map(t => t.name)
    faucetInfo.addedTokens = addedTokens
    faucetInfo.tokensAddedAt = new Date().toISOString()
    fs.writeFileSync(faucetInfoPath, JSON.stringify(faucetInfo, null, 2))

    console.log("\nĐã Hoàn tất!")
    
    // // Test faucet functionality
    // console.log("\nTesting faucet functionality...")
    
    // // Tạo một test account khác
    // const testAccounts = await ethers.getSigners()
    // const testUser = testAccounts[1] // Sử dụng account thứ 2 để test
    
    // console.log(`Test user address: ${testUser.address}`)
    
    // // Test nhận tất cả token từ faucet
    // try {
    //     console.log("Test user đang nhận tất cả token từ faucet...")
    //     const requestAllTx = await faucet.connect(testUser).requestAllFaucets()
    //     await requestAllTx.wait()
    //     console.log("Test user đã nhận thành công tất cả token từ faucet")
        
    //     // Kiểm tra balance của test user
    //     for (const [tokenName, tokenData] of Object.entries(tokenInfo)) {
    //         const tokenContract = new ethers.Contract(tokenData.tokenAddress, [
    //             "function balanceOf(address account) external view returns (uint256)"
    //         ], testUser)
            
    //         const userBalance = await tokenContract.balanceOf(testUser.address)
    //         console.log(`Test user ${tokenName} 
    //             balance: ${ethers.formatUnits(userBalance, tokenData.decimals)} ${tokenData.symbol}`)
    //     }
        
    // } catch (error) {
    //     console.log("Test faucet failed:", error)
    // }
    
    // // Test thời gian chờ
    // console.log("\nTesting cooldown period...")
    // try {
    //     const timeUntilNext = await faucet.getTimeUntilNextFaucet(testUser.address)
    //     console.log(`Thời gian chờ còn lại: ${timeUntilNext} giây`)
        
    //     if (timeUntilNext > 0) {
    //         const hours = Math.floor(timeUntilNext / 3600)
    //         const minutes = Math.floor((timeUntilNext % 3600) / 60)
    //         console.log(`Có thể faucet lại sau: ${hours} giờ ${minutes} phút`)
    //     }
    // } catch (error) {
    //     console.log("Test cooldown failed:", error)
    // }
    
    // console.log("\nFaucet deployment hoàn thành!")
    // console.log("Tóm tắt:")
    // console.log(`- Faucet address: ${faucetAddress}`)
    // console.log(`- Supported tokens: ${Object.keys(tokenInfo).join(", ")}`)
    // console.log(`- Cooldown period: 24 hours`)
    // console.log(`- Deployer: ${deployer.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error)
        process.exit(1)
    }) 