pragma solidity ^0.4.24;

import "./ICassette.sol";
import "../../libs/token/ERC888/IERC888.sol";

contract ERC20Cassette is ICassette {

  address public utilityToken;
  uint public utilityTokenId;

  function getCassetteSize_() internal view returns(uint) {
    return IERC888(utilityToken).balanceOf(utilityTokenId, address(this));
  }

  function acceptAbstractToken_(uint _value) internal returns(bool){
    return IERC888(utilityToken).transferFrom(utilityTokenId, msg.sender, address(this), _value);
  }
  function releaseAbstractToken_(address _for, uint _value) internal returns(bool){
    return IERC888(utilityToken).transfer(utilityTokenId, _for, _value);
  }

  function getCassetteType_() internal pure returns(uint8){
    return CT_TOKEN;
  }

}