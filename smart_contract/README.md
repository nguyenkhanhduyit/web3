# SimpleDEX Ecosystem

Một hệ thống Decentralized Exchange (DEX) hoàn chỉnh với các tính năng tiên tiến, bao gồm AMM, Price Oracle, Liquidity Mining và Faucet System.

## 🚀 Tính năng chính

### Core Features
- **Token Creation**: Tạo và quản lý ERC20 tokens (BTC, ETH, USDT)
- **SimpleDEX**: Automated Market Maker (AMM) với công thức Constant Product
- **Liquidity Management**: Thêm/rút thanh khoản với LP tokens
- **Token Swapping**: Swap tokens với 2 chế độ (Exact Input/Output)
- **Swap Estimation**: Ước lượng số lượng token sẽ nhận được khi swap
- **Price Oracle**: Hệ thống cung cấp giá token real-time
- **Liquidity Mining**: Khuyến khích cung cấp thanh khoản với rewards
- **Faucet System**: Phân phối token miễn phí với cooldown 24h

### Advanced Features
- **Modular Architecture**: Scripts tách biệt cho từng chức năng
- **Data Persistence**: Lưu trữ thông tin deployment trong JSON files
- **Comprehensive Testing**: Test đầy đủ các tính năng
- **Error Handling**: Xử lý lỗi chi tiết và logging
- **Documentation**: Comments chi tiết cho tất cả functions

## 📁 Cấu trúc dự án

```
smart_contract/
├── contracts/
│   ├── Token.sol              # ERC20 token contract
│   ├── SimpleDEX.sol          # Core DEX contract với AMM
│   ├── PriceOracle.sol        # Price oracle system
│   ├── LiquidityMining.sol    # Liquidity mining rewards
│   └── Faucet.sol             # Token faucet system
├── scripts/
│   ├── 00-deploy-everything.ts    # Master script - deploy tất cả
│   ├── 01-deploy-tokens.ts        # Deploy tokens (BTC, ETH, USDT)
│   ├── 02-deploy-simple-dex.ts    # Deploy SimpleDEX contract
│   ├── 03-approve-tokens.ts       # Approve tokens cho DEX
│   ├── 04-add-initial-liquidity.ts # Thêm thanh khoản ban đầu
│   ├── 05-test-dex-features.ts    # Test các tính năng DEX
│   ├── 06a-deploy-price-oracle.ts # Deploy Price Oracle
│   ├── 06b-deploy-liquidity-mining.ts # Deploy Liquidity Mining
│   ├── 06c-test-advanced-features.ts # Test tích hợp tính năng nâng cao
│   ├── 07-deploy-faucet.ts        # Deploy Faucet system
│   ├── 08-swap-tokens.ts          # Script riêng cho swap tokens
│   ├── 09-test-swap-estimation.ts # Test tính năng ước lượng swap
│   └── 10-demo-swap-estimation.ts # Demo swap estimation
├── info/                          # Thông tin deployment
│   ├── TokenAddress.json          # Địa chỉ các token
│   ├── SimpleDEXAddress.json      # Địa chỉ SimpleDEX
│   ├── AllInitialLiquidity.json   # Thông tin thanh khoản tất cả cặp
│   ├── PriceOracleDeployment.json # Thông tin Price Oracle
│   ├── LiquidityMiningDeployment.json # Thông tin Liquidity Mining
│   ├── AdvancedFeaturesIntegrationTest.json # Kết quả test tích hợp
│   ├── FaucetInfo.json            # Thông tin Faucet
│   ├── SwapResults.json           # Kết quả swap tests
│   ├── SwapEstimationResults.json # Kết quả test ước lượng swap
│   └── DeploymentReport.json      # Báo cáo deployment tổng hợp
├── docs/
│   ├── SWAP_ESTIMATION_FEATURE.md # Tài liệu tính năng ước lượng swap
│   └── ADVANCED_FEATURES.md       # Tài liệu tính năng nâng cao
└── README.md                      # Tài liệu này
```

## 🛠️ Cài đặt và Setup

### Yêu cầu
- Node.js (v16+)
- npm hoặc yarn
- Hardhat
- Sepolia testnet ETH

### Cài đặt dependencies
```bash
npm install
```

### Cấu hình môi trường
Tạo file `.env` với các thông tin sau:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🚀 Deployment

### Deploy toàn bộ hệ thống (Khuyến nghị)
```bash
npx hardhat run scripts/00-deploy-everything.ts --network sepolia
```

### Deploy từng bước

1. **Deploy tokens**:
```bash
npx hardhat run scripts/01-deploy-tokens.ts --network sepolia
```

2. **Deploy SimpleDEX**:
```bash
npx hardhat run scripts/02-deploy-simple-dex.ts --network sepolia
```

3. **Approve tokens**:
```bash
npx hardhat run scripts/03-approve-tokens.ts --network sepolia
```

4. **Thêm thanh khoản ban đầu**:
```bash
npx hardhat run scripts/04-add-initial-liquidity.ts --network sepolia
```

5. **Test các tính năng**:
```bash
npx hardhat run scripts/05-test-dex-features.ts --network sepolia
```

6a. **Deploy Price Oracle**:
```bash
npx hardhat run scripts/06a-deploy-price-oracle.ts --network sepolia
```

6b. **Deploy Liquidity Mining**:
```bash
npx hardhat run scripts/06b-deploy-liquidity-mining.ts --network sepolia
```

6c. **Test tích hợp tính năng nâng cao**:
```bash
npx hardhat run scripts/06c-test-advanced-features.ts --network sepolia
```

7. **Deploy Faucet**:
```bash
npx hardhat run scripts/07-deploy-faucet.ts --network sepolia
```

8. **Test swap tokens**:
```bash
npx hardhat run scripts/08-swap-tokens.ts --network sepolia
```

## 📊 Smart Contracts

### Token.sol
ERC20 token contract với các tính năng chuẩn:
- `name()`: Tên token
- `symbol()`: Ký hiệu token
- `decimals()`: Số thập phân
- `totalSupply()`: Tổng cung
- `balanceOf(address)`: Số dư của địa chỉ
- `transfer(address, amount)`: Chuyển token
- `approve(address, amount)`: Phê duyệt chi tiêu
- `transferFrom(from, to, amount)`: Chuyển từ địa chỉ được phê duyệt

### SimpleDEX.sol
Core DEX contract với AMM:
- `addLiquidity(token0, token1, amount0, amount1)`: Thêm thanh khoản
- `removeLiquidity(token0, token1, liquidity)`: Rút thanh khoản
- `swapExactTokensForTokens(tokenIn, tokenOut, amountIn)`: Swap với input cố định
- `swapTokensForExactTokens(tokenIn, tokenOut, amountOut)`: Swap với output cố định
- `getPrice(token0, token1)`: Lấy giá token
- `getReserves(token0, token1)`: Lấy reserves của pool
- `getLiquidity(token0, token1)`: Lấy tổng thanh khoản
- `getBalance(token0, token1, user)`: Lấy LP token balance

### PriceOracle.sol
Hệ thống cung cấp giá:
- `updatePrice(token0, token1, price)`: Cập nhật giá (chỉ owner)
- `getPrice(token0, token1)`: Lấy giá hiện tại
- `getPriceData(token0, token1)`: Lấy thông tin chi tiết giá
- `calculatePriceFromReserves(reserve0, reserve1, decimals0, decimals1)`: Tính giá từ reserves

### LiquidityMining.sol
Hệ thống khuyến khích thanh khoản:
- `addPool(token0, token1, rewardRate)`: Thêm pool mining (chỉ owner)
- `stake(token0, token1, amount)`: Stake LP tokens
- `withdraw(token0, token1, amount)`: Rút LP tokens
- `claimRewards()`: Nhận rewards
- `earned(user, token0)`: Kiểm tra rewards đã kiếm được

### Faucet.sol
Hệ thống phân phối token miễn phí:
- `addToken(token, amount)`: Thêm token vào faucet (chỉ owner)
- `removeToken(token)`: Xóa token khỏi faucet (chỉ owner)
- `requestFaucet(token)`: Nhận token từ faucet
- `requestAllFaucets()`: Nhận tất cả token có sẵn
- `getTimeUntilNextFaucet(user)`: Kiểm tra thời gian chờ
- `getSupportedTokens()`: Lấy danh sách token được hỗ trợ
- `getTokenInfo(token)`: Lấy thông tin token trong faucet

## 💰 Faucet System

### Cách sử dụng Faucet
1. **Nhận token đơn lẻ**:
```javascript
await faucet.requestFaucet(tokenAddress);
```

2. **Nhận tất cả token**:
```javascript
await faucet.requestAllFaucets();
```

3. **Kiểm tra thời gian chờ**:
```javascript
const timeLeft = await faucet.getTimeUntilNextFaucet(userAddress);
```

### Giới hạn Faucet
- **Cooldown**: 24 giờ giữa các lần faucet
- **Số lượng**: 
  - BTC: 10 BTC
  - ETH: 100 ETH
  - USDT: 1000 USDT

## 🔄 Swap Tokens

### Các loại Swap

1. **Exact Input Swap** (Swap với số lượng input cố định):
```javascript
const amountOut = await simpleDex.swapExactTokensForTokens(
    tokenInAddress,
    tokenOutAddress,
    amountIn
);
```

2. **Exact Output Swap** (Swap với số lượng output cố định):
```javascript
const amountIn = await simpleDex.swapTokensForExactTokens(
    tokenInAddress,
    tokenOutAddress,
    amountOut
);
```

### Ước lượng Swap

1. **Ước lượng output cho input cố định**:
```javascript
const estimatedOut = await simpleDex.getAmountOut(
    tokenInAddress,
    tokenOutAddress,
    amountIn
);
```

2. **Ước lượng input cho output cố định**:
```javascript
const estimatedIn = await simpleDex.getAmountIn(
    tokenInAddress,
    tokenOutAddress,
    amountOut
);
```

3. **Lấy thông tin chi tiết pool**:
```javascript
const poolInfo = await simpleDex.getPoolInfo(token0Address, token1Address);
// Trả về: reserve0, reserve1, totalSupply, price0to1, price1to0
```

### Tính toán giá
```javascript
const price = await simpleDex.getPrice(token0Address, token1Address);
```

## 📈 Liquidity Management

### Thêm thanh khoản
```javascript
const liquidity = await simpleDex.addLiquidity(
    token0Address,
    token1Address,
    amount0Desired,
    amount1Desired
);
```

### Rút thanh khoản
```javascript
const [amount0, amount1] = await simpleDex.removeLiquidity(
    token0Address,
    token1Address,
    liquidityAmount
);
```

## 🔧 Quản lý

### Owner Functions
- **PriceOracle**: Chỉ owner có thể cập nhật giá
- **LiquidityMining**: Chỉ owner có thể thêm pool và quản lý rewards
- **Faucet**: Chỉ owner có thể thêm/xóa token và quản lý số lượng

### Emergency Functions
- **Faucet**: `emergencyWithdraw()` - Owner có thể rút token khỏi faucet

## 📊 Monitoring và Analytics

### Files được tạo tự động
- `TokenAddress.json`: Địa chỉ và thông tin tokens
- `SimpleDEXAddress.json`: Địa chỉ SimpleDEX contract
- `FaucetInfo.json`: Thông tin Faucet và số lượng
- `AdvancedFeatures.json`: Địa chỉ PriceOracle và LiquidityMining
- `SwapResults.json`: Kết quả các giao dịch swap
- `DeploymentReport.json`: Báo cáo tổng hợp deployment

### Kiểm tra trạng thái
```bash
# Kiểm tra balance tokens
npx hardhat run scripts/check-balances.ts --network sepolia

# Kiểm tra pool status
npx hardhat run scripts/check-pool-status.ts --network sepolia

# Kiểm tra faucet status
npx hardhat run scripts/check-faucet-status.ts --network sepolia
```

## 🧪 Testing

### Test tự động
```bash
# Test tất cả tính năng
npx hardhat run scripts/05-test-dex-features.ts --network sepolia

# Test swap riêng
npx hardhat run scripts/08-swap-tokens.ts --network sepolia

# Test tính năng ước lượng swap
npx hardhat run scripts/09-test-swap-estimation.ts --network sepolia
```

### Test thủ công
1. Deploy contracts
2. Thêm thanh khoản
3. Thực hiện swap
4. Kiểm tra kết quả

## 🔒 Security Features

- **Access Control**: Sử dụng OpenZeppelin Ownable cho admin functions
- **Input Validation**: Kiểm tra tất cả input parameters
- **Reentrancy Protection**: Sử dụng checks-effects-interactions pattern
- **Emergency Withdraw**: Owner có thể rút token trong trường hợp khẩn cấp
- **Cooldown Protection**: Faucet có cooldown 24h để tránh spam

## 📝 Important Notes

1. **Network**: Tất cả deployment và test đều trên Sepolia testnet
2. **Gas**: Đảm bảo có đủ ETH cho gas fees
3. **Approvals**: Luôn approve tokens trước khi thực hiện giao dịch
4. **Liquidity**: Cần có thanh khoản trong pool để có thể swap
5. **Faucet**: Mỗi địa chỉ chỉ có thể nhận token mỗi 24 giờ

## 🚨 Troubleshooting

### Lỗi thường gặp

1. **"INSUFFICIENT_LIQUIDITY"**:
   - Pool chưa có thanh khoản
   - Chạy script thêm thanh khoản trước

2. **"INSUFFICIENT_LIQUIDITY_BALANCE"**:
   - Không đủ LP tokens để rút
   - Kiểm tra balance LP tokens

3. **"Must wait 24 hours between faucet requests"**:
   - Chưa đủ 24h từ lần faucet trước
   - Kiểm tra thời gian chờ

4. **"INSUFFICIENT_INPUT_AMOUNT"**:
   - Số lượng token không đủ
   - Kiểm tra balance và approve

### Debug Commands
```bash
# Kiểm tra balance
npx hardhat run scripts/debug-balances.ts --network sepolia

# Kiểm tra approvals
npx hardhat run scripts/debug-approvals.ts --network sepolia

# Kiểm tra pool state
npx hardhat run scripts/debug-pool-state.ts --network sepolia
```

## 📊 Performance Metrics

- **Gas Usage**: Tối ưu hóa cho gas efficiency
- **Transaction Speed**: Tương thích với các network khác nhau
- **Scalability**: Hỗ trợ nhiều token pairs
- **User Experience**: Interface đơn giản và dễ sử dụng

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📚 Documentation

- **Swap Estimation**: [SWAP_ESTIMATION_FEATURE.md](./docs/SWAP_ESTIMATION_FEATURE.md) - Chi tiết về tính năng ước lượng swap
- **Advanced Features**: [ADVANCED_FEATURES.md](./docs/ADVANCED_FEATURES.md) - Chi tiết về Price Oracle và Liquidity Mining
- **Code Comments**: Xem comments trong code để hiểu implementation
- **Examples**: Chạy các script test để hiểu cách sử dụng

## 🆘 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem comments trong code
- **Examples**: Chạy các script test để hiểu cách sử dụng

---

**SimpleDEX Ecosystem** - Một giải pháp DEX hoàn chỉnh cho tương lai của DeFi! 🚀 