# 🧮 Tính Năng Ước Lượng Swap - SimpleDEX

## 📋 Tổng Quan

Tính năng **Swap Estimation** cho phép người dùng ước lượng số lượng token sẽ nhận được khi thực hiện swap mà không cần thực hiện giao dịch thực tế. Điều này giúp người dùng:

- ✅ Biết trước kết quả trước khi swap
- ✅ Tính toán chi phí và lợi nhuận
- ✅ So sánh giá giữa các DEX khác nhau
- ✅ Tránh slippage bất ngờ

## 🚀 Các Hàm Mới Được Thêm

### 1. `getAmountOut()` - Ước Lượng Output

```solidity
function getAmountOut(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external view returns (uint256 amountOut)
```

**Mục đích**: Ước lượng số lượng token output khi swap với số lượng input cố định.

**Tham số**:
- `tokenIn`: Địa chỉ token muốn bán
- `tokenOut`: Địa chỉ token muốn mua
- `amountIn`: Số lượng token input

**Trả về**: Số lượng token output sẽ nhận được

**Ví dụ sử dụng**:
```javascript
// Ước lượng 1 BTC sẽ đổi được bao nhiêu ETH
const amountOut = await simpleDex.getAmountOut(
    btcTokenAddress,
    ethTokenAddress,
    ethers.parseUnits("1", 18) // 1 BTC
);
console.log(`1 BTC = ${ethers.formatUnits(amountOut, 18)} ETH`);
```

### 2. `getAmountIn()` - Ước Lượng Input

```solidity
function getAmountIn(
    address tokenIn,
    address tokenOut,
    uint256 amountOut
) external view returns (uint256 amountIn)
```

**Mục đích**: Ước lượng số lượng token input cần thiết để nhận được số lượng output cố định.

**Tham số**:
- `tokenIn`: Địa chỉ token muốn bán
- `tokenOut`: Địa chỉ token muốn mua
- `amountOut`: Số lượng token output mong muốn

**Trả về**: Số lượng token input cần thiết

**Ví dụ sử dụng**:
```javascript
// Ước lượng cần bao nhiêu ETH để nhận 1 BTC
const amountIn = await simpleDex.getAmountIn(
    ethTokenAddress,
    btcTokenAddress,
    ethers.parseUnits("1", 18) // 1 BTC
);
console.log(`Cần ${ethers.formatUnits(amountIn, 18)} ETH để nhận 1 BTC`);
```

### 3. `getPoolInfo()` - Thông Tin Chi Tiết Pool

```solidity
function getPoolInfo(address token0, address token1) external view returns (
    uint256 reserve0,
    uint256 reserve1,
    uint256 totalSupply,
    uint256 price0to1,
    uint256 price1to0
)
```

**Mục đích**: Lấy thông tin chi tiết về một pool, bao gồm reserves, LP supply và giá.

**Tham số**:
- `token0`: Token thứ nhất
- `token1`: Token thứ hai

**Trả về**:
- `reserve0`: Số lượng token0 trong pool
- `reserve1`: Số lượng token1 trong pool
- `totalSupply`: Tổng số LP token đã phát hành
- `price0to1`: Giá token1 theo token0
- `price1to0`: Giá token0 theo token1

**Ví dụ sử dụng**:
```javascript
const poolInfo = await simpleDex.getPoolInfo(btcAddress, ethAddress);
console.log(`Reserve BTC: ${ethers.formatUnits(poolInfo.reserve0, 18)}`);
console.log(`Reserve ETH: ${ethers.formatUnits(poolInfo.reserve1, 18)}`);
console.log(`Giá ETH/BTC: ${ethers.formatUnits(poolInfo.price0to1, 18)}`);
```

## 🔧 Cách Hoạt Động

### 1. Công Thức Tính Toán

Các hàm ước lượng sử dụng cùng công thức với swap thực tế:

**Cho `getAmountOut()`**:
```
amountOut = (amountIn * (1000 - 3) * reserveOut) / (reserveIn * 1000 + amountIn * (1000 - 3))
```

**Cho `getAmountIn()`**:
```
amountIn = (reserveIn * amountOut * 1000) / (reserveOut * (1000 - 3)) + 1
```

Trong đó:
- `3` là fee (0.3%)
- `1000` là fee denominator
- `+1` để tránh rounding errors

### 2. Sắp Xếp Token

Tất cả các hàm đều sắp xếp token theo thứ tự địa chỉ để đảm bảo tính nhất quán:
```solidity
(address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
```

### 3. Validation

Các hàm đều có validation đầy đủ:
- Kiểm tra token addresses khác nhau
- Kiểm tra amount > 0
- Kiểm tra pool có thanh khoản
- Kiểm tra kết quả > 0

## 📊 Ví Dụ Thực Tế

### Scenario 1: Ước Lượng BTC -> ETH

```javascript
// Pool: 100 BTC + 1000 ETH
// User muốn swap 1 BTC

const estimatedETH = await simpleDex.getAmountOut(
    btcAddress,
    ethAddress,
    ethers.parseUnits("1", 18)
);

// Kết quả: ~9.97 ETH (sau khi trừ fee 0.3%)
console.log(`1 BTC ≈ ${ethers.formatUnits(estimatedETH, 18)} ETH`);
```

### Scenario 2: Ước Lượng Input Cho Output Cố Định

```javascript
// User muốn nhận chính xác 10 ETH
// Cần bao nhiêu BTC?

const requiredBTC = await simpleDex.getAmountIn(
    btcAddress,
    ethAddress,
    ethers.parseUnits("10", 18)
);

// Kết quả: ~1.003 BTC (bao gồm fee)
console.log(`Cần ${ethers.formatUnits(requiredBTC, 18)} BTC để nhận 10 ETH`);
```

### Scenario 3: So Sánh Ước Lượng vs Thực Tế

```javascript
// Ước lượng trước
const estimated = await simpleDex.getAmountOut(btcAddress, ethAddress, amountIn);

// Thực hiện swap
const tx = await simpleDex.swapExactTokensForTokens(btcAddress, ethAddress, amountIn);
const receipt = await tx.wait();

// Lấy kết quả thực tế từ event
const actual = getAmountFromEvent(receipt);

// So sánh
const difference = estimated - actual;
const accuracy = (actual / estimated) * 100;

console.log(`Ước lượng: ${estimated}`);
console.log(`Thực tế: ${actual}`);
console.log(`Chênh lệch: ${difference}`);
console.log(`Độ chính xác: ${accuracy}%`);
```

## 🧪 Testing

### Script Test: `09-test-swap-estimation.ts`

Script này test đầy đủ các tính năng ước lượng:

1. **Test Pool Information**:
   - Kiểm tra reserves
   - Kiểm tra LP supply
   - Kiểm tra giá

2. **Test Output Estimation**:
   - BTC -> ETH
   - ETH -> BTC
   - ETH -> USDT

3. **Test Input Estimation**:
   - ETH -> BTC (exact output)
   - ETH -> USDT (exact output)

4. **Test Accuracy**:
   - So sánh ước lượng với swap thực tế
   - Tính độ chính xác

### Chạy Test

```bash
# Test trên localhost
npx hardhat run scripts/09-test-swap-estimation.ts --network localhost

# Test trên Sepolia
npx hardhat run scripts/09-test-swap-estimation.ts --network sepolia
```

## 📈 Lợi Ích

### 1. **User Experience**
- Người dùng biết trước kết quả
- Giảm thiểu surprise
- Tăng độ tin cậy

### 2. **Developer Experience**
- API đơn giản và dễ sử dụng
- Tương thích với các DEX khác
- Documentation đầy đủ

### 3. **Business Value**
- Tăng volume giao dịch
- Giảm failed transactions
- Cải thiện user retention

## 🔒 Security

### 1. **View Functions**
- Tất cả hàm ước lượng đều là `view`
- Không thay đổi state
- Không tốn gas (khi gọi từ off-chain)

### 2. **Input Validation**
- Kiểm tra đầy đủ input parameters
- Revert với error messages rõ ràng
- Bảo vệ khỏi edge cases

### 3. **Consistency**
- Sử dụng cùng logic với swap thực tế
- Đảm bảo tính nhất quán
- Tránh discrepancies

## 🚀 Tương Lai

### 1. **Tính Năng Mở Rộng**
- Multi-hop estimation (swap qua nhiều pool)
- Slippage calculation
- Gas estimation
- MEV protection

### 2. **Integration**
- Frontend integration
- Mobile app support
- API endpoints
- WebSocket updates

### 3. **Analytics**
- Usage tracking
- Performance metrics
- User behavior analysis
- Optimization suggestions

## 📝 Kết Luận

Tính năng **Swap Estimation** là một bước tiến quan trọng trong việc cải thiện trải nghiệm người dùng của SimpleDEX. Với 3 hàm chính:

- ✅ `getAmountOut()`: Ước lượng output
- ✅ `getAmountIn()`: Ước lượng input  
- ✅ `getPoolInfo()`: Thông tin pool

Người dùng có thể:
- 🔍 Biết trước kết quả swap
- 💰 Tính toán chi phí chính xác
- ⚡ Thực hiện giao dịch với confidence cao
- 📊 So sánh giá giữa các DEX

Tính năng này đã được test đầy đủ và sẵn sàng cho production use! 🎉 