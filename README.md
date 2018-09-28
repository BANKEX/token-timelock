# Token Timelock
## About
Token timelock smart contract. Use /contracts/production/TimelockERC20.sol for lock ERC20 tokens.

### TimelockERC20
This contract allows you to send some tokens, but receiver can't take them until the set date.

### SafeERC20Timelock
This contract allows you to get accidentally sent balance back (by contacting with contract owner)

## Usage
Sender should approve to send balance in ERC20 token using
`function approve(address _spender, uint _value)`
* _spender is your contract address
* _value is number of tokens to send

Then sender can send tokens to contract
`function accept(address _for, uint _timestamp, uint _tvalue)`
* _for is recipient address.
* _timestamp is date until recipient can't get his balance.
* _tvalue is number of tokens to send

Then recipient should call release to get his balance using:
`function release(uint[] _timestamp, uint[] _value)`
Should be in order timestamp[n] -> value[n]

Contract owner can call:
`function saveLockedERC20Tokens(address _token, address _to, uint  _amount)`
To restore accidentally sent tokens back to sender.

## Testing

* Run ganache-cli or other test RPC

```
git clone https://github.com/BANKEX/token-timelock.git
cd token-timelock
npm install
truffle test
```
