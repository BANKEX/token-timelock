pragma solidity ^0.4.23;
import "../abstract/TimeMachine/TimeMachineT.sol";
import "../abstract/Cassette/EtherCassette.sol";
import "../abstract/Timelock/Timelock.sol";




contract TimelockEther is EtherCassette, TimeMachineT, Timelock {
  
}
