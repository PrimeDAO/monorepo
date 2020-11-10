// File: contracts/IRewardDistributionRecipient.sol

pragma solidity >=0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract IRewardDistributionRecipient is Ownable {
    address rewardDistribution;

    function _notifyRewardAmount(uint256 reward) internal;

    modifier onlyRewardDistribution() {
        require(_msgSender() == rewardDistribution, "Caller is not reward distribution");
        _;
    }

    function setRewardDistribution(address _rewardDistribution)
        external
        onlyOwner
    {
        rewardDistribution = _rewardDistribution;
    }
}
