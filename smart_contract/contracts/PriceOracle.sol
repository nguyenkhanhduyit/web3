//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PriceOracle {
    struct PriceData {
        uint256 price; // Price in wei (18 decimals)
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    mapping(address => mapping(address => PriceData)) public prices;
    mapping(address => bool) public authorizedUpdaters;
    
    event PriceUpdated(
        address indexed token0,
        address indexed token1,
        uint256 price,
        uint256 timestamp
    );
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        _;
    }
    
    constructor() {
        authorizedUpdaters[msg.sender] = true;
    }
    
    function addAuthorizedUpdater(address updater) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        authorizedUpdaters[updater] = true;
    }
    
    function removeAuthorizedUpdater(address updater) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        authorizedUpdaters[updater] = false;
    }
    
    function updatePrice(
        address token0,
        address token1,
        uint256 price
    ) external onlyAuthorized {
        require(token0 != token1, "Same token");
        require(price > 0, "Invalid price");
        
        prices[token0][token1] = PriceData({
            price: price,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        emit PriceUpdated(token0, token1, price, block.timestamp);
    }
    
    function getPrice(address token0, address token1) external view returns (uint256) {
        require(token0 != token1, "Same token");
        return prices[token0][token1].price;
    }
    
    function getPriceData(address token0, address token1) external view returns (PriceData memory) {
        require(token0 != token1, "Same token");
        return prices[token0][token1];
    }
    
    function calculatePriceFromReserves(
        uint256 reserve0,
        uint256 reserve1,
        uint256 decimals0,
        uint256 decimals1
    ) external pure returns (uint256) {
        require(reserve0 > 0 && reserve1 > 0, "Invalid reserves");
        
        // Calculate price as reserve1/reserve0 with proper decimal adjustment
        // Price = (reserve1 * 10^decimals0) / (reserve0 * 10^decimals1)
        uint256 adjustedReserve1 = reserve1 * (10 ** decimals0);
        uint256 adjustedReserve0 = reserve0 * (10 ** decimals1);
        
        return adjustedReserve1 / adjustedReserve0;
    }
} 