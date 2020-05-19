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
// contract must also have ERC20 wallet functionality to allow the redemption of liquidity by the contract owner

contract SimpleDepositor is ownable{
    using SafeMath for uint;
    uint public targetBasisPoints;
    address public SOURCE_ASSET;
    address public NVY_ASSET;
    IUniswapV2Router01 internal router;

    constructor(address source,address nyv, address routerAddress, uint initialTargetBasisPoints) public{
        SOURCE_ASSET = source;
        NYV_ASSET = nyv;
        router = IUniswapV2Router01(routerAddress);
        targetBasisPoints = initialTargetBasisPoints;
    }

    //take SourceAssetDesired units of source asset from the caller
    //mint nyvAssetDesired
    function deposit(uint nyvAssetDesired, nyvAssetMin, sourceAssetDesired, sourceAssetMin) public{
        (uint nyvAssetAdded, uint sourceAssetAdded, uint liquidity) = router.addLiquidity();
        require(sourceAssetAdded.mul(10000).div(nyvAssetAdded) => targetBasisPoints);
    }
}