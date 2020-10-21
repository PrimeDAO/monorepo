pragma solidity >=0.5.13;

import "@daostack/arc/contracts/controller/Avatar.sol";
import "@daostack/arc/contracts/controller/Controller.sol";
import "@daostack/arc/contracts/libs/SafeERC20.sol";
import "../utils/interfaces/IVestingFactory.sol";
import "../utils/interfaces/ITokenVesting.sol";


contract VestingProxy {

    address                 public primeToken;
    address[]				public daoVestings;
    bool               		public initialized;
    Avatar             		public avatar;
    IVestingFactory			public factory;

    event VestingCreated(address vestingContractAddress, uint id);

    modifier initializer() {
        require(!initialized, "VestingProxy: scheme already initialized");
        initialized = true;
        _;
    }

    modifier protected() {
        require(initialized,                   "VestingProxy: scheme not initialized");
        require(msg.sender == address(avatar), "VestingProxy: protected operation");
        _;
    }

    /**
      * @dev           Initialize proxy.
      */
    function initialize(Avatar _avatar, IVestingFactory _vestingFactory, address _primeToken) external initializer {
        require(_avatar != Avatar(0),             	   "VestingProxy: avatar cannot be null");
        require(_vestingFactory != IVestingFactory(0), "VestingProxy: vestingFactory cannot be null");
        require(IERC20(_primeToken) != IERC20(0),  	   "VestingProxy: primeToken cannot be null");

        avatar = _avatar;
        factory = _vestingFactory;
    }

    /**
      * @dev           Create vesting contract.
      */
    function createVesing(address beneficiary, uint256 amount, uint256 start, uint256 cliffDuration, uint256 duration, bool revocable)  external protected  {
    	_create(beneficiary, amount, start, cliffDuration, duration, revocable);
    }

    /**
      * @dev           Revoke vesting from a contract.
      */
    function revokeVesing(uint256 id)  external protected {
    	_revoke(id);
    }

    /* internal state-modifying functions */

    function _create(address _beneficiary, uint256 _amount, uint256 _start, uint256 _cliffDuration, uint256 _duration, bool _revocable)  internal  {
        require(_amount >= 0, "VestingProxy: cannot transfer 0 amount");

        bool             success;
        bytes     memory returned;
        Controller controller = Controller(avatar.owner());

        (success, returned) = controller.genericCall(
            address(factory),
            abi.encodeWithSelector(
                factory.create.selector,
                address(avatar),
                _beneficiary,
                _start,
                _cliffDuration,
                _duration,
                _revocable
            ),
            avatar,
            0
        );
        require(success, "VestingProxy: vesting contract creation fails");

        address vestingContract = _parseReturn(returned); 

        (success, ) = controller.genericCall(
            primeToken,
            abi.encodeWithSelector(
                IERC20(primeToken).transfer.selector,
                vestingContract,
                _amount
            ),
            avatar,
            0
        );

        require(success, "VestingProxy: prime token transfer fails");

        emit VestingCreated(vestingContract, daoVestings.length);

        daoVestings.push(vestingContract);
    }

    function _revoke(uint256 _id) internal {
    	require(_id <= daoVestings.length, "VestingProxy: id is out of index");

    	bool             success;
        Controller controller = Controller(avatar.owner());
        ITokenVesting vestingContract = ITokenVesting(daoVestings[_id]);

        (success, ) = controller.genericCall(
            address(vestingContract),
            abi.encodeWithSelector(
                vestingContract.revoke.selector,
                primeToken
            ),
            avatar,
            0
        );
        require(success, "VestingProxy: revoke vesting fails");
    }

    /* internal helpers functions */

	function _parseReturn (bytes memory bys) private pure returns (address addr) {
	    assembly {
	      addr := mload(add(bys,20))
	    } 
	}
}