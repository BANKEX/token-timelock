pragma solidity ^0.4.23;
import "../abstract/TimeMachine/TimeMachineP.sol";
import "../abstract/Timelock/SafeERC20Timelock.sol";




contract SafeERC20TimelockProd is TimeMachineP, SafeERC20Timelock {
  constructor (address _token) public SafeERC20Timelock(_token) {
  }
}
