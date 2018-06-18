pragma solidity ^0.4.23;

contract IERC20 {

    function transferFrom(address from, address to, uint256 value) public returns (bool);

    function approve(address spender, uint256 value) public returns (bool);

    function transfer(address to, uint256 value) public returns (bool);
}