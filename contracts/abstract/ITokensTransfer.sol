pragma solidity ^0.4.24;


contract ITokensTransfer {

  function getTotalBalance(address _userAddress, address _tokenAddress) external view returns(uint);

  function getBalanceAt(address _owner, address _token, uint _timestamp) public view returns(uint);

  function getBalance(address _owner, address _token) external view returns(uint);

  function release(address _token, uint _amount) external;

  function releaseForce(address _recipient, address _token, uint _amount) external;

  function _release(address _recipient, address _token, uint _amount) internal;

  function acceptTokens(address _to, address _tokenAddress, uint _releaseTimestamp, uint _previousReleaseTimestamp, uint _amount) external;

  function isExistingTimestamp(address _owner, address _token, uint _timestamp) external view returns(bool);
}
