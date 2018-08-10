pragma solidity ^0.4.23;
import "../../libs/math/SafeMath.sol";
import "../../libs/ownership/Ownable.sol";
import "../TimeMachine/ITimeMachine.sol";
import "../Cassette/ICassette.sol";

/*
 Отправляет передачу средств другому пользователю с таймаутом.
 Пока время не пройдёт, получатель не сможет забрать эти средства.
 Без знания таймкода получатель не сможет забрать эти средства.
 Админ может подтвердить любую передачу по таймкоду и адресу получателя.

*/


contract Timelock is ICassette, ITimeMachine, Ownable {
  using SafeMath for uint;

  event Lock(address indexed _for);
  event Withdraw(address indexed _for, uint value);



  mapping (address => mapping(uint => uint)) public balance;




  function accept(address _for, uint _timestamp, uint _tvalue) public payable returns(bool){
    uint _value;
    if(getCassetteType_()==CT_ETHER) {
      _value = msg.value;
    } else if (getCassetteType_()==CT_TOKEN) {
      _value = _tvalue;
      require(acceptAbstractToken_(_value));
    } else revert();
    uint _balance = balance[_for][_timestamp];
    if (_balance == 0 ) {
      emit Lock(_for);
    }
    balance[_for][_timestamp] = _balance.add(_value);
    return true;
  }



  function release_(address _for, uint[] _timestamp, uint[] _value) internal returns(bool) {
    uint _len = _timestamp.length;
    require(_timestamp.length == _value.length);
    uint _totalValue;
    uint _curValue;
    uint _curTimestamp;
    uint _subValue;
    uint _now = getTimestamp_();
    for (uint i = 0; i < _len; i++){
      _curValue = balance[_for][_timestamp[i]];
      _subValue = _value[i];
      _curTimestamp = _timestamp[i];
      require(_curValue >= _subValue);
      require(_curTimestamp <= _now);
      balance[_for][_timestamp[i]] = _curValue.sub(_subValue);
      _totalValue = _totalValue.add(_subValue);
    }
    releaseAbstractToken_(_for, _totalValue);
    emit Withdraw(_for, _totalValue);
    return true;
  }

  function release(uint[] _timestamp, uint[] _value) external returns(bool) {
    return release_(msg.sender, _timestamp, _value);
  }

  function releaseForce(address _for, uint[] _timestamp, uint[] _value) onlyOwner external returns(bool) {
    return release_(_for, _timestamp, _value);
  }

}
