pragma solidity >=0.5.13;

import "@daostack/arc/contracts/controller/Avatar.sol";
import "@daostack/arc/contracts/controller/Controller.sol";
import './interfaces/IConfigurableRightsPool.sol';

// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// import './interfaces/IBPool.sol';


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

    function _setSwapFee(uint _swapFee) public protected {
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

}