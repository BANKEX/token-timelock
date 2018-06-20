pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract TestERC20Token is DetailedERC20, StandardToken {

  uint ownerBalance = 1000000 * (10 ** 18);

  constructor(string _name, string _symbol) DetailedERC20(_name, _symbol, 18) {
    totalSupply_ = ownerBalance;

    balances[msg.sender] = ownerBalance;
  }
}
