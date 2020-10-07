/*
   ____            __   __        __   _
  / __/__ __ ___  / /_ / /  ___  / /_ (_)__ __
 _\ \ / // // _ \/ __// _ \/ -_)/ __// / \ \ /
/___/ \_, //_//_/\__//_//_/\__/ \__//_/ /_\_\
     /___/
* Synthetix: PrimeIncentives.sol
*
* Docs: https://docs.synthetix.io/
*
*
* MIT License
* ===========
*
* Copyright (c) 2020 Synthetix
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
*/

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./LPTokenProxy.sol";
import "./IRewardDistributionRecipient.sol";

pragma solidity >=0.5.13;


contract IncentivesProxy is LPTokenProxy, IRewardDistributionRecipient {

    IERC20 public rewardToken;
    bool   public initialized;

    modifier initializer() {
        require(!initialized, "IncentivesProxy: proxy already initialized");
        initialized = true;
        _;
    }

    modifier protected() {
        require(initialized,                   "IncentivesProxy: proxy not initialized");
        _;
    }

    /**
      * @dev           Initialize proxy.
      * @param _token  The address of the Avatar controlling this proxy.
      */
    function initialize(address _token) external initializer {
        require(_token != address(0),                  "IncentivesProxy: token cannot be null");

        rewardToken  = IERC20(_token);
    }

    uint256 public constant DURATION = 7 days;

    uint256 public initreward = 925 * 10**2 * 10**18; // 92.5k
    uint256 public starttime = 1600560000; // 2020-09-20 00:00:00 (UTC +00:00)
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    // bool public initialized = false;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;


    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    // stake visibility is public as overriding LPTokenWrapper's stake() function
     function stake(uint256 amount) public updateReward(msg.sender) /*checkhalve*/ protected checkStart {
        require(amount > 0, "IncentivesProxy: cannot stake 0");
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) protected checkStart {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
        getReward();
    }

    function getReward() public updateReward(msg.sender) /*checkhalve*/ protected checkStart {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            // uint256 scalingFactor = YAM(address(yam)).yamsScalingFactor();
            // uint256 trueReward = reward.mul(scalingFactor).div(10**18);
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    modifier checkStart(){
        require(block.timestamp >= starttime,"not start");
        _;
    }


   function notifyRewardAmount(uint256 reward) external protected onlyRewardDistribution updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(DURATION);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(DURATION);
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance = rewardToken.balanceOf(address(this));
        require(rewardRate <= balance.div(DURATION), "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(DURATION);
        emit RewardAdded(reward);
    }

    // This function allows governance to take unsupported tokens out of the
    // contract, since this one exists longer than the other pools.
    // This is in an effort to make someone whole, should they seriously
    // mess up. There is no guarantee governance will vote to return these.
    // It also allows for removal of airdropped tokens.
    function rescueTokens(IERC20 _token, uint256 amount, address to)
        external
        protected
    {
        // only gov
        require(msg.sender == owner(), "!governance");
        // cant take staked asset
        require(_token != poolToken, "uni_lp");
        // cant take reward asset
        require(_token != rewardToken, "yam");

        // transfer to
        _token.safeTransfer(to, amount);
    }
}