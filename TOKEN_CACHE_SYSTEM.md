# Hệ thống Cache Token

## Tổng quan
Hệ thống đã được cải tiến để sử dụng cache cho việc quản lý dữ liệu token, giúp tăng hiệu suất và giảm số lượng API calls.

## Các thay đổi chính

### 1. Backend API mới
- **Endpoint**: `GET /api/tokens/all`
- **Chức năng**: Fetch top 200 token theo market cap từ CoinMarketCap (giới hạn để tránh URL quá dài)
- **Response**: Cache object chứa thông tin chi tiết của tất cả token
- **Error Handling**: Có logging chi tiết và error handling tốt hơn

### 2. Frontend Cache System
- **Cache Storage**: localStorage với key `allTokensCache`
- **Cấu trúc cache**:
  ```javascript
  {
    data: {
      "bitcoin": { /* token data */ },
      "ethereum": { /* token data */ },
      // ... tất cả token
    },
    timestamp: "2024-01-01T00:00:00.000Z",
    lastUpdated: "2024-01-01T00:00:00.000Z"
  }
  ```

### 3. Các hàm mới trong ModalMarket.jsx

#### `fetchAllTokens()`
- Fetch tất cả token từ backend
- Lưu vào localStorage với timestamp
- Không nhận tham số

#### `getTokenFromCache(symbol)`
- Lấy token từ cache theo symbol hoặc name
- Trả về null nếu không tìm thấy

#### `searchTokensInCache(query)`
- Tìm kiếm token trong cache theo symbol hoặc name
- Trả về tối đa 10 kết quả

### 4. Logic hoạt động

#### Khởi tạo
1. Component mount → kiểm tra cache
2. Nếu cache không tồn tại hoặc quá cũ (>1 phút) → fetch mới
3. Load hot tokens từ cache

#### Cập nhật tự động
- Cache được cập nhật mỗi 1 phút
- Cập nhật ngầm (background)
- UI tự động refresh nếu đang hiển thị hot tokens

#### Tìm kiếm
- Tìm kiếm ngay lập tức trong cache
- Không gọi API cho mỗi lần search
- Kết quả được lưu vào recent searches

### 5. Hot Tokens
Danh sách hot tokens được định nghĩa:
```javascript
const hotToken = ['Bitcoin', 'Ethereum', 'BNB', 'Solana', 'USDT'];
```

### 6. Recent Searches
- Lưu tối đa 3 tìm kiếm gần đây
- Lưu trong localStorage với key `recentSearches`
- Tự động load khi component mount

## Lợi ích

1. **Hiệu suất cao**: Không cần gọi API cho mỗi lần tìm kiếm
2. **Giảm API calls**: Chỉ gọi API mỗi phút thay vì mỗi lần search
3. **Trải nghiệm người dùng tốt hơn**: Tìm kiếm nhanh, không delay
4. **Tiết kiệm bandwidth**: Dữ liệu được cache locally
5. **Offline support**: Có thể hiển thị dữ liệu từ cache khi offline

## Cách sử dụng

1. **Khởi động app**: Cache sẽ tự động được tạo
2. **Tìm kiếm**: Gõ vào ô search, kết quả hiển thị ngay lập tức
3. **Recent searches**: Click vào token đã tìm kiếm trước đó
4. **Hot tokens**: Luôn hiển thị top 5 token trending

## Monitoring

- Console logs hiển thị quá trình cache:
  - "Fetching fresh token data..."
  - "Using cached token data"
  - "Updating token cache..."
  - "Cached X tokens"
