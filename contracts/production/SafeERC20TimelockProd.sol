pragma solidity ^0.4.23;
import "../abstract/TimeMachine/TimeMachineP.sol";
import "../abstract/Timelock/SafeERC20Timelock.sol";




contract SafeERC20TimelockTest is TimeMachineP, SafeERC20Timelock {
}