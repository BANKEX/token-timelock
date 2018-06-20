pragma solidity ^0.4.24;

contract IAdmins {

  function updateAdmin(address _admin, bool status) external;

  function isAdmin(address _admin) public view returns(bool);

}
