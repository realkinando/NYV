pragma solidity ^0.6.6;

import "@uniswap/v2-periphery/contracts/UniswapV2Router01.sol";
//this is here because low-key I'm a noob with BUIDLer

contract MockUniswapRouter is UniswapV2Router01{
    constructor(address factory, address WETH) UniswapV2Router01(factory,WETH) public{}
}