pragma solidity ^0.4.23;

import "./ITimeMachine.sol";

/**
* @dev TimeMachine implementation for production
*/
  
contract TimeMachineP is ITimeMachine {
  /**
  * @dev get current real timestamp
  * @return current real timestamp
  */
  function getTimestamp_() internal view returns(uint) {
    return block.timestamp;
  }
}
