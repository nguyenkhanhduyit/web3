# 🧪 Hướng dẫn sử dụng các file test DEX Features

## 📋 Tổng quan

Các file test DEX features đã được tách thành các tính năng đơn lẻ để dễ sử dụng và bảo trì. Mỗi file có comment tiếng Việt chi tiết giải thích từng dòng code.

## 📁 Danh sách các file test

### 🔍 `05a-test-initial-state.ts`
**Chức năng:** Kiểm tra trạng thái ban đầu của SimpleDEX
- Kiểm tra reserves (dự trữ) của pool
- Kiểm tra tổng thanh khoản
- Kiểm tra thanh khoản của người dùng
- Kiểm tra số dư token của người dùng
- Lưu kết quả vào `info/InitialStateTest.json`

**Chạy lệnh:**
```bash
npx hardhat run scripts/05a-test-initial-state.ts --network sepolia
```

### ➕ `05b-test-add-liquidity.ts`
**Chức năng:** Test thêm thanh khoản vào SimpleDEX
- Phê duyệt token để SimpleDEX có thể sử dụng
- Thêm thanh khoản mới vào pool
- Kiểm tra trạng thái sau khi thêm
- Lưu kết quả vào `info/AddLiquidityTest.json`

**Chạy lệnh:**
```bash
npx hardhat run scripts/05b-test-add-liquidity.ts --network sepolia
```

### 🔄 `05c-test-swap-token1-to-token2.ts`
**Chức năng:** Test swap token từ token1 sang token2
- Phê duyệt token1 để SimpleDEX có thể swap
- Thực hiện swap token1 → token2
- Kiểm tra reserves sau khi swap
- Tính toán tỷ giá swap thực tế
- Lưu kết quả vào `info/SwapToken1ToToken2Test.json`

**Chạy lệnh:**
```bash
npx hardhat run scripts/05c-test-swap-token1-to-token2.ts --network sepolia
```

### 🔄 `05d-test-swap-token2-to-token1.ts`
**Chức năng:** Test swap token từ token2 sang token1
- Phê duyệt token2 để SimpleDEX có thể swap
- Thực hiện swap token2 → token1
- Kiểm tra reserves sau khi swap
- Tính toán tỷ giá swap thực tế
- Lưu kết quả vào `info/SwapToken2ToToken1Test.json`

**Chạy lệnh:**
```bash
npx hardhat run scripts/05d-test-swap-token2-to-token1.ts --network sepolia
```

### ➖ `05e-test-remove-liquidity.ts`
**Chức năng:** Test rút thanh khoản từ SimpleDEX
- Kiểm tra thanh khoản hiện tại của người dùng
- Rút một phần thanh khoản
- Kiểm tra trạng thái sau khi rút
- Tính toán số lượng token sẽ nhận được
- Lưu kết quả vào `info/RemoveLiquidityTest.json`

**Chạy lệnh:**
```bash
npx hardhat run scripts/05e-test-remove-liquidity.ts --network sepolia
```

### 🧪 `05f-test-all-dex-features.ts`
**Chức năng:** Test tổng hợp tất cả tính năng của SimpleDEX
- Test trạng thái ban đầu
- Test thêm thanh khoản
- Test swap token1 → token2
- Test swap token2 → token1
- Test rút thanh khoản
- Lưu kết quả tổng hợp vào `info/AllDEXFeaturesTest.json`

**Chạy lệnh:**
```bash
npx hardhat run scripts/05f-test-all-dex-features.ts --network sepolia
```

## 🚀 Cách sử dụng

### 1. Chạy từng test riêng lẻ
```bash
# Test trạng thái ban đầu
npx hardhat run scripts/05a-test-initial-state.ts --network sepolia

# Test thêm thanh khoản
npx hardhat run scripts/05b-test-add-liquidity.ts --network sepolia

# Test swap token1 → token2
npx hardhat run scripts/05c-test-swap-token1-to-token2.ts --network sepolia

# Test swap token2 → token1
npx hardhat run scripts/05d-test-swap-token2-to-token1.ts --network sepolia

# Test rút thanh khoản
npx hardhat run scripts/05e-test-remove-liquidity.ts --network sepolia
```

### 2. Chạy test tổng hợp
```bash
# Test tất cả tính năng
npx hardhat run scripts/05f-test-all-dex-features.ts --network sepolia
```

### 3. Chạy qua script master
```bash
# Deploy và test toàn bộ hệ thống
npx hardhat run scripts/00-deploy-everything.ts --network sepolia
```

## 📊 Kết quả test

### File JSON được tạo ra:
- `info/InitialStateTest.json` - Kết quả test trạng thái ban đầu
- `info/AddLiquidityTest.json` - Kết quả test thêm thanh khoản
- `info/SwapToken1ToToken2Test.json` - Kết quả test swap token1 → token2
- `info/SwapToken2ToToken1Test.json` - Kết quả test swap token2 → token1
- `info/RemoveLiquidityTest.json` - Kết quả test rút thanh khoản
- `info/AllDEXFeaturesTest.json` - Kết quả test tổng hợp

### Cấu trúc kết quả:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "testType": "test_type",
  "testResults": {
    "testName": {
      "status": "passed|failed|skipped",
      "transactionHash": "0x...",
      "gasUsed": "123456",
      "details": {
        // Chi tiết kết quả test
      }
    }
  }
}
```

## 🔧 Tính năng đặc biệt

### 1. Comment tiếng Việt chi tiết
Mỗi file đều có comment tiếng Việt giải thích:
- Chức năng của từng dòng code
- Ý nghĩa của các biến
- Mục đích của từng bước thực hiện

### 2. Xử lý lỗi toàn diện
- Try-catch cho tất cả các operation
- Hiển thị thông tin lỗi chi tiết
- Lưu trạng thái lỗi vào file JSON

### 3. Tính toán và so sánh
- Ước tính kết quả trước khi thực hiện
- So sánh kết quả thực tế với ước tính
- Tính toán tỷ giá swap thực tế

### 4. Báo cáo chi tiết
- Hiển thị thông tin trước và sau mỗi operation
- Tính toán thay đổi số dư
- Tổng kết kết quả test

## 📈 Thứ tự thực hiện khuyến nghị

1. **05a-test-initial-state.ts** - Kiểm tra trạng thái ban đầu
2. **05b-test-add-liquidity.ts** - Thêm thanh khoản
3. **05c-test-swap-token1-to-token2.ts** - Test swap một chiều
4. **05d-test-swap-token2-to-token1.ts** - Test swap chiều ngược
5. **05e-test-remove-liquidity.ts** - Rút thanh khoản
6. **05f-test-all-dex-features.ts** - Test tổng hợp (tùy chọn)

## ⚠️ Lưu ý quan trọng

1. **Đảm bảo đã deploy tokens và SimpleDEX** trước khi chạy test
2. **Kiểm tra số dư token** đủ để thực hiện các test
3. **Theo dõi gas fee** khi chạy trên mạng thật
4. **Backup private key** trước khi test trên mainnet
5. **Kiểm tra kết quả JSON** để đảm bảo test thành công

## 🛠️ Troubleshooting

### Lỗi thường gặp:
1. **"No liquidity to remove"** - Chưa có thanh khoản để rút
2. **"Insufficient balance"** - Số dư token không đủ
3. **"Transaction failed"** - Gas limit quá thấp hoặc lỗi contract

### Giải pháp:
1. Chạy lại script thêm thanh khoản
2. Kiểm tra số dư token
3. Tăng gas limit trong script
4. Kiểm tra lỗi contract

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra log lỗi trong console
2. Xem file JSON kết quả để biết chi tiết
3. Đảm bảo đã chạy đúng thứ tự các script
4. Kiểm tra cấu hình network và private key 