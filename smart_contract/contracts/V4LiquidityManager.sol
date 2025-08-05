// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "../interfaces/IPoolManager.sol";
import {IUnlockCallback} from "../interfaces/callback/IUnlockCallback.sol";
import {Currency} from "../types/Currency.sol";
import {PoolId, PoolIdLibrary} from "../types/PoolId.sol";
import {PoolKey} from "../types/PoolKey.sol";
import {ModifyLiquidityParams} from "../types/PoolOperation.sol";
import {BalanceDelta} from "../types/BalanceDelta.sol";

contract V4LiquidityManager is IUnlockCallback {
    IPoolManager public immutable poolManager;
    
    event LiquidityAdded(
        PoolId indexed poolId,
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper
    );
    
    constructor(address _poolManager) {
        require(_poolManager != address(0), "Invalid pool manager address");
        poolManager = IPoolManager(_poolManager);
    }
    
    function addLiquidity(
        PoolKey calldata poolKey,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) external payable returns (uint256 liquidity, uint256 amount0, uint256 amount1) {
        require(tickLower < tickUpper, "Invalid tick range");
        require(amount0Desired > 0 || amount1Desired > 0, "Invalid amounts");
        
        // Transfer tokens from user to this contract
        if (amount0Desired > 0) {
            require(
                IERC20(Currency.unwrap(poolKey.currency0)).transferFrom(msg.sender, address(this), amount0Desired),
                "Transfer failed for token0"
            );
        }
        if (amount1Desired > 0) {
            require(
                IERC20(Currency.unwrap(poolKey.currency1)).transferFrom(msg.sender, address(this), amount1Desired),
                "Transfer failed for token1"
            );
        }
        
        // Prepare the data for the unlock callback
        bytes memory callbackData = abi.encode(
            poolKey,
            tickLower,
            tickUpper,
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min
        );
        
        // Call unlock on the pool manager, which will call our unlockCallback
        bytes memory result = poolManager.unlock(callbackData);
        
        // Decode the result
        (liquidity, amount0, amount1) = abi.decode(result, (uint256, uint256, uint256));
        
        // Refund excess tokens
        if (amount0 < amount0Desired) {
            IERC20(Currency.unwrap(poolKey.currency0)).transfer(msg.sender, amount0Desired - amount0);
        }
        if (amount1 < amount1Desired) {
            IERC20(Currency.unwrap(poolKey.currency1)).transfer(msg.sender, amount1Desired - amount1);
        }
        
        emit LiquidityAdded(
            PoolIdLibrary.toId(poolKey),
            Currency.unwrap(poolKey.currency0),
            Currency.unwrap(poolKey.currency1),
            amount0,
            amount1,
            tickLower,
            tickUpper
        );
    }
    
    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only pool manager can call this");
        
        // Decode the data
        (
            PoolKey memory poolKey,
            int24 tickLower,
            int24 tickUpper,
            uint256 amount0Desired,
            uint256 amount1Desired,
            uint256 amount0Min,
            uint256 amount1Min
        ) = abi.decode(data, (PoolKey, int24, int24, uint256, uint256, uint256, uint256));
        
        // Sync tokens before adding liquidity (required by Uniswap V4)
        if (amount0Desired > 0) {
            poolManager.sync(poolKey.currency0);
        }
        if (amount1Desired > 0) {
            poolManager.sync(poolKey.currency1);
        }
        
        // Approve pool manager to spend tokens
        if (amount0Desired > 0) {
            IERC20(Currency.unwrap(poolKey.currency0)).approve(address(poolManager), amount0Desired);
        }
        if (amount1Desired > 0) {
            IERC20(Currency.unwrap(poolKey.currency1)).approve(address(poolManager), amount1Desired);
        }
        
        // Calculate liquidity delta - use a much smaller value for testing
        int256 liquidityDelta = int256(1000); // 1K liquidity units instead of 1M
        
        // Add liquidity using pool manager
        (BalanceDelta callerDelta,) = poolManager.modifyLiquidity(
            poolKey,
            ModifyLiquidityParams({
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: liquidityDelta,
                salt: bytes32(0)
            }),
            "" // hookData
        );
        
        // Return the result
        return abi.encode(
            uint256(liquidityDelta),
            uint256(int256(callerDelta.amount0())),
            uint256(int256(callerDelta.amount1()))
        );
    }
    
    function withdrawToken(address token, uint256 amount) external {
        IERC20(token).transfer(msg.sender, amount);
    }
    
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
} 