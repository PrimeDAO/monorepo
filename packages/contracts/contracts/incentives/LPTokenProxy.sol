pragma solidity >=0.5.13;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract LPTokenProxy {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public poolToken;
    bool   public initialized;


    modifier initializer() {
        require(!initialized, "LPTokenProxy: proxy already initialized");
        initialized = true;
        _;
    }

    modifier protected() {
        require(initialized,                   "LPTokenProxy: proxy not initialized");
        _;
    }

    /**
      * @dev           Initialize proxy.
      * @param _token  The address of the Avatar controlling this proxy.
      */
    function initialize(address _token) external initializer {
        require(_token != address(0),                  "LPTokenProxy: token cannot be null");

        poolToken  = IERC20(_token);
    }

    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        poolToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        poolToken.safeTransfer(msg.sender, amount);
    }
}