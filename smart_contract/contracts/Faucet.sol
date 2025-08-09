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
 */
contract Faucet is Ownable {
    // Mapping để theo dõi thời gian faucet cuối cùng của mỗi địa chỉ
    mapping(address => uint256) public lastFaucetTime;
    
    // Mapping để lưu trữ thông tin token và số lượng faucet
    mapping(address => uint256) public faucetAmounts;
    
    // Danh sách các token được hỗ trợ
    address[] public supportedTokens;
    
    // Thời gian chờ giữa các lần faucet (24 giờ)
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    // Events
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
        
        // Set số lượng faucet là 0.5 token (với 18 decimals) - cố định cho người dùng
        faucetAmounts[token] = 5 * 10**17; // 0.5 * 10^18
        emit TokenAdded(token, 5 * 10**17);
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
                emit FaucetUsed(msg.sender, token, amount);
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