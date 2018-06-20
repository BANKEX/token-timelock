pragma solidity ^0.4.24;

import "../abstract/IAdmins.sol";

contract Admins is IAdmins {

  mapping(address => bool) admins;

  constructor(address[] _admins) {
    require(_admins.length > 0);

    for (uint i = 0; i < _admins.length; i++) {
      require(_admins[i] != address(0));
      admins[_admins[i]] = true;
    }
  }


  function updateAdmin(address _admin, bool status) external {
    // check that sender is admin
    require(isAdmin(msg.sender));

    // don't allow to edit itself account
    // to avoid situation when all admins are removed
    require(_admin != msg.sender);

    admins[_admin] = status;
  }


  function isAdmin(address _admin) public view returns(bool) {
    return admins[_admin];
  }

}
