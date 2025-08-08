# Cập nhật Token Decimals và Price Oracle

## Tổng quan

Đã cập nhật cấu hình tokens để sử dụng decimals chính xác theo chuẩn thực tế:

### Cấu hình Tokens Mới

| Token | Symbol | Decimals | Total Supply | Price (USD) | Total Value (USD) |
|-------|--------|----------|--------------|-------------|-------------------|
| Bitcoin | BTC | 8 | 21,000,000 | $113,000 | $2,373,000,000,000 |
| Ethereum | ETH | 18 | 120,000,000 | $3,800 | $456,000,000,000 |
| Tether USD | USDT | 6 | 1,000,000,000 | $1 | $1,000,000,000 |

## Thay đổi chính

### 1. Cập nhật Token Deployment (`01-deploy-tokens.ts`)

```typescript
const tokens = [
  {
    name: "Bitcoin",
    symbol: "BTC", 
    decimals: 8,           // Thay đổi từ 18 sang 8
    totalSupply: "21000000" // Thay đổi từ 1B sang 21M BTC
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,          // Giữ nguyên 18
    totalSupply: "120000000" // Thay đổi từ 1B sang 120M ETH
  },
  {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,           // Thay đổi từ 18 sang 6
    totalSupply: "1000000000" // Giữ nguyên 1B USDT
  }
];
```

### 2. Cập nhật Price Oracle (`06a-deploy-price-oracle.ts`)

```typescript
const usdPrices: { [key: string]: number } = {
  "Bitcoin": 113000,      // 1 BTC = $113,000 USD
  "Ethereum": 3800,       // 1 ETH = $3,800 USD  
  "Tether USD": 1         // 1 USDT = $1 USD
};
```

## Scripts mới

### 1. Test Token Decimals (`test-new-token-decimals.ts`)

Script này kiểm tra:
- Decimals của từng token
- Total supply và balance
- Giá trị USD tổng
- Price oracle accuracy

**Chạy script:**
```bash
npx hardhat run scripts/test-new-token-decimals.ts --network localhost
```

## Quy trình Deploy

### Bước 1: Deploy Tokens với Decimals chính xác
```bash
npx hardhat run scripts/01-deploy-tokens.ts --network localhost
```

### Bước 2: Deploy SimpleDEX
```bash
npx hardhat run scripts/02-deploy-simple-dex.ts --network localhost
```

### Bước 3: Approve Tokens
```bash
npx hardhat run scripts/03-approve-tokens.ts --network localhost
```

### Bước 4: Add Initial Liquidity
```bash
npx hardhat run scripts/04-add-initial-liquidity.ts --network localhost
```

### Bước 5: Deploy Price Oracle
```bash
npx hardhat run scripts/06a-deploy-price-oracle.ts --network localhost
```

### Bước 6: Test Token Decimals
```bash
npx hardhat run scripts/test-new-token-decimals.ts --network localhost
```

## Lưu ý quan trọng

### 1. Decimals và Total Supply

- **BTC**: 8 decimals = 1 BTC = 100,000,000 satoshis
- **ETH**: 18 decimals = 1 ETH = 10^18 wei  
- **USDT**: 6 decimals = 1 USDT = 1,000,000 smallest units

### 2. Price Oracle

Price oracle sử dụng 18 decimals cho tất cả giá (wei format):
- 1 BTC = $113,000 = 113,000 * 10^18 wei
- 1 ETH = $3,800 = 3,800 * 10^18 wei
- 1 USDT = $1 = 1 * 10^18 wei

### 3. Tính toán Total Supply

```typescript
// BTC: 21,000,000 BTC * 10^8 = 2,100,000,000,000,000 satoshis
const btcTotalSupply = ethers.utils.parseUnits("21000000", 8);

// ETH: 120,000,000 ETH * 10^18 = 120,000,000,000,000,000,000,000 wei
const ethTotalSupply = ethers.utils.parseUnits("120000000", 18);

// USDT: 1,000,000,000 USDT * 10^6 = 1,000,000,000,000,000 smallest units
const usdtTotalSupply = ethers.utils.parseUnits("1000000000", 6);
```

## Kiểm tra kết quả

Sau khi deploy, bạn có thể kiểm tra:

1. **Token Addresses**: `info/TokenAddress.json`
2. **Price Oracle**: `info/PriceOracleAddress.json`
3. **Test Results**: Chạy `test-new-token-decimals.ts`

## Troubleshooting

### Lỗi thường gặp

1. **Decimals mismatch**: Đảm bảo sử dụng đúng decimals khi format/parse units
2. **Price accuracy**: Kiểm tra price oracle có được update đúng giá không
3. **Total supply**: Verify total supply matches expected values

### Debug Commands

```bash
# Kiểm tra token balances
npx hardhat run scripts/check-token-balances.ts --network localhost

# Test price oracle
npx hardhat run scripts/test-new-token-decimals.ts --network localhost
```

## Kết luận

Với cấu hình mới này:
- Tokens sử dụng decimals chính xác theo chuẩn thực tế
- Price oracle hoạt động với giá USD chính xác
- Total supply phản ánh giá trị thực tế của từng token
- Hệ thống DEX hoạt động ổn định với decimals khác nhau 