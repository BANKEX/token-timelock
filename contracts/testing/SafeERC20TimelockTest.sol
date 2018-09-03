pragma solidity ^0.4.23;
import "../abstract/TimeMachine/TimeMachineT.sol";
import "../abstract/Timelock/SafeERC20Timelock.sol";




contract SafeERC20TimelockTest is TimeMachineT, SafeERC20Timelock {
  constructor (address _token) public SafeERC20Timelock(_token) {
  }
}
