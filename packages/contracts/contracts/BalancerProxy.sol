pragma solidity >=0.5.13;

import "@daostack/arc/contracts/controller/Avatar.sol";
import "@daostack/arc/contracts/controller/Controller.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IConfigurableRightsPool.sol";
import "./interfaces/IBPool.sol";

/**
 * @title A Balancer Configurable Rights Pool proxy
 * @dev   Enable primeDAO governance of a Configurable Rights Balancer Pool.
 */
contract BalancerProxy {
    string constant ERROR_SET_PUBLIC_SWAP    = "BalancerProxy: setPublicSwap failed";
    string constant ERROR_SET_SWAP_FEE       = "BalancerProxy: setSwapFee failed";
    string constant COMMIT_TOKEN             = "BalanceProxy: token was not committed";
    string constant ADD_TOKEN                = "BalancerProxy: addToken failed";
    string constant REMOVE_TOKEN             = "BalancerProxy: removeToken failed";
    string constant UPDATE_WEIGHTS_GRADUALLY = "BalancerProxy: updateWeightsGradually failed";
    string constant ERROR_APPROVAL           = "BalancerProxy: ERC20 approval failed";
    string constant JOIN_POOL                = "BalancerProxy: JoinPool failed";
    string constant EXIT_POOL                = "BalancerProxy: ExitPool failed";
    string constant TOKEN_AMOUNTS            = "BalancerProxy: token amounts array length doesn't match";

    bool               		public initialized;
    Avatar             		public avatar;
    IConfigurableRightsPool public crpool;
    IBPool                  public bpool;

    event SetPublicSwap          (bool publicSwap);
    event SetSwapFee             (uint swapFee);
    event CommitAddToken         (address indexed token, uint balance, uint denormalizedWeight);
    event ApplyAddToken          (bool addToken);
    event RemoveToken            (address indexed token);
    event UpdateWeightsGradually (uint[] newWeights, uint startBlock, uint endBlock);

    modifier initializer() {
        require(!initialized, "BalancerProxy: proxy already initialized");
        initialized = true;
        _;
    }

    // modifier onlyInitialized () {
    //     require(initialized,                   "BalancerProxy: proxy not initialized");
    //     _;
    // }

    modifier protected () {
        require(initialized,                   "BalancerProxy: proxy not initialized");
        require(msg.sender == address(avatar), "BalancerProxy: protected operation");
        _;
    }

    /**
      * @dev           Initialize proxy.
      * @param _avatar The address of the Avatar controlling this proxy.
      * @param _crpool The address of the balancer Configurable Rights Pool.
      */
    function initialize(Avatar _avatar, IConfigurableRightsPool _crpool, IBPool _bpool) external initializer {
        require(_avatar != Avatar(0),             	   "BalancerProxy: avatar cannot be null");
        require(_crpool != IConfigurableRightsPool(0), "BalancerProxy: crpool cannot be null");
        require(_bpool  != IBPool(0),                  "BalancerProxy: bpool cannot be null");

        avatar = _avatar;
        crpool = _crpool;
        bpool  = _bpool;
    }

    /**
      * @dev              Set Public Swap to true/false.
      * @param publicSwap Sets publicSwap that allows to use balancer pool for swapping.
      */
    function setPublicSwap(bool publicSwap) external protected {
        bool success = _setPublicSwap(publicSwap);
        require(success, ERROR_SET_PUBLIC_SWAP);
        emit SetPublicSwap(publicSwap);
    }

    /**
      * @dev           Set Swap Fee.
      * @param swapFee Sets Swap Fee.
      */
    function setSwapFee(uint swapFee) external protected {
        bool success = _setSwapFee(swapFee);
        require(success, ERROR_SET_SWAP_FEE);
        emit SetSwapFee(swapFee);
    }

    function commitAddToken(address token, uint balance, uint denormalizedWeight) external protected {
        bool success = _commitAddToken(token, balance, denormalizedWeight);
        require(success, COMMIT_TOKEN);

        emit CommitAddToken(token, balance, denormalizedWeight);
    }

    function applyAddToken() external protected {
        bool success = _applyAddToken();
        require(success, ADD_TOKEN);
        emit ApplyAddToken(success);
    }

    /**
      * @dev                      Remove Token from the balancer pool.
      * @param token              Token address
      */
    function removeToken(address token) external protected {
        bool success = _removeToken(token);
        require(success, ADD_TOKEN);
        emit RemoveToken(token);
    }

    /**
      * @dev                      Sets the new weights that are going to be gradually ipdated.
      * @param newWeights         New weights
      * @param startBlock         Start block for the update
      * @param endBlock           End block for the update
      */
    function updateWeightsGradually(uint[] calldata newWeights, uint startBlock, uint endBlock) external protected {
        bool success = _updateWeightsGradually(newWeights, startBlock, endBlock);
        require(success, UPDATE_WEIGHTS_GRADUALLY);
        emit UpdateWeightsGradually(newWeights, startBlock, endBlock);
    }

    /**
      * @dev                      Joins the pool by adding more tokens.
      * @param poolAmountOut      Number of pool tokens to receive
      * @param maxAmountsIn       Max amount of asset tokens to spend
      */
    function joinPool(uint poolAmountOut, uint[] calldata maxAmountsIn) external protected {
        address[] memory poolTokens = bpool.getCurrentTokens();
        require(poolTokens.length == maxAmountsIn.length, TOKEN_AMOUNTS);
        _approveAllTokens(poolTokens, maxAmountsIn);
        bool success = _joinPool(poolAmountOut, maxAmountsIn);
        require(success, JOIN_POOL);
    }

    /**
     * @dev                      Exits the pool by redeeming the tokens.
     * @param poolAmountIn       Amount of pool tokens to redeem
     * @param minAmountsOut      Minimum amount of asset tokens to receive
     */
    function exitPool(uint poolAmountIn, uint[] calldata minAmountsOut) external protected {
        address[] memory poolTokens = bpool.getCurrentTokens();
        require(poolTokens.length == minAmountsOut.length, TOKEN_AMOUNTS);
        _approveAllTokens(poolTokens, minAmountsOut);
        bool success = _exitPool(poolAmountIn, minAmountsOut);
        require(success, EXIT_POOL);
    }

    /* internal state-modifying functions */

    function _setPublicSwap(bool _publicSwap) internal returns(bool) {
        // bytes     memory returned;
        bool             success;
    	Controller controller = Controller(avatar.owner());

        (success,) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.setPublicSwap.selector,
                _publicSwap
            ),
            avatar,
            0
        );
        return success;
    }

    function _setSwapFee(uint _swapFee) internal returns(bool) {
        // bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, ) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.setSwapFee.selector,
                _swapFee
            ),
            avatar,
            0
        );
        return success;        
    }

    function _updateWeightsGradually(
        uint[] memory _newWeights,
        uint _startBlock, 
        uint _endBlock
    )
    internal
    returns(bool)
    {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.updateWeightsGradually.selector,
                _newWeights,
                _startBlock,
                _endBlock
            ),
            avatar,
            0
        );
        return success;        
    }

    function _commitAddToken(address _token, uint _balance, uint _denormalizedWeight) internal returns(bool) {
        bool             success;
        Controller controller = Controller(avatar.owner());

        _approve(_token, _balance);
        (success, ) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.commitAddToken.selector,
                _token,
                _balance,
                _denormalizedWeight
            ),
            avatar,
            0
        );
        return success;
    }

    function _applyAddToken() internal returns(bool) {
        // bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, ) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.applyAddToken.selector
            ),
            avatar,
            0
        );
        return success;
    }

    function _removeToken(address _token) internal returns(bool) {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.removeToken.selector,
                _token
            ),
            avatar,
            0
        );
        return success;
    }

    function _joinPool(uint _poolAmountOut, uint[] memory _maxAmountsIn) internal returns(bool) {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.joinPool.selector,
                _poolAmountOut,
                _maxAmountsIn
            ),
            avatar,
            0
        );
        return success;
    }

    function _exitPool(uint _poolAmountIn, uint[] memory _minAmountsOut) internal returns(bool) {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.exitPool.selector,
                _poolAmountIn,
                _minAmountsOut
            ),
            avatar,
            0
        );
        return success;
    }

    /* internal helpers functions */

    function _approve(address _token, uint256 _amount) internal {
        Controller       controller = Controller(avatar.owner());
        bool             success;

        if (IERC20(_token).allowance(address(avatar), address(crpool)) > 0) {
            // reset allowance to make sure final approval does not revert
            (success,) = controller.genericCall(
                _token,
                abi.encodeWithSelector(IERC20(_token).approve.selector, address(crpool), 0),
                avatar,
                0
            );
            require(success, ERROR_APPROVAL);
        }
        (success,) = controller.genericCall(
            _token,
            abi.encodeWithSelector(IERC20(_token).approve.selector, address(crpool), _amount),
            avatar,
            0
        );
        require(success, ERROR_APPROVAL);
    }

    function _approveAllTokens(address[] memory _poolTokens, uint[] memory _amounts) internal {
        for (uint i = 0; i < _poolTokens.length; i++) {
            address t   = _poolTokens[i];
            uint amount = _amounts[i];
            _approve(t, amount);
        }
    }

    // function _parseAddress(bytes memory bys) internal pure returns (address addr) {
    //     assembly {
    //       addr := mload(add(bys,20))
    //     } 
    // }
}