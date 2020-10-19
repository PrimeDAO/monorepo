pragma solidity >=0.5.0;

interface ITokenVesting {
    function revoke(address token) external;
}