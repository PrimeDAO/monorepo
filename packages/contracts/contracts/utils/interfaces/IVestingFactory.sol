pragma solidity >=0.5.0;

interface IVestingFactory {
    function create(address owner, address beneficiary, uint256 start, uint256 cliffDuration, uint256 duration, bool revocable) external returns (address);
}