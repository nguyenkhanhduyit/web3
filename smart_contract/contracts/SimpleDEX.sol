//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDEX {
    struct Pool {
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;
        mapping(address => uint256) balance;
    }
    
    mapping(address => mapping(address => Pool)) public pools;
    
    event LiquidityAdded(
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity,
        address indexed provider
    );
    
    event Swap(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed trader
    );
    
    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 liquidity) {
        require(token0 != token1, "IDENTICAL_ADDRESSES");
        require(amount0Desired > 0 && amount1Desired > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Sort tokens
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        (uint256 amountA, uint256 amountB) = token0 < token1 ? (amount0Desired, amount1Desired) : (amount1Desired, amount0Desired);
        
        Pool storage pool = pools[tokenA][tokenB];
        
        // Transfer tokens from user
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Calculate liquidity
        if (pool.totalSupply == 0) {
            // First liquidity provider
            liquidity = sqrt(amountA * amountB);
        } else {
            // Subsequent liquidity providers
            uint256 liquidityA = (amountA * pool.totalSupply) / pool.reserve0;
            uint256 liquidityB = (amountB * pool.totalSupply) / pool.reserve1;
            liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
        }
        
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");
        
        // Update reserves
        pool.reserve0 += amountA;
        pool.reserve1 += amountB;
        pool.totalSupply += liquidity;
        pool.balance[msg.sender] += liquidity;
        
        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity, msg.sender);
    }
    
    function removeLiquidity(
        address token0,
        address token1,
        uint256 liquidity
    ) external returns (uint256 amount0, uint256 amount1) {
        require(token0 != token1, "IDENTICAL_ADDRESSES");
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_BURNED");
        
        // Sort tokens
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.balance[msg.sender] >= liquidity, "INSUFFICIENT_LIQUIDITY_BALANCE");
        
        // Calculate amounts
        amount0 = (liquidity * pool.reserve0) / pool.totalSupply;
        amount1 = (liquidity * pool.reserve1) / pool.totalSupply;
        
        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_LIQUIDITY_BURNED");
        
        // Update state
        pool.balance[msg.sender] -= liquidity;
        pool.totalSupply -= liquidity;
        pool.reserve0 -= amount0;
        pool.reserve1 -= amount1;
        
        // Transfer tokens to user
        IERC20(tokenA).transfer(msg.sender, amount0);
        IERC20(tokenB).transfer(msg.sender, amount1);
    }
    
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "IDENTICAL_ADDRESSES");
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        
        // Sort tokens
        (address tokenA, address tokenB) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "INSUFFICIENT_LIQUIDITY");
        
        // Transfer tokens from user
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Calculate output amount (constant product formula)
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * (tokenIn < tokenOut ? pool.reserve1 : pool.reserve0);
        uint256 denominator = (tokenIn < tokenOut ? pool.reserve0 : pool.reserve1) * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Update reserves
        if (tokenIn < tokenOut) {
            pool.reserve0 += amountIn;
            pool.reserve1 -= amountOut;
        } else {
            pool.reserve0 -= amountOut;
            pool.reserve1 += amountIn;
        }
        
        // Transfer tokens to user
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit Swap(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }
    
    function getLiquidity(address token0, address token1) external view returns (uint256) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        return pools[tokenA][tokenB].totalSupply;
    }
    
    function getReserves(address token0, address token1) external view returns (uint256 reserve0, uint256 reserve1) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        Pool storage pool = pools[tokenA][tokenB];
        return (pool.reserve0, pool.reserve1);
    }
    
    function getBalance(address token0, address token1, address user) external view returns (uint256) {
        (address tokenA, address tokenB) = token0 < token1 ? (token0, token1) : (token1, token0);
        return pools[tokenA][tokenB].balance[user];
    }
    
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
} 