# Smart Contract Project

## Overview
This project implements a decentralized exchange (DEX) with price oracle functionality, liquidity mining, and faucet features.

## Key Features

### 1. SimpleDEX
- Automated Market Maker (AMM) implementation
- Liquidity provision and removal
- Token swapping with price impact calculation
- Pool information and price queries

### 2. Price Oracle
- **Base Currency: USD** (updated from USDT)
- Real-time price feeds for all tokens
- Price data with timestamps and block numbers
- Price calculation from reserves
- Authorized updater system

### 3. Liquidity Mining
- Reward distribution for liquidity providers
- Configurable reward rates
- Staking and unstaking functionality

### 4. Faucet
- Token distribution for testing
- Rate limiting and access control

## Recent Updates

### Price Oracle Base Currency Change
- **Changed from USDT to USD**: The Price Oracle now uses USD as the base currency instead of USDT
- **USD Token Address**: Uses `ethers.constants.AddressZero` (0x0000...0000) as the USD token address
- **Price Structure**: All token prices are now quoted in USD
- **Updated Scripts**: All related scripts have been updated to use USD pricing

#### Key Changes Made:
1. **06a-deploy-price-oracle.ts**: Updated to use USD as base currency
2. **11-enhanced-swap-estimation.ts**: Updated to calculate values in USD
3. **check-price-oracle.ts**: Updated to display prices in USD
4. **Price Oracle Contract**: No changes needed to the contract itself

#### Price Examples:
- Bitcoin: $45,000 USD
- Ethereum: $2,800 USD  
- Tether USD: $1 USD

## Deployment Scripts

### 1. Token Deployment
```bash
npx hardhat run scripts/01-deploy-tokens.ts --network <network>
```

### 2. DEX Deployment
```bash
npx hardhat run scripts/02-deploy-simple-dex.ts --network <network>
```

### 3. Token Approvals
```bash
npx hardhat run scripts/03-approve-tokens.ts --network <network>
```

### 4. Initial Liquidity
```bash
npx hardhat run scripts/04-add-initial-liquidity.ts --network <network>
```

### 5. Price Oracle Deployment
```bash
npx hardhat run scripts/06a-deploy-price-oracle.ts --network <network>
```

### 6. Liquidity Mining Deployment
```bash
npx hardhat run scripts/06b-deploy-liquidity-mining.ts --network <network>
```

### 7. Faucet Deployment
```bash
npx hardhat run scripts/07-deploy-faucet.ts --network <network>
```

## Testing Scripts

### Price Oracle Testing
```bash
npx hardhat run scripts/check-price-oracle.ts --network <network>
```

### Swap Estimation Testing
```bash
npx hardhat run scripts/11-enhanced-swap-estimation.ts --network <network>
```

## Contract Addresses

All deployed contract addresses are stored in the `info/` directory:
- `TokenAddress.json`: Token contract addresses
- `SimpleDEXAddress.json`: DEX contract address
- `PriceOracleAddress.json`: Price Oracle contract address
- `LiquidityMiningAddress.json`: Liquidity Mining contract address
- `FaucetAddress.json`: Faucet contract address

## Price Oracle Usage

### Getting Token Prices
```javascript
// Get price of a token in USD
const price = await priceOracle.getPrice(tokenAddress, usdTokenAddress);
const priceInUSD = ethers.utils.formatUnits(price, 18);

// Get detailed price data
const priceData = await priceOracle.getPriceData(tokenAddress, usdTokenAddress);
console.log(`Price: $${ethers.utils.formatUnits(priceData.price, 18)} USD`);
console.log(`Timestamp: ${priceData.timestamp}`);
console.log(`Block Number: ${priceData.blockNumber}`);
```

### Updating Prices
```javascript
// Only authorized updaters can update prices
const priceInWei = ethers.utils.parseUnits("45000", 18); // $45,000 USD
await priceOracle.updatePrice(tokenAddress, usdTokenAddress, priceInWei);
```

## Network Configuration

The project supports multiple networks through Hardhat configuration. Update `hardhat.config.cjs` to add your preferred networks.

## License

This project is licensed under the GPL-3.0 License. 