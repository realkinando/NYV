pragma solidity ^0.6.0;

interface NYVAssetControlInterface{
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}