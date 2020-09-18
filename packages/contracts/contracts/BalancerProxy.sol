pragma solidity >=0.5.13;

import "@daostack/arc/contracts/controller/Avatar.sol";
import "@daostack/arc/contracts/controller/Controller.sol";
import './interfaces/IConfigurableRightsPool.sol';

contract BalancerProxy {
    string constant ERROR_SET_PUBLIC_SWAP    = "UniswapProxy: setPublicSwap failed";
    string constant ERROR_SET_SWAP_FEE       = "UniswapProxy: setSwapFee failed";
    string constant COMMIT_TOKEN             = "UniswapProxy: token was not committed";
    string constant ADD_TOKEN                = "UniswapProxy: addToken failed";
    string constant REMOVE_TOKEN             = "UniswapProxy: removeToken failed";
    string constant UPDATE_WEIGHTS_GRADUALLY = "UniswapProxy: updateWeightsGradually failed";

    bool               		public initialized;
    Avatar             		public avatar;
    IConfigurableRightsPool public crpool;

    event SetPublicSwap          (bool publicSwap);
    event SetSwapFee             (uint swapFee);
    event AddToken               (address indexed token, uint balance, uint denormalizedWeight);
    event RemoveToken            (address indexed token);
    event UpdateWeightsGradually (uint[] newWeights, uint startBlock, uint endBlock);

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

    function initialize(Avatar _avatar, IConfigurableRightsPool _crpool) external initializer {
        require(_avatar != Avatar(0),             	   "BalancerProxy: avatar cannot be null");
        require(_crpool != IConfigurableRightsPool(0), "BalancerProxy: crpool cannot be null");

        avatar = _avatar;
        crpool = _crpool;
    }

    function setPublicSwap(bool publicSwap) external protected {
        bool success = _setPublicSwap(publicSwap);
        require(success, ERROR_SET_PUBLIC_SWAP);
        emit SetPublicSwap(publicSwap);
    }

    function setSwapFee(uint swapFee) external protected {
        bool success = _setSwapFee(swapFee);
        require(success, ERROR_SET_SWAP_FEE);
        emit SetSwapFee(swapFee);
    }

    function addToken(address token, uint balance, uint denormalizedWeight) external protected {
        bool success = _commitAddToken(token, balance, denormalizedWeight);
        require(success, COMMIT_TOKEN);
        success = _applyAddToken();
        require(success, ADD_TOKEN);
        emit AddToken(token, balance, denormalizedWeight);
    }

    function removeToken(address token) external protected {
        bool success = _removeToken(token);
        require(success, ADD_TOKEN);
        emit RemoveToken(token);
    }

    function updateWeightsGradually(uint[] calldata newWeights, uint startBlock, uint endBlock) external protected {
        bool success = _updateWeightsGradually(newWeights, startBlock, endBlock);
        require(success, UPDATE_WEIGHTS_GRADUALLY);
        emit UpdateWeightsGradually(newWeights, startBlock, endBlock);
    }

    /* internal state-modifying functions */

    function _setPublicSwap(bool _publicSwap) internal returns(bool) {
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
        return success;
    }

    function _setSwapFee(uint _swapFee) internal returns(bool) {
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
        return success;
    }

    function _applyAddToken() internal returns(bool) {
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
}