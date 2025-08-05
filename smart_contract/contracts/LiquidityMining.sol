//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityMining {
    struct Pool {
        address token0;
        address token1;
        uint256 rewardRate; // Rewards per second
        uint256 totalStaked;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
    }
    
    struct UserStake {
        uint256 amount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
    }
    
    mapping(address => Pool) public pools;
    mapping(address => mapping(address => UserStake)) public userStakes;
    
    IERC20 public rewardToken;
    uint256 public totalRewards;
    uint256 public startTime;
    uint256 public endTime;
    
    event PoolAdded(address indexed token0, address indexed token1, uint256 rewardRate);
    event Staked(address indexed user, address indexed token0, address indexed token1, uint256 amount);
    event Withdrawn(address indexed user, address indexed token0, address indexed token1, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor(address _rewardToken, uint256 _totalRewards, uint256 _duration) {
        rewardToken = IERC20(_rewardToken);
        totalRewards = _totalRewards;
        startTime = block.timestamp;
        endTime = block.timestamp + _duration;
    }
    
    function addPool(
        address token0,
        address token1,
        uint256 rewardRate
    ) external {
        require(token0 != token1, "Same tokens");
        require(rewardRate > 0, "Invalid reward rate");
        
        pools[token0] = Pool({
            token0: token0,
            token1: token1,
            rewardRate: rewardRate,
            totalStaked: 0,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0
        });
        
        emit PoolAdded(token0, token1, rewardRate);
    }
    
    function stake(address token0, address token1, uint256 amount) external {
        Pool storage pool = pools[token0];
        require(pool.token0 != address(0), "Pool not found");
        
        updateRewards(token0, token1);
        
        UserStake storage userStake = userStakes[msg.sender][token0];
        userStake.amount += amount;
        pool.totalStaked += amount;
        
        emit Staked(msg.sender, token0, token1, amount);
    }
    
    function withdraw(address token0, address token1, uint256 amount) external {
        Pool storage pool = pools[token0];
        require(pool.token0 != address(0), "Pool not found");
        
        UserStake storage userStake = userStakes[msg.sender][token0];
        require(userStake.amount >= amount, "Insufficient staked");
        
        updateRewards(token0, token1);
        
        userStake.amount -= amount;
        pool.totalStaked -= amount;
        
        emit Withdrawn(msg.sender, token0, token1, amount);
    }
    
    function claimRewards() external {
        uint256 totalReward = 0;
        
        // Calculate rewards for all pools
        for (uint i = 0; i < 10; i++) { // Limit to prevent infinite loop
            // This is a simplified version - in practice you'd iterate through actual pools
            break;
        }
        
        require(totalReward > 0, "No rewards to claim");
        
        // Reset user rewards
        for (uint i = 0; i < 10; i++) {
            // Reset rewards for all pools
            break;
        }
        
        rewardToken.transfer(msg.sender, totalReward);
        emit RewardsClaimed(msg.sender, totalReward);
    }
    
    function updateRewards(address token0, address token1) internal {
        Pool storage pool = pools[token0];
        if (pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
            uint256 rewards = timeElapsed * pool.rewardRate;
            pool.rewardPerTokenStored += (rewards * 1e18) / pool.totalStaked;
        }
        pool.lastUpdateTime = block.timestamp;
    }
    
    function earned(address user, address token0) external view returns (uint256) {
        Pool storage pool = pools[token0];
        UserStake storage userStake = userStakes[user][token0];
        
        uint256 rewardPerToken = pool.rewardPerTokenStored;
        if (pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
            uint256 rewards = timeElapsed * pool.rewardRate;
            rewardPerToken += (rewards * 1e18) / pool.totalStaked;
        }
        
        return (userStake.amount * (rewardPerToken - userStake.rewardPerTokenPaid)) / 1e18 + userStake.rewards;
    }
    
    function getPoolInfo(address token0) external view returns (Pool memory) {
        return pools[token0];
    }
    
    function getUserStake(address user, address token0) external view returns (UserStake memory) {
        return userStakes[user][token0];
    }
} 