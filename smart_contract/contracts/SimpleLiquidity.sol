//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleLiquidity {
    event LiquidityAdded(
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        address indexed provider
    );
    
    function addLiquidity(
        address token0,
        address token1,
        int24 tickLower,
        int24 tickUpper,
        uint256 fee,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external payable {
        IERC20(token0).transferFrom(msg.sender, address(this), amount0Desired);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1Desired);
        
        emit LiquidityAdded(token0, token1, amount0Desired, amount1Desired, msg.sender);
    }
    
    function withdrawToken(address token, uint256 amount) external {
        IERC20(token).transfer(msg.sender, amount);
    }
    
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
