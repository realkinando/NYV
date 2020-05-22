pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "./NYVAssetControlInterface.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Takes a Source Asset, NYV Asset, and uniswap pair
// Accepts the source asset, returns NYVAsset to the msg.sender
// Uses the source asset to supply liquidity to uniswap for a source/nyv pair
// Does not use oracle, instead checks the amounts added to the liquidity pool
// if NYVAssetAmount/SourceAssetAmount < target : REVERT
// transfer SourceAssetAmount units of NYVAsset to the caller
// DOES NOT ENABLE TRANSFER OF LIQUIDITY TOKENS, THESE TOKENS ARE HELD BY THE CONTRACT, BUT NOT MOVABLE - TO PREVENT EXPLOITATION

contract SimpleDepositor is Ownable{
    using SafeMath for uint;
    uint constant MAX_UINT = 2**256 - 1;
    uint public targetBasisPoints;
    IERC20 internal sourceAsset;
    IERC20 internal nyvAsset;
    address public sourceAssetAddress;
    address public nyvAssetAddress;
    NYVAssetControlInterface internal nyvAssetController;
    IUniswapV2Router01 internal router;
    bool public operating;

    constructor(address source,address nyv, address routerAddress, uint initialTargetBasisPoints) public{
        sourceAssetAddress = source;
        nyvAssetAddress = nyv;
        sourceAsset = IERC20(source);
        nyvAsset = IERC20(nyv);
        nyvAsset.approve(routerAddress,MAX_UINT);
        sourceAsset.approve(routerAddress, MAX_UINT);
        nyvAssetController = NYVAssetControlInterface(nyv);
        router = IUniswapV2Router01(routerAddress);
        targetBasisPoints = initialTargetBasisPoints;
        operating = false;
    }

    function setTargetBasisPoints(uint newTarget) external onlyOwner{
        targetBasisPoints = newTarget;
    }

    function setOperating(bool isOperating) external onlyOwner{
        operating = isOperating;
    }

    modifier operational(){
        require(operating,"We pulled the plug, soz");
        _;
    }

    //take SourceAssetDesired units of source asset from the caller
    //mint nyvAssetDesired
    function deposit(uint nyvAssetDesired, uint nyvAssetMin, uint sourceAssetDesired, uint sourceAssetMin, uint deadline)
    external operational returns(uint nyvAssetAdded, uint sourceAssetAdded){
        uint liquidity = 0;
        //transfer sourceAssetDesired sourceAsset msg.sender to this address
        sourceAsset.transferFrom(msg.sender,address(this),sourceAssetDesired);
        nyvAssetController.mint(address(this),nyvAssetDesired);
        (nyvAssetAdded, sourceAssetAdded, liquidity) = router.addLiquidity(nyvAssetAddress,
        sourceAssetAddress,nyvAssetDesired,sourceAssetDesired,nyvAssetMin,sourceAssetMin,address(this),deadline);
        require(targetBasisPoints <= sourceAssetAdded.mul(10000).div(nyvAssetAdded),"Current price is below target, cannot deposit");
        nyvAssetController.mint(msg.sender,sourceAssetAdded);
        sourceAsset.transfer(msg.sender,sourceAssetDesired-sourceAssetAdded);
    }

}