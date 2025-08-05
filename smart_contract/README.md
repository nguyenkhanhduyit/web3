# SimpleDEX - Decentralized Exchange Ecosystem

A complete decentralized exchange (DEX) ecosystem built on Ethereum with advanced features including liquidity mining and price oracles.

## 🏗️ Architecture

```
SimpleDEX Ecosystem
├── Core DEX (SimpleDEX.sol)
├── ERC20 Tokens (Token.sol)
├── Price Oracle (PriceOracle.sol)
├── Liquidity Mining (LiquidityMining.sol)
└── Deployment Scripts
```

## 📋 Features

### Core DEX Features
- ✅ **Add Liquidity**: Provide liquidity to token pairs
- ✅ **Remove Liquidity**: Withdraw liquidity and receive tokens back
- ✅ **Swap**: Trade tokens with automatic price calculation
- ✅ **Fee System**: 0.3% trading fee
- ✅ **Liquidity Tokens**: LP tokens representing pool share

### Advanced Features
- 📊 **Price Oracle**: Real-time price feeds and calculations
- ⛏️ **Liquidity Mining**: Earn rewards for providing liquidity
- 🔐 **Token Approvals**: Secure token management
- 📈 **Price Calculation**: Automatic price discovery from reserves

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Hardhat
- MetaMask with Sepolia testnet

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
```

### Deployment Options

#### Option 1: Deploy Everything (Recommended)
```bash
npx hardhat run scripts/00-deploy-everything.ts --network sepolia
```

#### Option 2: Step-by-Step Deployment
```bash
# 1. Deploy tokens
npx hardhat run scripts/01-deploy-tokens.ts --network sepolia

# 2. Deploy SimpleDEX
npx hardhat run scripts/02-deploy-simple-dex.ts --network sepolia

# 3. Approve tokens
npx hardhat run scripts/03-approve-tokens.ts --network sepolia

# 4. Add initial liquidity
npx hardhat run scripts/04-add-initial-liquidity.ts --network sepolia

# 5. Test features
npx hardhat run scripts/05-test-dex-features.ts --network sepolia

# 6. Deploy advanced features
npx hardhat run scripts/06-deploy-advanced-features.ts --network sepolia
```

## 📁 Generated Files

After deployment, the following files will be created in the `info/` directory:

- `TokenAddress.json` - Token contract addresses
- `SimpleDEXAddress.json` - SimpleDEX contract address
- `TokenApprovals.json` - Token approval results
- `InitialLiquidity.json` - Initial liquidity information
- `TestResults.json` - DEX feature test results
- `DeploymentResults.json` - Complete deployment summary
- `AdvancedFeatures.json` - Advanced features deployment results

## 🧪 Testing

### Test All Features
```bash
npx hardhat run scripts/05-test-dex-features.ts --network sepolia
```

### Individual Tests
```bash
# Test swap functionality
npx hardhat run scripts/test-simple-dex-swap.ts --network sepolia

# Test remove liquidity
npx hardhat run scripts/test-simple-dex-remove-liquidity.ts --network sepolia
```

## 📊 Contract Addresses

### Sepolia Testnet
- **SimpleDEX**: `0x42001Ea8Ab6011D49eab16c8295e703b28907D09`
- **Bitcoin (BTC)**: `0x02f3451468d76B3A273a2503732d3A301079c8dD`
- **Ethereum (ETH)**: `0xf4aB31ccB64c21a66C1aF0B581AA172E3604a561`
- **Tether USD (USDT)**: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`

## 🔧 Smart Contracts

### SimpleDEX.sol
Core DEX contract with the following functions:
- `addLiquidity()` - Add liquidity to a pool
- `removeLiquidity()` - Remove liquidity from a pool
- `swap()` - Swap tokens
- `getReserves()` - Get pool reserves
- `getLiquidity()` - Get total liquidity
- `getBalance()` - Get user's liquidity balance

### PriceOracle.sol
Price feed contract with:
- `updatePrice()` - Update token pair price
- `getPrice()` - Get current price
- `calculatePriceFromReserves()` - Calculate price from DEX reserves

### LiquidityMining.sol
Reward distribution contract with:
- `stake()` - Stake liquidity tokens
- `withdraw()` - Withdraw staked tokens
- `claimRewards()` - Claim earned rewards
- `earned()` - Check earned rewards

## 💡 Usage Examples

### Adding Liquidity
```javascript
const amount0 = ethers.utils.parseUnits("100", 8); // 100 BTC
const amount1 = ethers.utils.parseUnits("100", 18); // 100 ETH

await simpleDex.addLiquidity(
  btcAddress,
  ethAddress,
  amount0,
  amount1
);
```

### Swapping Tokens
```javascript
const swapAmount = ethers.utils.parseUnits("10", 8); // 10 BTC

await simpleDex.swap(
  btcAddress,
  ethAddress,
  swapAmount
);
```

### Getting Price from Oracle
```javascript
const price = await priceOracle.getPrice(btcAddress, ethAddress);
console.log(`1 BTC = ${ethers.utils.formatEther(price)} ETH`);
```

## 🔒 Security Features

- **Token Approvals**: Secure token transfer mechanism
- **Input Validation**: Comprehensive parameter checking
- **Reentrancy Protection**: Safe external calls
- **Access Control**: Authorized updater management
- **Overflow Protection**: Safe math operations

## 🚨 Important Notes

1. **Testnet Only**: This deployment is for Sepolia testnet
2. **Gas Optimization**: Contracts are optimized for gas efficiency
3. **Price Accuracy**: Oracle prices should be updated regularly
4. **Liquidity Mining**: Rewards are distributed based on staking duration
5. **Fee Structure**: 0.3% trading fee is standard for DEX operations

## 🔄 Troubleshooting

### Common Issues

1. **"Insufficient allowance"**
   - Run token approval script: `03-approve-tokens.ts`

2. **"Pool not found"**
   - Ensure liquidity has been added to the pool first

3. **"Insufficient liquidity"**
   - Add more liquidity to the pool

4. **"Transaction failed"**
   - Check gas limit and ensure sufficient ETH for gas

### Debug Commands
```bash
# Check token balances
npx hardhat run scripts/check-token-balances.ts --network sepolia

# Verify pool state
npx hardhat run scripts/check-pool-state.ts --network sepolia
```

## 📈 Performance Metrics

- **Gas Usage**: ~50,000-100,000 gas per operation
- **Swap Speed**: ~15 seconds on Sepolia
- **Liquidity Addition**: ~80,000 gas
- **Price Updates**: ~30,000 gas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the GPL-3.0 License.

## 🆘 Support

For questions and support:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the test scripts for examples

---

**Happy Trading! 🚀** 