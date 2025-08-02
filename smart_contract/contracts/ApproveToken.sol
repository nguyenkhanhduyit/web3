//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract TokenApprover {
    function approveToken(address token, address spender, uint256 amount) external {
        IERC20(token).approve(spender, amount);
    }
}
