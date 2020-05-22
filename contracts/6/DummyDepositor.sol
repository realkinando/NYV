pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NYVAssetControlInterface.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DummyDepositor is Ownable{
    using SafeMath for uint;
    IERC20 internal sourceAsset;
    IERC20 internal nyvAsset;
    NYVAssetControlInterface internal nyvAssetController;

    constructor(address source, address nyv) public {
        sourceAsset = IERC20(source);
        nyvAsset = IERC20(nyv);
        nyvAssetController = NYVAssetControlInterface(nyv);
    }

    function deposit(uint nyvAssetDesired)
    external {
        sourceAsset.transferFrom(msg.sender,address(this),nyvAssetDesired);
        nyvAssetController.mint(msg.sender,nyvAssetDesired);
    }
}