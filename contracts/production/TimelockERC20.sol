pragma solidity ^0.4.23;
import "../abstract/TimeMachine/TimeMachineP.sol";
import "../abstract/Cassette/ERC20Cassette.sol";
import "../abstract/Timelock/Timelock.sol";




contract TimelockERC20 is ERC20Cassette, TimeMachineP, Timelock {
  constructor (address _utilityToken) public {
    utilityToken = _utilityToken;
  }

}