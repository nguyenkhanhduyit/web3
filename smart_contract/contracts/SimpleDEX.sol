// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleDEX
 * @dev Một Decentralized Exchange đơn giản với các tính năng cơ bản:
 * - Thêm/rút thanh khoản (liquidity)
 * - Swap token
 * - Quản lý pool
 * 
 * Sử dụng công thức Constant Product (x * y = k) để tính toán giá
 */
contract SimpleDEX {
    // ============ STRUCTS ============
    
    /**
     * @dev Cấu trúc Pool chứa thông tin về một cặp token
     */
    struct Pool {
        uint256 reserve0;        // Số lượng token0 trong pool
        uint256 reserve1;        // Số lượng token1 trong pool
        uint256 totalSupply;     // Tổng số LP token đã phát hành
        mapping(address => uint256) balance; // Số LP token của mỗi người dùng
    }
    
    // ============ STATE VARIABLES ============
    
    // Mapping từ cặp token đến pool tương ứng
    mapping(address => mapping(address => Pool)) public pools;
    
    // Fee cho mỗi giao dịch swap (0.3% = 3/1000)
    uint256 public constant SWAP_FEE = 3;
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // ============ EVENTS ============
    
    /**
     * @dev Event được emit khi có người thêm thanh khoản
     */
    event LiquidityAdded(
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity,
        address indexed provider
    );
    
    /**
     * @dev Event được emit khi có người rút thanh khoản
     */
    event LiquidityRemoved(
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity,
        address indexed provider
    );
    
    /**
     * @dev Event được emit khi có giao dịch swap
     */
    event Swap(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed trader
    );
    
    // ============ LIQUIDITY FUNCTIONS ============
    
    /**
     * @dev Thêm thanh khoản vào pool
     * @param token0 Địa chỉ token thứ nhất
     * @param token1 Địa chỉ token thứ hai
     * @param amount0Desired Số lượng token0 muốn thêm
     * @param amount1Desired Số lượng token1 muốn thêm
     * @return liquidity Số LP token nhận được
     */
    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 liquidity) {
        // Kiểm tra input
        require(token0 != token1, "IDENTICAL_ADDRESSES");
        require(amount0Desired > 0 && amount1Desired > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Sắp xếp token theo thứ tự địa chỉ để đảm bảo tính nhất quán
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        (uint256 amountA, uint256 amountB) = token0 < token1 ? (amount0Desired, amount1Desired) : (amount1Desired, amount0Desired);
        
        Pool storage pool = pools[tokenA][tokenB];
        
        // Chuyển token từ người dùng vào contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Tính toán số LP token sẽ nhận
        if (pool.totalSupply == 0) {
            // Người thêm thanh khoản đầu tiên
            liquidity = sqrt(amountA * amountB);
        } else {
            // Người thêm thanh khoản tiếp theo
            uint256 liquidityA = (amountA * pool.totalSupply) / pool.reserve0;
            uint256 liquidityB = (amountB * pool.totalSupply) / pool.reserve1;
            liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
        }
        
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");
        
        // Cập nhật trạng thái pool
        pool.reserve0 += amountA;
        pool.reserve1 += amountB;
        pool.totalSupply += liquidity;
        pool.balance[msg.sender] += liquidity;
        
        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity, msg.sender);
    }
    
    /**
     * @dev Rút thanh khoản khỏi pool
     * @param token0 Địa chỉ token thứ nhất
     * @param token1 Địa chỉ token thứ hai
     * @param liquidity Số LP token muốn rút
     * @return amount0 Số token0 nhận được
     * @return amount1 Số token1 nhận được
     */
    function removeLiquidity(
        address token0,
        address token1,
        uint256 liquidity
    ) external returns (uint256 amount0, uint256 amount1) {
        // Kiểm tra input
        require(token0 != token1, "IDENTICAL_ADDRESSES");
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_BURNED");
        
        // Sắp xếp token
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.balance[msg.sender] >= liquidity, "INSUFFICIENT_LIQUIDITY_BALANCE");
        
        // Tính toán số token sẽ nhận
        amount0 = (liquidity * pool.reserve0) / pool.totalSupply;
        amount1 = (liquidity * pool.reserve1) / pool.totalSupply;
        
        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_LIQUIDITY_BURNED");
        
        // Cập nhật trạng thái pool
        pool.balance[msg.sender] -= liquidity;
        pool.totalSupply -= liquidity;
        pool.reserve0 -= amount0;
        pool.reserve1 -= amount1;
        
        // Chuyển token cho người dùng
        IERC20(tokenA).transfer(msg.sender, amount0);
        IERC20(tokenB).transfer(msg.sender, amount1);
        
        emit LiquidityRemoved(tokenA, tokenB, amount0, amount1, liquidity, msg.sender);
    }
    
    // ============ SWAP FUNCTIONS ============
    
    /**
     * @dev Swap token với số lượng input cố định
     * @param tokenIn Địa chỉ token muốn bán
     * @param tokenOut Địa chỉ token muốn mua
     * @param amountIn Số lượng token muốn bán
     * @return amountOut Số lượng token nhận được
     */
    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "IDENTICAL_ADDRESSES");
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Sắp xếp token
        (address tokenA, address tokenB) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "INSUFFICIENT_LIQUIDITY");
        
        // Chuyển token từ người dùng vào contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Tính toán số token output
        amountOut = _getAmountOut(amountIn, tokenIn, tokenOut, pool);
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Cập nhật reserves
        _updateReserves(amountIn, amountOut, tokenIn, tokenOut, pool);
        
        // Chuyển token cho người dùng
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit Swap(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }
    
    /**
     * @dev Swap token với số lượng output cố định
     * @param tokenIn Địa chỉ token muốn bán
     * @param tokenOut Địa chỉ token muốn mua
     * @param amountOut Số lượng token muốn nhận
     * @return amountIn Số lượng token cần bán
     */
    function swapTokensForExactTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountOut
    ) external returns (uint256 amountIn) {
        require(tokenIn != tokenOut, "IDENTICAL_ADDRESSES");
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Sắp xếp token
        (address tokenA, address tokenB) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "INSUFFICIENT_LIQUIDITY");
        
        // Tính toán số token input cần thiết
        amountIn = _getAmountIn(amountOut, tokenIn, tokenOut, pool);
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Chuyển token từ người dùng vào contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Cập nhật reserves
        _updateReserves(amountIn, amountOut, tokenIn, tokenOut, pool);
        
        // Chuyển token cho người dùng
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit Swap(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }
    
    /**
     * @dev Tính toán số token output cho một giao dịch swap
     * @param amountIn Số token input
     * @param tokenIn Token input
     * @param tokenOut Token output
     * @param pool Pool tương ứng
     * @return Số token output
     */
    function _getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        Pool storage pool
    ) internal view returns (uint256) {
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - SWAP_FEE);
        uint256 numerator = amountInWithFee * (tokenIn < tokenOut ? pool.reserve1 : pool.reserve0);
        uint256 denominator = (tokenIn < tokenOut ? pool.reserve0 : pool.reserve1) * FEE_DENOMINATOR + amountInWithFee;
        return numerator / denominator;
    }
    
    /**
     * @dev Tính toán số token input cần thiết cho một giao dịch swap
     * @param amountOut Số token output
     * @param tokenIn Token input
     * @param tokenOut Token output
     * @param pool Pool tương ứng
     * @return Số token input
     */
    function _getAmountIn(
        uint256 amountOut,
        address tokenIn,
        address tokenOut,
        Pool storage pool
    ) internal view returns (uint256) {
        uint256 numerator = (tokenIn < tokenOut ? pool.reserve0 : pool.reserve1) * amountOut * FEE_DENOMINATOR;
        uint256 denominator = (tokenIn < tokenOut ? pool.reserve1 : pool.reserve0) * (FEE_DENOMINATOR - SWAP_FEE);
        return (numerator / denominator) + 1; // +1 để tránh rounding errors
    }
    
    /**
     * @dev Cập nhật reserves sau khi swap
     * @param amountIn Số token input
     * @param amountOut Số token output
     * @param tokenIn Token input
     * @param tokenOut Token output
     * @param pool Pool tương ứng
     */
    function _updateReserves(
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut,
        Pool storage pool
    ) internal {
        if (tokenIn < tokenOut) {
            pool.reserve0 += amountIn;
            pool.reserve1 -= amountOut;
        } else {
            pool.reserve0 -= amountOut;
            pool.reserve1 += amountIn;
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Lấy tổng thanh khoản của một pool
     * @param token0 Token thứ nhất
     * @param token1 Token thứ hai
     * @return Tổng số LP token
     */
    function getLiquidity(address token0, address token1) external view returns (uint256) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        return pools[tokenA][tokenB].totalSupply;
    }
    
    /**
     * @dev Lấy reserves của một pool
     * @param token0 Token thứ nhất
     * @param token1 Token thứ hai
     * @return reserve0 Số token0 trong pool
     * @return reserve1 Số token1 trong pool
     */
    function getReserves(address token0, address token1) external view returns (uint256 reserve0, uint256 reserve1) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        Pool storage pool = pools[tokenA][tokenB];
        return (pool.reserve0, pool.reserve1);
    }
    
    /**
     * @dev Lấy số LP token của một người dùng trong pool
     * @param token0 Token thứ nhất
     * @param token1 Token thứ hai
     * @param user Địa chỉ người dùng
     * @return Số LP token
     */
    function getBalance(address token0, address token1, address user) external view returns (uint256) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        return pools[tokenA][tokenB].balance[user];
    }
    
    /**
     * @dev Tính toán giá của một token theo token khác
     * @param token0 Token cơ sở
     * @param token1 Token định giá
     * @return Giá token1 theo token0
     */
    function getPrice(address token0, address token1) external view returns (uint256) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        Pool storage pool = pools[tokenA][tokenB];
        
        if (pool.reserve0 == 0 || pool.reserve1 == 0) {
            return 0;
        }
        
        if (token0 < token1) {
            return (pool.reserve1 * 1e18) / pool.reserve0; // Giá token1 theo token0
        } else {
            return (pool.reserve0 * 1e18) / pool.reserve1; // Giá token0 theo token1
        }
    }
    
    /**
     * @dev Ước lượng số lượng token sẽ nhận được khi swap với số lượng input cố định
     * @param tokenIn Địa chỉ token muốn bán
     * @param tokenOut Địa chỉ token muốn mua
     * @param amountIn Số lượng token muốn bán
     * @return amountOut Số lượng token sẽ nhận được
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "IDENTICAL_ADDRESSES");
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Sắp xếp token
        (address tokenA, address tokenB) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "INSUFFICIENT_LIQUIDITY");
        
        amountOut = _getAmountOut(amountIn, tokenIn, tokenOut, pool);
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        return amountOut;
    }
    
    /**
     * @dev Ước lượng số lượng token cần bán để nhận được số lượng output cố định
     * @param tokenIn Địa chỉ token muốn bán
     * @param tokenOut Địa chỉ token muốn mua
     * @param amountOut Số lượng token muốn nhận
     * @return amountIn Số lượng token cần bán
     */
    function getAmountIn(
        address tokenIn,
        address tokenOut,
        uint256 amountOut
    ) external view returns (uint256 amountIn) {
        require(tokenIn != tokenOut, "IDENTICAL_ADDRESSES");
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Sắp xếp token
        (address tokenA, address tokenB) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "INSUFFICIENT_LIQUIDITY");
        
        amountIn = _getAmountIn(amountOut, tokenIn, tokenOut, pool);
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        return amountIn;
    }
    
    /**
     * @dev Lấy thông tin chi tiết về một pool
     * @param token0 Token thứ nhất
     * @param token1 Token thứ hai
     * @return reserve0 Số token0 trong pool
     * @return reserve1 Số token1 trong pool
     * @return totalSupply Tổng số LP token
     * @return price0to1 Giá token1 theo token0
     * @return price1to0 Giá token0 theo token1
     */
    function getPoolInfo(address token0, address token1) external view returns (
        uint256 reserve0,
        uint256 reserve1,
        uint256 totalSupply,
        uint256 price0to1,
        uint256 price1to0
    ) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        Pool storage pool = pools[tokenA][tokenB];
        
        reserve0 = pool.reserve0;
        reserve1 = pool.reserve1;
        totalSupply = pool.totalSupply;
        
        if (reserve0 > 0 && reserve1 > 0) {
            price0to1 = (reserve1 * 1e18) / reserve0; // Giá token1 theo token0
            price1to0 = (reserve0 * 1e18) / reserve1; // Giá token0 theo token1
        } else {
            price0to1 = 0;
            price1to0 = 0;
        }
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Tính căn bậc hai của một số
     * @param y Số cần tính căn
     * @return z Căn bậc hai
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    // ============ BACKWARD COMPATIBILITY ============
    
    /**
     * @dev Function cũ để tương thích ngược
     * Sử dụng swapExactTokensForTokens thay thế
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "IDENTICAL_ADDRESSES");
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Sắp xếp token
        (address tokenA, address tokenB) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "INSUFFICIENT_LIQUIDITY");
        
        // Chuyển token từ người dùng vào contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Tính toán số token output
        amountOut = _getAmountOut(amountIn, tokenIn, tokenOut, pool);
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Cập nhật reserves
        _updateReserves(amountIn, amountOut, tokenIn, tokenOut, pool);
        
        // Chuyển token cho người dùng
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit Swap(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }
} 