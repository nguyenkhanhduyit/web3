# Faucet với Số Lượng 0.5 Token cho Người Dùng

## Tổng Quan
Faucet contract đã được cập nhật để:
- **Deployer**: Có thể gửi bất kỳ số lượng token nào vào faucet contract
- **Người dùng**: Mỗi lần chỉ được nhận 0.5 token (cố định)

## Cách Hoạt Động

### 1. Deployer (Owner)
- Có thể thêm token mới vào faucet
- Có thể gửi bất kỳ số lượng token nào vào faucet contract
- Có thể cập nhật số lượng faucet (nhưng người dùng vẫn nhận 0.5 token)

### 2. Người Dùng
- Mỗi lần faucet chỉ nhận được 0.5 token
- Có thể faucet một token cụ thể hoặc tất cả token
- Phải chờ 24 giờ giữa các lần faucet

## Smart Contract Functions

### Functions cho Deployer (Owner)

#### `addToken(address token)`
- Thêm token mới vào faucet
- Tự động set số lượng faucet là 0.5 token cho người dùng
- Chỉ owner có thể gọi

#### `updateFaucetAmount(address token, uint256 newAmount)`
- Cập nhật số lượng faucet cho token
- Chỉ owner có thể gọi
- Người dùng vẫn nhận 0.5 token mỗi lần

#### `emergencyWithdraw(address token, uint256 amount)`
- Rút token khỏi faucet trong trường hợp khẩn cấp
- Chỉ owner có thể gọi

### Functions cho Người Dùng

#### `requestFaucet(address token)`
- Nhận 0.5 token cụ thể
- Phải chờ 24 giờ giữa các lần faucet

#### `requestAllFaucets()`
- Nhận 0.5 token của tất cả token có sẵn
- Phải chờ 24 giờ giữa các lần faucet

#### `getTimeUntilNextFaucet(address user)`
- Kiểm tra thời gian còn lại trước khi có thể faucet lại

## Deployment Scripts

### 1. Deploy Faucet với Token Ban Đầu
```bash
npx hardhat run scripts/07-deploy-faucet.ts --network <network>
```

Script này sẽ:
- Deploy faucet contract
- Thêm các token ban đầu (Bitcoin, Ethereum, USDT)
- Deployer gửi token vào faucet:
  - 100 BTC
  - 1000 ETH
  - 10000 USDT
- Người dùng sẽ nhận 0.5 token mỗi lần faucet

### 2. Thêm Token Mới
```bash
npx hardhat run scripts/15-add-token-to-faucet.ts --network <network>
```

Script này sẽ:
- Deploy token mới
- Thêm token vào faucet
- Deployer gửi 1000 token vào faucet
- Người dùng sẽ nhận 0.5 token mỗi lần faucet

### 3. Test Faucet
```bash
npx hardhat run scripts/14-test-faucet-0.5.ts --network <network>
```

Script này sẽ test:
- Faucet một token cụ thể
- Faucet tất cả token
- Cooldown period
- Thêm token mới

## Ví Dụ Sử Dụng

### Deployer Thêm Token Mới
```javascript
// Deploy token mới
const Token = await ethers.getContractFactory("Token");
const newToken = await Token.deploy("My Token", "MTK", 18);
await newToken.waitForDeployment();

// Mint token cho deployer
await newToken.mint(deployer.address, ethers.parseUnits("10000", 18));

// Thêm vào faucet
await faucet.addToken(newTokenAddress);

// Gửi token vào faucet (có thể gửi bất kỳ số lượng nào)
await newToken.transfer(faucetAddress, ethers.parseUnits("1000", 18));
```

### Người Dùng Faucet Token
```javascript
// Faucet một token cụ thể
await faucet.requestFaucet(tokenAddress);
// Người dùng nhận 0.5 token

// Faucet tất cả token
await faucet.requestAllFaucets();
// Người dùng nhận 0.5 token của mỗi loại
```

## Thông Tin Lưu Trữ

### FaucetInfo.json
```json
{
  "faucetAddress": "0x...",
  "deployedAt": "2024-01-01T00:00:00.000Z",
  "blockNumber": 12345,
  "deployer": "0x...",
  "supportedTokens": ["Bitcoin", "Ethereum", "Tether USD"],
  "userFaucetAmount": "0.5 tokens per request",
  "deployerAmounts": {
    "Bitcoin": "100000000",
    "Ethereum": "1000000000000000000000",
    "Tether USD": "10000000"
  },
  "cooldownPeriod": "24 hours"
}
```

## Lợi Ích của Thiết Kế Này

### 1. Linh Hoạt cho Deployer
- Có thể gửi bất kỳ số lượng token nào vào faucet
- Có thể thêm token mới bất cứ lúc nào
- Kiểm soát được tổng số token trong faucet

### 2. Công Bằng cho Người Dùng
- Tất cả người dùng nhận cùng số lượng token (0.5)
- Tránh spam và lạm dụng faucet
- Cooldown period đảm bảo phân phối công bằng

### 3. Bảo Mật
- Chỉ owner có thể thêm/xóa token
- Người dùng không thể thay đổi số lượng faucet
- Emergency withdrawal cho trường hợp khẩn cấp

## Troubleshooting

### Vấn Đề Thường Gặp

1. **"Token not available in faucet"**
   - Token chưa được thêm vào faucet
   - Chạy script thêm token

2. **"Must wait 24 hours between faucet requests"**
   - Người dùng phải chờ 24 giờ
   - Kiểm tra thời gian còn lại

3. **"Insufficient balance"**
   - Faucet hết token
   - Deployer cần gửi thêm token vào faucet

### Debug Commands
```bash
# Kiểm tra thông tin token trong faucet
npx hardhat run scripts/check-faucet-info.ts

# Kiểm tra balance của faucet
npx hardhat run scripts/check-faucet-balance.ts

# Test faucet functionality
npx hardhat run scripts/14-test-faucet-0.5.ts
```

## Kết Luận

Thiết kế mới này cung cấp:
- **Tính linh hoạt** cho deployer trong việc quản lý token
- **Tính công bằng** cho người dùng với số lượng cố định 0.5 token
- **Tính bảo mật** với các biện pháp bảo vệ phù hợp
- **Tính dễ sử dụng** với các script deployment và test sẵn có 