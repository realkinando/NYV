pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/dev/AggregatorInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";
import "./NYVAssetControlInterface.sol";

contract NYVExchange is Ownable {
    using SignedSafeMath for int;
    mapping(address => mapping(address => address)) private _quoteBaseAggregator;
    bool public operating;

    constructor() public{
        operating = false;
    }

    // we can turn the thing off just incase
    // owner is gonna have to call this with isOperating = true for the Exchange to turn on
    // ONLY CALL WHEN ALL quoteBaseAggregators ARE SET & THIS CONTRACT IS GIVEN NECESSARY PERMISSIONS BY THE TOKEN CONTRACTS
    function setOperating(bool isOperating) external onlyOwner{
        operating = isOperating;
    }

    modifier operational(){
        require(operating,"We pulled the plug, soz");
        _;
    }

    // note: this allows the operator to effectively set two different rates for the same pair
    // note: however, the contract has no way of detecting if this has been done
    function setQuoteBaseAggregator(address quote,address base, address aggregator) external onlyOwner{
        _quoteBaseAggregator[quote][base] = aggregator;
    }

    //magic happens here
    //FLAW : uses explicit burn from NYVAsset contract
    //IN FUTURE : WILL REPLACE burn with operatorBurn - in order to give users better consent
    function exchange(address quote, address base, bool isBuy, uint256 amount) external operational{
        require(_quoteBaseAggregator[quote][base] != address(0),"Pair not found, try switching quote/base and inverting isBuy");
        AggregatorInterface oracle = AggregatorInterface(_quoteBaseAggregator[quote][base]);
        int256 rate = oracle.latestAnswer();
        if (isBuy){
            uint256 mint = uint256(int256(amount).mul(100000000).div(rate));
            NYVAssetControlInterface burnToken = NYVAssetControlInterface(quote);
            NYVAssetControlInterface mintToken = NYVAssetControlInterface(base);
            burnToken.burn(msg.sender,amount);
            mintToken.mint(msg.sender,mint);
        }
        else{
            uint256 mint = uint256(int256(amount).mul(rate).div(100000000));
            NYVAssetControlInterface burnToken = NYVAssetControlInterface(base);
            NYVAssetControlInterface mintToken = NYVAssetControlInterface(quote);
            burnToken.burn(msg.sender,amount);
            mintToken.mint(msg.sender,mint);
        }
    }

    // Eventually, we will replace this contract with a more secure design, which also uses a platform token. See docs
    function kill() external onlyOwner {
        selfdestruct(msg.sender);
    }
}