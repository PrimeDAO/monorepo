pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract USDP is ERC20 {
    string public name;
    string public symbol;
    uint8  public decimals;

    constructor(uint8 _decimals, uint256 _amount) public {
        name = 'Prime Stablecoin';
        symbol = 'USDP';
        decimals = _decimals;
    	_mint(msg.sender, _amount);
    }
}