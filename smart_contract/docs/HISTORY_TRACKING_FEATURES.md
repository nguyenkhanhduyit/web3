# History Tracking Features

## Tổng quan

Các smart contracts đã được cập nhật để hỗ trợ lưu trữ và truy xuất lịch sử giao dịch cho người dùng. Tính năng này cho phép:

- **SimpleDEX**: Lưu trữ lịch sử swap token
- **Faucet**: Lưu trữ lịch sử sử dụng faucet
- **Transactions**: Đã có sẵn lịch sử gửi ETH

## SimpleDEX History Tracking

### Structs

```solidity
struct SwapHistory {
    address tokenIn;         // Token được bán
    address tokenOut;        // Token được mua
    uint256 amountIn;        // Số lượng token bán
    uint256 amountOut;       // Số lượng token mua
    uint256 timestamp;       // Thời gian swap
    address trader;          // Địa chỉ người swap
    uint256 blockNumber;     // Số block
}
```

### State Variables

```solidity
SwapHistory[] public swapHistory;                    // Tất cả lịch sử swap
mapping(address => uint256[]) public userSwapIndices; // Mapping user -> indices
```

### Functions

#### View Functions

```solidity
// Lấy tổng số giao dịch swap
function getTotalSwapCount() external view returns (uint256)

// Lấy số giao dịch swap của một user
function getUserSwapCount(address user) external view returns (uint256)

// Lấy lịch sử swap của một user (pagination)
function getUserSwapHistory(
    address user,
    uint256 start,
    uint256 count
) external view returns (SwapHistory[] memory)

// Lấy tất cả lịch sử swap của một user
function getAllUserSwapHistory(address user) external view returns (SwapHistory[] memory)

// Lấy thông tin chi tiết của một giao dịch swap
function getSwapDetails(uint256 swapIndex) external view returns (SwapHistory memory)
```

#### Internal Functions

```solidity
// Lưu lịch sử swap (tự động gọi trong các hàm swap)
function _recordSwapHistory(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut,
    address trader
) internal
```

## Faucet History Tracking

### Structs

```solidity
struct FaucetHistory {
    address user;            // Địa chỉ người dùng
    address token;           // Địa chỉ token
    uint256 amount;          // Số lượng token nhận
    uint256 timestamp;       // Thời gian nhận
    uint256 blockNumber;     // Số block
}
```

### State Variables

```solidity
FaucetHistory[] public faucetHistory;                    // Tất cả lịch sử faucet
mapping(address => uint256[]) public userFaucetIndices;  // Mapping user -> indices
```

### Functions

#### View Functions

```solidity
// Lấy tổng số giao dịch faucet
function getTotalFaucetCount() external view returns (uint256)

// Lấy số giao dịch faucet của một user
function getUserFaucetCount(address user) external view returns (uint256)

// Lấy lịch sử faucet của một user (pagination)
function getUserFaucetHistory(
    address user,
    uint256 start,
    uint256 count
) external view returns (FaucetHistory[] memory)

// Lấy tất cả lịch sử faucet của một user
function getAllUserFaucetHistory(address user) external view returns (FaucetHistory[] memory)

// Lấy thông tin chi tiết của một giao dịch faucet
function getFaucetDetails(uint256 faucetIndex) external view returns (FaucetHistory memory)
```

#### Internal Functions

```solidity
// Lưu lịch sử faucet (tự động gọi trong các hàm faucet)
function _recordFaucetHistory(
    address user,
    address token,
    uint256 amount
) internal
```

## Cách sử dụng

### Frontend Integration

#### Lấy lịch sử swap

```javascript
// Lấy tất cả lịch sử swap của user
const swapHistory = await simpleDEX.getAllUserSwapHistory(userAddress);

// Lấy lịch sử swap với pagination
const swapHistory = await simpleDEX.getUserSwapHistory(userAddress, 0, 10);

// Lấy số lượng swap của user
const swapCount = await simpleDEX.getUserSwapCount(userAddress);
```

#### Lấy lịch sử faucet

```javascript
// Lấy tất cả lịch sử faucet của user
const faucetHistory = await faucet.getAllUserFaucetHistory(userAddress);

// Lấy lịch sử faucet với pagination
const faucetHistory = await faucet.getUserFaucetHistory(userAddress, 0, 10);

// Lấy số lượng faucet của user
const faucetCount = await faucet.getUserFaucetCount(userAddress);
```

### Hiển thị thông tin

#### Swap History Display

```javascript
const displaySwapHistory = (swapHistory) => {
  return swapHistory.map(swap => ({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    amountIn: formatUnits(swap.amountIn, decimals),
    amountOut: formatUnits(swap.amountOut, decimals),
    timestamp: new Date(swap.timestamp.toNumber() * 1000),
    blockNumber: swap.blockNumber.toString(),
    trader: swap.trader
  }));
};
```

#### Faucet History Display

```javascript
const displayFaucetHistory = (faucetHistory) => {
  return faucetHistory.map(faucet => ({
    user: faucet.user,
    token: faucet.token,
    amount: formatUnits(faucet.amount, decimals),
    timestamp: new Date(faucet.timestamp.toNumber() * 1000),
    blockNumber: faucet.blockNumber.toString()
  }));
};
```

## Gas Optimization

### Pagination

Để tối ưu gas khi lấy lịch sử, sử dụng pagination:

```javascript
// Thay vì lấy tất cả
const allHistory = await contract.getAllUserHistory(userAddress);

// Sử dụng pagination
const pageSize = 20;
const page1 = await contract.getUserHistory(userAddress, 0, pageSize);
const page2 = await contract.getUserHistory(userAddress, pageSize, pageSize);
```

### Batch Processing

Khi cần xử lý nhiều giao dịch, sử dụng batch:

```javascript
const batchSize = 10;
const totalCount = await contract.getUserCount(userAddress);
const batches = Math.ceil(totalCount / batchSize);

for (let i = 0; i < batches; i++) {
  const start = i * batchSize;
  const batch = await contract.getUserHistory(userAddress, start, batchSize);
  // Process batch
}
```

## Events

Các events hiện tại vẫn được emit như bình thường:

### SimpleDEX Events
```solidity
event Swap(
    address indexed tokenIn,
    address indexed tokenOut,
    uint256 amountIn,
    uint256 amountOut,
    address indexed trader
);
```

### Faucet Events
```solidity
event FaucetUsed(
    address indexed user,
    address indexed token,
    uint256 amount
);
```

## Testing

### Test Scripts

1. **14-test-history-features.ts**: Test toàn diện các tính năng history
2. **15-deploy-with-history.ts**: Deploy và test contracts với history features

### Chạy Tests

```bash
# Compile contracts
npx hardhat compile

# Run history tests
npx hardhat test test/14-test-history-features.ts

# Deploy with history features
npx hardhat run scripts/15-deploy-with-history.ts --network sepolia
```

## Migration Notes

### Từ phiên bản cũ

Các contracts mới tương thích ngược với phiên bản cũ:
- Tất cả functions cũ vẫn hoạt động bình thường
- History tracking được thêm vào mà không ảnh hưởng logic hiện tại
- Events vẫn được emit như trước

### Deployment

1. Deploy contracts mới
2. Update frontend để sử dụng history functions
3. Test các tính năng mới
4. Migrate dữ liệu nếu cần

## Security Considerations

### Access Control

- Tất cả history functions đều là `view` functions
- Không có access control đặc biệt - ai cũng có thể query history
- Chỉ user mới có thể thấy lịch sử của chính mình

### Data Privacy

- History được lưu trữ trên blockchain (public)
- Không có dữ liệu nhạy cảm được lưu trữ
- Timestamps và block numbers có thể được sử dụng để track

### Gas Limits

- History arrays có thể phình to theo thời gian
- Sử dụng pagination để tránh gas limit issues
- Consider archive nodes cho historical data cũ

## Future Enhancements

### Planned Features

1. **Filtering**: Filter history theo token, time range
2. **Search**: Search trong history
3. **Export**: Export history data
4. **Analytics**: Thống kê và phân tích
5. **Notifications**: Real-time notifications cho new transactions

### Optimization Opportunities

1. **Indexing**: Sử dụng events thay vì storage cho một số use cases
2. **Compression**: Compress historical data
3. **Archiving**: Move old data to archive storage
4. **Caching**: Cache frequently accessed data 