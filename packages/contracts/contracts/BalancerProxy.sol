pragma solidity >=0.5.13;

import "@daostack/arc/contracts/controller/Avatar.sol";
import "@daostack/arc/contracts/controller/Controller.sol";
import './interfaces/IConfigurableRightsPool.sol';

contract BalancerProxy {
    bool               		public initialized;
    Avatar             		public avatar;
    IConfigurableRightsPool public crpool;
    
    modifier initializer() {
        require(!initialized, "BalancerProxy: proxy already initialized");
        initialized = true;
        _;
    }

    modifier protected () {
        require(initialized,                   "BalancerProxy: proxy not initialized");
        require(msg.sender == address(avatar), "BalancerProxy: protected operation");
        _;
    }

    function initialize(Avatar _avatar, IConfigurableRightsPool _crpool/*, IBPool _bpool,*/) external initializer {
        require(_avatar != Avatar(0),             	   "BalancerProxy: avatar cannot be null");
        require(_crpool != IConfigurableRightsPool(0), "BalancerProxy: crpool cannot be null");

        avatar = _avatar;
        crpool = _crpool;
    }

    function setPublicSwap(bool publicSwap) public protected {
        _setPublicSwap(publicSwap);
    }

    function setSwapFee(uint swapFee) public protected {
        _setSwapFee(swapFee);
    }

    function updateWeightsGradually(uint[] memory newWeights, uint startBlock, uint endBlock) public protected {
        _updateWeightsGradually(newWeights, startBlock, endBlock);
    }

    function commitAddToken(address token, uint balance, uint denormalizedWeight) public protected {
        _commitAddToken(token, balance, denormalizedWeight);
    }

    function applyAddToken() public protected {
        _applyAddToken();
    }

    function removeToken(address token) public protected {
        _removeToken(token);
    }

    function whitelistLiquidityProvider(address provider) public protected {
        _whitelistLiquidityProvider(provider);
    }

    function removeWhitelistedLiquidityProvider(address provider) public protected {
        _whitelistLiquidityProvider(provider);
    }

    // function joinPool(uint poolAmountOut, uint[] maxAmountsIn) public protected {
    //     _joinPool(poolAmountOut, maxAmountsIn);
    // }

    // function exitPool(uint poolAmountIn, uint[] minAmountsOut) public protected {
    //     _exitPool(poolAmountIn, minAmountsOut);
    // }

    function _setPublicSwap(bool _publicSwap) internal {
        bytes     memory returned;
        bool             success;
    	Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.setPublicSwap.selector,
                _publicSwap
            ),
            avatar,
            0
        );
    }

    function _setSwapFee(uint _swapFee) internal {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.setSwapFee.selector,
                _swapFee
            ),
            avatar,
            0
        );
    }

    function _updateWeightsGradually(uint[] memory _newWeights, uint _startBlock, uint _endBlock) internal {
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
    }

    function _commitAddToken(address _token, uint _balance, uint _denormalizedWeight) internal {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
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
    }

    function _applyAddToken() internal {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.applyAddToken.selector
            ),
            avatar,
            0
        );
    }

    function _removeToken(address _token) internal {
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
    }

    function _whitelistLiquidityProvider(address _provider) internal {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.whitelistLiquidityProvider.selector,
                _provider
            ),
            avatar,
            0
        );
    }

    function _removeWhitelistedLiquidityProvider(address _provider) internal {
        bytes     memory returned;
        bool             success;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(crpool),
            abi.encodeWithSelector(
                crpool.removeWhitelistedLiquidityProvider.selector,
                _provider
            ),
            avatar,
            0
        );
    }

    // function _joinPool(uint _poolAmountOut, uint[] _maxAmountsIn) internal {
    //     // TODO
    // }

    // function _exitPool(uint poolAmountIn, uint[] minAmountsOut) internal {
    //     // TODO
    // }
}