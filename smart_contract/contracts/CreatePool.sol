// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "../interfaces/IPoolManager.sol";

contract CreatePool {
    IPoolManager public poolManager;

    constructor(address _poolManager) {
        poolManager = IPoolManager(_poolManager);
    }

    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee,
        int24 tickSpacing,
        uint160 sqrtPriceX96
    ) external returns (bytes32 poolId) {
        address token0 = tokenA < tokenB ? tokenA : tokenB;
        address token1 = tokenA < tokenB ? tokenB : tokenA;

       address existingPool = poolManager.getPool(token0, token1, fee, tickSpacing);
if (existingPool != address(0)) {
    revert("CreatePool: Pool already exists");
}

        // Gọi tạo pool và initialize
        try poolManager.createAndInitializePool(
            token0, token1, fee, tickSpacing, sqrtPriceX96
        ) returns (bytes32 _poolId) {
            poolId = _poolId;
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("CreatePool: revert reason - ", reason)));
        } catch (bytes memory lowLevelData) {
            revert(string(abi.encodePacked("CreatePool: low-level error - ", toHexString(lowLevelData))));
        }
    }

    // Helper để in lỗi bytes dạng hex string
    function toHexString(bytes memory data) internal pure returns (string memory) {
        bytes memory HEX = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2 + i * 2] = HEX[uint(uint8(data[i] >> 4))];
            str[3 + i * 2] = HEX[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}
