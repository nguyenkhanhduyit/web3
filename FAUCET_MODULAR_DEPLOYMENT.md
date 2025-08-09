# Faucet Modular Deployment Guide

## Tổng Quan
Module deploy faucet đã được tách thành nhiều file riêng biệt để dễ quản lý và thực hiện từng bước một cách độc lập.

## Cấu Trúc Scripts

### 1. **07a-deploy-faucet-contract.ts**
- **Mục đích**: Deploy chỉ Faucet contract
- **Chức năng**: 
  - Deploy Faucet smart contract
  - Lưu thông tin cơ bản vào `FaucetInfo.json`
- **Output**: Faucet contract address

### 2. **07b-add-tokens-to-faucet.ts**
- **Mục đích**: Thêm token đã deploy vào faucet
- **Chức năng**:
  - Đọc thông tin token từ `TokenAddress.json`
  - Thêm từng token vào faucet
  - Cập nhật thông tin faucet
- **Input**: Faucet contract đã deploy
- **Output**: Danh sách token đã thêm vào faucet

### 3. **07c-fund-faucet.ts**
- **Mục đích**: Gửi token vào faucet để người dùng có thể nhận
- **Chức năng**:
  - Deployer gửi token vào faucet contract
  - Kiểm tra balance và thực hiện transfer
  - Lưu kết quả funding
- **Input**: Faucet contract và token đã thêm
- **Output**: Faucet được fund với token

### 4. **07d-test-faucet.ts**
- **Mục đích**: Test toàn bộ tính năng faucet
- **Chức năng**:
  - Test faucet một token cụ thể
  - Test faucet tất cả token
  - Test cooldown period
  - Kiểm tra balance và thông tin
- **Input**: Faucet contract đã hoàn thiện
- **Output**: Báo cáo test results

### 5. **07-deploy-faucet-complete.ts**
- **Mục đích**: Chạy tất cả các bước một cách tuần tự
- **Chức năng**: Tự động thực hiện từ bước 1 đến bước 4
- **Output**: Faucet hoàn chỉnh và sẵn sàng sử dụng

## Cách Sử Dụng

### Phương Pháp 1: Chạy Từng Bước (Khuyến Nghị)

```bash
# Bước 1: Deploy faucet contract
npx hardhat run scripts/07a-deploy-faucet-contract.ts --network <network>

# Bước 2: Thêm token vào faucet
npx hardhat run scripts/07b-add-tokens-to-faucet.ts --network <network>

# Bước 3: Gửi token vào faucet
npx hardhat run scripts/07c-fund-faucet.ts --network <network>

# Bước 4: Test faucet
npx hardhat run scripts/07d-test-faucet.ts --network <network>
```

### Phương Pháp 2: Chạy Tất Cả Cùng Lúc

```bash
# Deploy hoàn chỉnh faucet
npx hardhat run scripts/07-deploy-faucet-complete.ts --network <network>
```

## Lợi Ích của Modular Deployment

### 1. **Kiểm Soát Tốt Hơn**
- Có thể dừng và kiểm tra ở bất kỳ bước nào
- Dễ debug khi có lỗi xảy ra
- Có thể chạy lại từng bước riêng biệt

### 2. **Linh Hoạt**
- Có thể thay đổi số lượng token funding ở bước 3
- Có thể thêm token mới sau khi đã deploy
- Có thể test từng phần riêng biệt

### 3. **Bảo Mật**
- Kiểm tra từng bước trước khi tiếp tục
- Có thể xác nhận thông tin trước khi thực hiện
- Dễ dàng rollback nếu cần

### 4. **Dễ Bảo Trì**
- Mỗi script có chức năng rõ ràng
- Dễ dàng cập nhật từng phần
- Code dễ đọc và hiểu

## Thông Tin File Output

### FaucetInfo.json (Sau bước 1)
```json
{
  "faucetAddress": "0x...",
  "deployedAt": "2024-01-01T00:00:00.000Z",
  "blockNumber": 12345,
  "deployer": "0x...",
  "cooldownPeriod": "24 hours",
  "userFaucetAmount": "0.5 tokens per request"
}
```

### FaucetInfo.json (Sau bước 2)
```json
{
  "faucetAddress": "0x...",
  "supportedTokens": ["Bitcoin", "Ethereum", "Tether USD"],
  "addedTokens": [...],
  "tokensAddedAt": "2024-01-01T00:00:00.000Z"
}
```

### FaucetInfo.json (Sau bước 3)
```json
{
  "faucetAddress": "0x...",
  "fundingResults": [...],
  "fundedAt": "2024-01-01T00:00:00.000Z",
  "fundAmounts": {...}
}
```

## Troubleshooting

### Lỗi Thường Gặp

1. **"TokenAddress.json không tồn tại"**
   ```bash
   # Chạy deploy tokens trước
   npx hardhat run scripts/01-deploy-tokens.ts --network <network>
   ```

2. **"FaucetInfo.json không tồn tại"**
   ```bash
   # Chạy deploy faucet contract trước
   npx hardhat run scripts/07a-deploy-faucet-contract.ts --network <network>
   ```

3. **"Insufficient balance"**
   - Kiểm tra balance của deployer
   - Mint thêm token nếu cần
   - Điều chỉnh số lượng funding

4. **"Token already added"**
   - Token đã được thêm vào faucet
   - Có thể bỏ qua bước 2

### Debug Commands

```bash
# Kiểm tra balance của deployer
npx hardhat run scripts/check-token-balances.ts --network <network>

# Kiểm tra thông tin faucet
npx hardhat run scripts/check-faucet-info.ts --network <network>

# Test faucet functionality
npx hardhat run scripts/07d-test-faucet.ts --network <network>
```

## Workflow Đề Xuất

### Cho Development
1. Deploy tokens
2. Deploy faucet contract
3. Thêm token vào faucet
4. Test với số lượng nhỏ
5. Funding với số lượng lớn
6. Test hoàn chỉnh

### Cho Production
1. Deploy tokens
2. Deploy faucet contract
3. Thêm token vào faucet
4. Funding với số lượng mong muốn
5. Test kỹ lưỡng
6. Deploy lên mainnet

## Kết Luận

Modular deployment cung cấp:
- **Tính linh hoạt** cao trong quá trình deploy
- **Kiểm soát tốt** từng bước thực hiện
- **Dễ debug** và troubleshoot
- **Bảo mật** tốt hơn với việc kiểm tra từng bước
- **Dễ bảo trì** và cập nhật

Sử dụng modular deployment sẽ giúp bạn có trải nghiệm deploy faucet tốt hơn và an toàn hơn! 