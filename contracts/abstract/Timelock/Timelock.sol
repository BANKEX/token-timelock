pragma solidity ^0.4.23;
import "../../libs/math/SafeMath.sol";
import "../../libs/ownership/Ownable.sol";
import "../TimeMachine/ITimeMachine.sol";
import "../Cassette/ICassette.sol";



contract Timelock is ICassette, ITimeMachine, Ownable {
  using SafeMath for uint;

  event Lock(address indexed _from, address indexed _for, uint indexed timestamp, uint value);
  event Withdraw(address indexed _for, uint indexed timestamp, uint value);



  mapping (address => mapping(uint => uint)) public balance;



  /**
  * @dev accept token into timelock
  * @param _for address of future tokenholder
  * @param _timestamp lock timestamp
  * @return result of operation: true if success
  */
  function accept(address _for, uint _timestamp, uint _tvalue) public payable returns(bool){
    uint _value;
    if(getCassetteType_()==CT_ETHER) {
      _value = msg.value;
    } else if (getCassetteType_()==CT_TOKEN) {
      require(msg.value == 0);
      _value = _tvalue;
      require(acceptAbstractToken_(_value));
    } else revert();
    uint _balance = balance[_for][_timestamp];
    emit Lock(msg.sender, _for, _timestamp, _value);
    balance[_for][_timestamp] = _balance.add(_value);
    return true;
  }


  /**
  * @dev release timelock tokens
  * @param _for address of future tokenholder
  * @param _timestamp array of timestamps to unlock
  * @param _value array of amounts to unlock
  * @return result of operation: true if success
  */
  function release_(address _for, uint[] _timestamp, uint[] _value) internal returns(bool) {
    uint _len = _timestamp.length;
    require(_timestamp.length == _value.length);
    uint _totalValue;
    uint _curValue;
    uint _curTimestamp;
    uint _subValue;
    uint _now = getTimestamp_();
    for (uint i = 0; i < _len; i++){
      _curTimestamp = _timestamp[i];
      _curValue = balance[_for][_curTimestamp];
      _subValue = _value[i];
      require(_curValue >= _subValue);
      require(_curTimestamp <= _now);
      balance[_for][_curTimestamp] = _curValue.sub(_subValue);
      _totalValue = _totalValue.add(_subValue);
      emit Withdraw(_for, _curTimestamp, _subValue);
    }
    releaseAbstractToken_(_for, _totalValue);
    return true;
  }


  /**
  * @dev release timelock tokens
  * @param _timestamp array of timestamps to unlock
  * @param _value array of amounts to unlock
  * @return result of operation: true if success
  */
  function release(uint[] _timestamp, uint[] _value) external returns(bool) {
    return release_(msg.sender, _timestamp, _value);
  }

  /**
  * @dev release timelock tokens by force
  * @param _for address of future tokenholder
  * @param _timestamp array of timestamps to unlock
  * @param _value array of amounts to unlock
  * @return result of operation: true if success
  */
  function releaseForce(address _for, uint[] _timestamp, uint[] _value) onlyOwner external returns(bool) {
    return release_(_for, _timestamp, _value);
  }

}
