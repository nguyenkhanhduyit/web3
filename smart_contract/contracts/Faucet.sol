// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Extended is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

/**
 * @title Faucet
 * @dev Contract để phân phối token miễn phí cho người dùng
 * Mỗi địa chỉ chỉ có thể nhận token mỗi 24 giờ
 * Lưu trữ lịch sử sử dụng faucet
 */
contract Faucet is Ownable {
    // ============ STRUCTS ============
    
    /**
     * @dev Cấu trúc lưu trữ lịch sử faucet
     */
    struct FaucetHistory {
        address user;            // Địa chỉ người dùng
        address token;           // Địa chỉ token
        uint256 amount;          // Số lượng token nhận
        uint256 timestamp;       // Thời gian nhận
        uint256 blockNumber;     // Số block
    }
    
    // ============ STATE VARIABLES ============
    
    // Mapping để theo dõi thời gian faucet cuối cùng của mỗi địa chỉ
    mapping(address => uint256) public lastFaucetTime;
    
    // Mapping để lưu trữ thông tin token và số lượng faucet
    mapping(address => uint256) public faucetAmounts;
    
    // Danh sách các token được hỗ trợ
    address[] public supportedTokens;
    
    // Thời gian chờ giữa các lần faucet (24 giờ)
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    // Lịch sử faucet
    FaucetHistory[] public faucetHistory;
    
    // Mapping để theo dõi các faucet của mỗi user
    mapping(address => uint256[]) public userFaucetIndices;
    
    // ============ EVENTS ============
    
    event TokenAdded(address indexed token, uint256 amount);
    event TokenRemoved(address indexed token);
    event FaucetUsed(address indexed user, address indexed token, uint256 amount);
    event FaucetAmountUpdated(address indexed token, uint256 newAmount);
    
    /**
     * @dev Constructor - khởi tạo contract với owner
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Thêm token vào danh sách hỗ trợ faucet
     * @param token Địa chỉ token
     */
    function addToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        
        // Kiểm tra xem token đã tồn tại chưa
        bool exists = false;
        for (uint i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            supportedTokens.push(token);
        }
        
        // Set số lượng faucet là 0.5 token với decimals tương ứng của từng token
        uint8 decimals = IERC20Extended(token).decimals();
        uint256 faucetAmount = 5 * 10**(decimals - 1); // 0.5 * 10^decimals
        faucetAmounts[token] = faucetAmount;
        emit TokenAdded(token, faucetAmount);
    }
    
    /**
     * @dev Xóa token khỏi danh sách faucet
     * @param token Địa chỉ token
     */
    function removeToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        
        // Xóa token khỏi danh sách
        for (uint i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }
        
        delete faucetAmounts[token];
        emit TokenRemoved(token);
    }
    
    /**
     * @dev Cập nhật số lượng faucet cho token (chỉ owner có thể thay đổi)
     * @param token Địa chỉ token
     * @param newAmount Số lượng mới (người dùng sẽ nhận được 0.5 token mỗi lần)
     */
    function updateFaucetAmount(address token, uint256 newAmount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(faucetAmounts[token] > 0, "Token not in faucet list");
        require(newAmount > 0, "Amount must be greater than 0");
        
        faucetAmounts[token] = newAmount;
        emit FaucetAmountUpdated(token, newAmount);
    }
    
    /**
     * @dev Người dùng nhận token từ faucet
     * @param token Địa chỉ token muốn nhận
     */
    function requestFaucet(address token) external {
        require(token != address(0), "Invalid token address");
        require(faucetAmounts[token] > 0, "Token not available in faucet");
        
        // Kiểm tra thời gian chờ
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + FAUCET_COOLDOWN,
            "Must wait 24 hours between faucet requests"
        );
        
        // Cập nhật thời gian faucet cuối cùng
        lastFaucetTime[msg.sender] = block.timestamp;
        
        // Chuyển token cho người dùng
        uint256 amount = faucetAmounts[token];
        IERC20(token).transfer(msg.sender, amount);
        
        // Lưu lịch sử faucet
        _recordFaucetHistory(msg.sender, token, amount);
        
        emit FaucetUsed(msg.sender, token, amount);
    }
    
    /**
     * @dev Nhận tất cả token có sẵn từ faucet
     */
    function requestAllFaucets() external {
        require(supportedTokens.length > 0, "No tokens available");
        
        // Kiểm tra thời gian chờ
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + FAUCET_COOLDOWN,
            "Must wait 24 hours between faucet requests"
        );
        
        // Cập nhật thời gian faucet cuối cùng
        lastFaucetTime[msg.sender] = block.timestamp;
        
        // Chuyển tất cả token có sẵn
        for (uint i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 amount = faucetAmounts[token];
            
            if (amount > 0) {
                IERC20(token).transfer(msg.sender, amount);
                // Lưu lịch sử faucet cho từng token
                _recordFaucetHistory(msg.sender, token, amount);
            }
        }
    }
    
    /**
     * @dev Kiểm tra thời gian còn lại trước khi có thể faucet lại
     * @param user Địa chỉ người dùng
     * @return Thời gian còn lại (giây)
     */
    function getTimeUntilNextFaucet(address user) external view returns (uint256) {
        uint256 lastTime = lastFaucetTime[user];
        if (lastTime == 0) {
            return 0; // Chưa bao giờ faucet
        }
        
        uint256 nextFaucetTime = lastTime + FAUCET_COOLDOWN;
        if (block.timestamp >= nextFaucetTime) {
            return 0; // Có thể faucet ngay
        }
        
        return nextFaucetTime - block.timestamp;
    }
    
    /**
     * @dev Lấy danh sách tất cả token được hỗ trợ
     * @return Danh sách địa chỉ token
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    /**
     * @dev Lưu lịch sử faucet
     * @param user Địa chỉ người dùng
     * @param token Địa chỉ token
     * @param amount Số lượng token nhận
     */
    function _recordFaucetHistory(
        address user,
        address token,
        uint256 amount
    ) internal {
        FaucetHistory memory newFaucet = FaucetHistory({
            user: user,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        faucetHistory.push(newFaucet);
        userFaucetIndices[user].push(faucetHistory.length - 1);
    }
    
    /**
     * @dev Lấy thông tin chi tiết về token trong faucet
     * @param token Địa chỉ token
     * @return amount Số lượng faucet
     * @return symbol Ký hiệu token
     * @return name Tên token
     */
    function getTokenInfo(address token) external view returns (uint256 amount, string memory symbol, string memory name) {
        amount = faucetAmounts[token];
        
        // Thử lấy thông tin token (có thể fail nếu token không có interface chuẩn)
        try IERC20Extended(token).symbol() returns (string memory s) {
            symbol = s;
        } catch {
            symbol = "UNKNOWN";
        }
        
        try IERC20Extended(token).name() returns (string memory n) {
            name = n;
        } catch {
            name = "Unknown Token";
        }
    }
    
    // ============ FAUCET HISTORY FUNCTIONS ============
    
    /**
     * @dev Lấy tổng số giao dịch faucet
     * @return Tổng số giao dịch faucet
     */
    function getTotalFaucetCount() external view returns (uint256) {
        return faucetHistory.length;
    }
    
    /**
     * @dev Lấy số giao dịch faucet của một user
     * @param user Địa chỉ user
     * @return Số giao dịch faucet của user
     */
    function getUserFaucetCount(address user) external view returns (uint256) {
        return userFaucetIndices[user].length;
    }
    
    /**
     * @dev Lấy lịch sử faucet của một user
     * @param user Địa chỉ user
     * @param start Index bắt đầu
     * @param count Số lượng giao dịch muốn lấy
     * @return Lịch sử faucet của user
     */
    function getUserFaucetHistory(
        address user,
        uint256 start,
        uint256 count
    ) external view returns (FaucetHistory[] memory) {
        uint256[] storage userIndices = userFaucetIndices[user];
        uint256 totalUserFaucets = userIndices.length;
        
        require(start < totalUserFaucets, "Start index out of bounds");
        
        uint256 end = start + count;
        if (end > totalUserFaucets) {
            end = totalUserFaucets;
        }
        
        uint256 size = end - start;
        FaucetHistory[] memory result = new FaucetHistory[](size);
        
        for (uint256 i = 0; i < size; i++) {
            uint256 faucetIndex = userIndices[start + i];
            result[i] = faucetHistory[faucetIndex];
        }
        
        return result;
    }
    
    /**
     * @dev Lấy tất cả lịch sử faucet của một user
     * @param user Địa chỉ user
     * @return Tất cả lịch sử faucet của user
     */
    function getAllUserFaucetHistory(address user) external view returns (FaucetHistory[] memory) {
        uint256[] storage userIndices = userFaucetIndices[user];
        uint256 totalUserFaucets = userIndices.length;
        
        FaucetHistory[] memory result = new FaucetHistory[](totalUserFaucets);
        
        for (uint256 i = 0; i < totalUserFaucets; i++) {
            uint256 faucetIndex = userIndices[i];
            result[i] = faucetHistory[faucetIndex];
        }
        
        return result;
    }
    
    /**
     * @dev Lấy thông tin chi tiết của một giao dịch faucet
     * @param faucetIndex Index của giao dịch faucet
     * @return Thông tin chi tiết của giao dịch faucet
     */
    function getFaucetDetails(uint256 faucetIndex) external view returns (FaucetHistory memory) {
        require(faucetIndex < faucetHistory.length, "Faucet index out of bounds");
        return faucetHistory[faucetIndex];
    }
    
    /**
     * @dev Owner có thể rút token khỏi contract (trường hợp khẩn cấp)
     * @param token Địa chỉ token
     * @param amount Số lượng rút
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transfer(owner(), amount);
    }
    

} 