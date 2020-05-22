pragma solidity ^0.5.16;
import "@uniswap/v2-core/contracts/UniswapV2Factory.sol";
//this is here because low-key I'm a noob with BUIDLer

contract MockUniswapFactory is UniswapV2Factory{
    constructor() UniswapV2Factory(msg.sender) public{}
}