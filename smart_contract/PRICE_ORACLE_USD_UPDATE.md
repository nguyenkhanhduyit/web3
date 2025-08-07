# Price Oracle USD Update

## Overview
This document outlines the changes made to update the Price Oracle system from using USDT as the base currency to using USD as the base currency.

## Changes Made

### 1. Updated Deployment Script (`06a-deploy-price-oracle.ts`)

**Key Changes:**
- Changed base currency from USDT to USD
- Added USD token address using `ethers.constants.AddressZero`
- Updated price structure to use USD pricing
- Added predefined USD prices for common tokens
- Updated all logging and output messages to reflect USD

**Price Structure:**
```javascript
const usdPrices: { [key: string]: number } = {
  "Bitcoin": 45000,      // 1 BTC = $45,000 USD
  "Ethereum": 2800,      // 1 ETH = $2,800 USD
  "Tether USD": 1        // 1 USDT = $1 USD
};
```

### 2. Updated Enhanced Swap Estimation (`11-enhanced-swap-estimation.ts`)

**Key Changes:**
- Changed all price calculations to use USD instead of USDT
- Updated variable names from `usdtAddress` to `usdTokenAddress`
- Updated all output messages to show USD values
- Added base currency information to results

**Example Changes:**
```javascript
// Before
const btcPriceInUSDT = await priceOracle.getPrice(btcAddress, usdtAddress);
console.log(`Input Value: $${ethers.utils.formatUnits(inputValueInUSDT, 18)} USDT`);

// After
const btcPriceInUSD = await priceOracle.getPrice(btcAddress, usdTokenAddress);
console.log(`Input Value: $${ethers.utils.formatUnits(inputValueInUSD, 18)} USD`);
```

### 3. Updated Price Oracle Check Script (`check-price-oracle.ts`)

**Key Changes:**
- Updated to use USD token address
- Changed all price displays to show USD values
- Removed USDT-specific logic
- Added base currency information

### 4. Updated Documentation

**README.md Changes:**
- Added section about Price Oracle base currency change
- Updated usage examples to show USD pricing
- Added information about USD token address
- Updated deployment and testing instructions

## Technical Details

### USD Token Address
- **Address**: `0x0000000000000000000000000000000000000000` (AddressZero)
- **Purpose**: Represents USD as the base currency
- **Decimals**: 18 (standard for price calculations)

### Price Structure
All token prices are now quoted in USD with 18 decimals:
- Bitcoin: $45,000 USD = `45000000000000000000000` (wei)
- Ethereum: $2,800 USD = `2800000000000000000000` (wei)
- Tether USD: $1 USD = `1000000000000000000` (wei)

### Backward Compatibility
- The Price Oracle contract itself remains unchanged
- Only the deployment and usage scripts have been updated
- Existing price data will need to be re-deployed with USD pricing

## Migration Steps

### For New Deployments
1. Run the updated deployment script:
   ```bash
   npx hardhat run scripts/06a-deploy-price-oracle.ts --network <network>
   ```

2. Verify the deployment:
   ```bash
   npx hardhat run scripts/check-price-oracle.ts --network <network>
   ```

3. Test the enhanced swap estimation:
   ```bash
   npx hardhat run scripts/11-enhanced-swap-estimation.ts --network <network>
   ```

### For Existing Deployments
If you have an existing Price Oracle deployment using USDT:

1. **Option 1: Re-deploy** (Recommended)
   - Deploy a new Price Oracle with USD pricing
   - Update your application to use the new address

2. **Option 2: Update existing prices**
   - Use the existing Price Oracle contract
   - Update prices to use USD values instead of USDT
   - Note: This requires manual price updates for all tokens

## Benefits of USD Base Currency

1. **Standardization**: USD is the global standard for pricing
2. **Clarity**: Easier to understand and compare prices
3. **Compatibility**: Better integration with external price feeds
4. **User Experience**: More intuitive for users familiar with USD pricing

## Testing

### Price Oracle Testing
```bash
# Check current prices
npx hardhat run scripts/check-price-oracle.ts --network <network>

# Expected output:
# Bitcoin (BTC):
#   - Price: $45000.0 USD
# Ethereum (ETH):
#   - Price: $2800.0 USD
# Tether USD (USDT):
#   - Price: $1.0 USD
```

### Swap Estimation Testing
```bash
# Test enhanced swap estimation
npx hardhat run scripts/11-enhanced-swap-estimation.ts --network <network>

# Expected output will show all values in USD
```

## Files Modified

1. `scripts/06a-deploy-price-oracle.ts` - Updated deployment script
2. `scripts/11-enhanced-swap-estimation.ts` - Updated swap estimation
3. `scripts/check-price-oracle.ts` - Updated price checking
4. `README.md` - Updated documentation
5. `PRICE_ORACLE_USD_UPDATE.md` - This file (new)

## Future Considerations

1. **Real USD Integration**: Consider integrating with real USD price feeds (e.g., Chainlink)
2. **Multiple Base Currencies**: Support for multiple base currencies if needed
3. **Price Feed Automation**: Automated price updates from external sources
4. **Historical Price Data**: Storage and retrieval of historical price data

## Support

For questions or issues related to this update:
1. Check the updated documentation
2. Review the code changes in the modified files
3. Test the functionality using the provided scripts
4. Create an issue if problems persist 