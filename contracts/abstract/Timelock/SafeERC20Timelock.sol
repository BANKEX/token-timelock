pragma solidity ^0.4.23;
import "../../libs/math/SafeMath.sol";
import "../../libs/ownership/Ownable.sol";
import "../TimeMachine/ITimeMachine.sol";
import "../../libs/token/ERC20/IERC20.sol";



contract SafeERC20Timelock is ITimeMachine, Ownable {
  using SafeMath for uint;

  event Lock(address indexed _from, address indexed _for, uint indexed timestamp, uint value);
  event Withdraw(address indexed _for, uint indexed timestamp, uint value);



  mapping (address => mapping(uint => uint)) public balance;
  IERC20 public token;
  uint public totalBalance;

  constructor (address _token) public {
    token = IERC20(_token);
  }

  function contractBalance_() internal view returns(uint) {
    return token.balanceOf(this);
  }

  /**
  * @dev accept token into timelock
  * @param _for address of future tokenholder
  * @param _timestamp lock timestamp
  * @return result of operation: true if success
  */
  function accept(address _for, uint _timestamp, uint _tvalue) public returns(bool){
    require(_for != address(0));
    require(_for != address(this));
    require(_timestamp > getTimestamp_());
    require(_tvalue > 0);
    uint _contractBalance = contractBalance_();
    uint _balance = balance[_for][_timestamp];
    uint _totalBalance = totalBalance;
    token.transferFrom(msg.sender, this, _tvalue);
    uint _value = contractBalance_().sub(_contractBalance);
    balance[_for][_timestamp] = _balance.add(_value);
    totalBalance = _totalBalance.add(_value);
    emit Lock(msg.sender, _for, _timestamp, _value);
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
    require(_len == _value.length);
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
    totalBalance = totalBalance.sub(_totalValue);
    token.transfer(_for, _totalValue);
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

  /**
  * @dev Allow to use functions of other contract from this contract
  * @param _token address of ERC20 contract to call
  * @param _to address to transfer ERC20 tokens
  * @param _amount amount to transfer
  * @return result of operation, true if success
  */
  function saveLockedERC20Tokens(address _token, address _to, uint  _amount) onlyOwner external returns (bool) {
    IERC20(_token).transfer(_to, _amount);
    require(totalBalance <= contractBalance_());
    return true;
  }

  function () public payable {
    revert();
  }

}
