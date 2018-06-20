pragma solidity ^0.4.24;

import "../abstract/IERC20.sol";
import "../libraries/SortedLinkedList.sol";
import "../libraries/SafeMath.sol";
import "./Admins.sol";
import "../abstract/TimeMachine/TimeMachineP.sol";
import "../abstract/ITokensTransfer.sol";

contract TokensTransfer is ITokensTransfer, Admins, TimeMachineP {
  using SortedLinkedList for SortedLinkedList.SLL;
  using SafeMath for uint;

  //userAddress => tokenAddress => releaseTimestamp => balances;
  mapping(address => mapping( address => SortedLinkedList.SLL ) ) private bank;

  constructor(address[] _admins) Admins(_admins) {
  }

  function getTotalBalance(address _userAddress, address _tokenAddress) external view returns(uint) {
    SortedLinkedList.Node memory node = bank[_userAddress][_tokenAddress].getNode(0);
    uint balance = 0;

    while(node.next != 0) {
      node = bank[_userAddress][_tokenAddress].stepForward(node);
      balance = balance.add(node.value);
    }

    return balance;
  }

  function getBalanceAt(address _owner, address _token, uint _timestamp) public view returns(uint) {
    SortedLinkedList.Node memory node = bank[_owner][_token].getNode(0);
    uint balance = 0;

    while(node.next != 0 && node.next <= _timestamp) {
      node = bank[_owner][_token].stepForward(node);
      balance = balance.add(node.value);
    }

    return balance;
  }

  function getBalance(address _owner, address _token) external view returns(uint) {
    return getBalanceAt(_owner, _token, getTimestamp_());
  }

  function release(address _token, uint _amount) external {
    _release(msg.sender, _token, _amount);
  }

  function releaseForce(address _recipient, address _token, uint _amount) external {
    require(isAdmin(msg.sender));

    _release(_recipient, _token, _amount);
  }

  function _release(address _recipient, address _token, uint _amount) internal {
    SortedLinkedList.Node memory node = bank[_recipient][_token].getNode(0);
    uint lastNodeKey = node.next;
    uint balance = 0;

    while(node.next != 0 && lastNodeKey <= getTimestamp_() && balance <= _amount) {
      node = bank[_recipient][_token].stepForward(node);
      balance = balance.add(node.value);

      if(balance > _amount) {
        uint diff = balance.sub(_amount);
        bank[_recipient][_token].updateNodeValue(lastNodeKey, diff);
      } else {
        lastNodeKey = node.next;
      }
    }

    if (balance < _amount) {
      revert("Insufficient balance");
    }

    bank[_recipient][_token].cut(0, lastNodeKey);

    IERC20(_token).transfer(_recipient, _amount);
  }

  function acceptTokens(address _to, address _tokenAddress, uint _releaseTimestamp, uint _previousReleaseTimestamp, uint _amount) external {
    require(_to != address(0));
    require(_tokenAddress != address(0));
    require(_amount > 0);

    bank[_to][_tokenAddress].insert(_previousReleaseTimestamp, _releaseTimestamp, _amount);

    IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);
  }


  function isExistingTimestamp(address _owner, address _token, uint _timestamp) external view returns(bool) {
    return bank[_owner][_token].isNodeExist(_timestamp);
  }

}
