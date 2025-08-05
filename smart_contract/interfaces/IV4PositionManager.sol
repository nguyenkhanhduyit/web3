// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IV4PositionManager {
    function modifyLiquidities(
        bytes calldata actions,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable;
} 