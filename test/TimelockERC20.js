
const TimelockERC20 = artifacts.require('TimelockERC20');
const ERC20 = artifacts.require('ERC20');
const web3 = global.web3;
const uint = v => web3.toBigNumber(v)
const num = v => web3.fromBigNumber(v)

async function assertRevert (promise) {
    try {
        await promise;
    } catch (error) {
        const revertFound = error.message.search('revert') >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
        return;
    }
    assert.fail('Expected revert not received');
}

contract('TimelockERC20', async(accounts) => {
    const admin = accounts[9];

    const owner = accounts[0];
    const recipient = accounts[1];

    const fromOwner = { from: owner };
    const fromRecipient = { from: recipient };
    const fromAdmin = { from: admin };

    let erc20;
    let contract;

    let now = Math.floor(Date.now()/1000);
    let minute = 60;
    let result;

    async function checkBalance(ownerBalance,recipientBalance,contractBalance) {
        let current = await erc20.balanceOf(owner)
        assert.equal(current,ownerBalance,`owner.balance(${current}) != ${ownerBalance}`)
        current = await erc20.balanceOf(recipient)
        assert.equal(current,recipientBalance,`recipient.balance(${current}) != ${recipientBalance}`)
        current = await erc20.balanceOf(contract.address)
        assert.equal(current,contractBalance,`contract.balance(${current}) != ${contractBalance}`)
    }

    beforeEach(async () => {
        // Creating ERC20 contract with 100 balance
        erc20 = await ERC20.new(uint(100))

        // Creating TimelockERC20 contract by admin
        contract = await TimelockERC20.new(erc20.address,fromAdmin)
    })

    it('should create contract', async() => {
        // Checking current balance
        let currentBalance = await erc20.balanceOf(owner)
        assert.equal(currentBalance,100)
    })
    it('approving $100 to send', async() => {
        // Approving
        await erc20.approve(owner,100)

        // Checking approved balance
        let allowedToTransfer = await erc20.allowance(owner,owner)
        assert.equal(allowedToTransfer,100)
    })
    it('sending $100 and unlocking now', async() => {
        // Checking current balance (sender,receiver,contract)
        await checkBalance(100,0,0)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to owner
        await contract.accept(owner, uint(now), uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
    it('sending $100 locked for 1 minute', async() => {
        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to owner with minute timeout
        await contract.accept(recipient, uint(now+minute), uint(100))
    })
    it('sending $100 unlocked 1 minute ago', async() => {
        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to owner with -1 minute timeout
        await contract.accept(recipient, uint(now-minute), uint(100))
    })
    it('getting unlocked $100', async() => {
        let time = uint(now-minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to recipient with -1 minute timeout
        await contract.accept(recipient, time, uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Receiving balance
        await contract.release([time],[100],fromRecipient)

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,100,0)
    })
    it('trying to take locked $100', async() => {
        let time = uint(now+minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to recipient with 1 minute timeout
        await contract.accept(recipient, time, uint(100))

        // Recipient trying to get his balance, but timeout is not ended
        await assertRevert(contract.release([time],[100],fromRecipient))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
    it('waiting for unlock date and taking $100', async() => {
        let time = uint(now+minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to recipient with 1 minute timeout
        await contract.accept(recipient, time, uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Waiting 1 minute
        await contract.setTimestamp(time)

        // Receiving balance
        await contract.release([time],[100],fromRecipient)

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,100,0)
    })
    it('trying to take $100, waiting and taking $100', async() => {
        let time = uint(now+minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 100 to recipient with 1 minute timeout
        await contract.accept(recipient, time, uint(100))

        // Recipient trying to get his balance, but timeout is not ended
        await assertRevert(contract.release([time],[100],fromRecipient))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Waiting 1 minute
        await contract.setTimestamp(time)

        // Receiving balance
        await contract.release([time],[100],fromRecipient)

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,100,0)
    })
    it('sending $10 multiple times at the same timecode', async() => {
        let time = uint(now-minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)

        // Sending 10 to recipient 10 times with -1 minute timeout
        for (var i = 0; i < 10; i++) {
            await contract.accept(recipient, time, uint(10))
        }

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Receiving balance
        await contract.release([time],[100],fromRecipient)

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,100,0)
    })
    it('sending $10 multiple times at the different timecodes', async() => {
        let array = [];
        for (var i = 1; i <= 10; i++) {
            array.push(uint(now+minute*i))
        }
        let values = array.map(_ => 10)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await array.forEach(async function(timecode) {
            await contract.accept(recipient, timecode, uint(10))
        });

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Waiting 10 minutes
        await contract.setTimestamp(uint(now+minute*10))

        // Receiving balance
        await contract.release(array,values,fromRecipient)

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,100,0)
    })
    it('trying to take some money from incompleted timecodes', async() => {
        let array = [];
        for (var i = 1; i <= 10; i++) {
            array.push(uint(now+minute*i))
        }
        let values = array.map(_ => 10)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await array.forEach(async function(timecode) {
            await contract.accept(recipient, timecode, uint(10))
        });

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Recipient trying to get his balance, but timeout is not ended
        await assertRevert(contract.release(array,values,fromRecipient))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
    it('trying to take some money from half incompleted and half completed timecodes', async() => {
        let array = [];
        for (var i = 1; i <= 10; i++) {
            array.push(uint(now+minute*i))
        }
        let values = array.map(_ => 10)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await array.forEach(async function(timecode) {
            await contract.accept(recipient, timecode, uint(10))
        });

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Waiting 5 minutes
        await contract.setTimestamp(uint(now+minute*5))

        // Recipient trying to get his balance, but timeout is not ended
        await assertRevert(contract.release(array,values,fromRecipient))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
    it('trying to send $100 without approve', async() => {
        let time = uint(now-minute)
        await assertRevert(contract.accept(recipient, time, uint(100)))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(100,0,0)

        await assertRevert(contract.release([time],[100],fromRecipient))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(100,0,0)
    })
    it('trying release $100 from different address ', async() => {
        let time = uint(now-minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await contract.accept(recipient, time, uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Someone trying to take other user balance
        await assertRevert(contract.release([time],[100],fromAdmin))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
    it('force releasing $100 by admin', async() => {
        let time = uint(now-minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await contract.accept(recipient, time, uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Admin accepting request
        await contract.releaseForce(recipient,[time],[100],fromAdmin)

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,100,0)
    })
    it('admin cannot release when timeout is not ended', async() => {
        let time = uint(now+minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await contract.accept(recipient, time, uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Admin trying to release operation but timeout is not ended
        await assertRevert(contract.releaseForce(recipient,[time],[100],fromAdmin))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
    it('trying to force release $100 not by admin', async() => {
        let time = uint(now-minute)

        // Approving contract to take 100 from senders balance
        await erc20.approve(contract.address,100)
        await contract.accept(recipient, time, uint(100))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)

        // Someone trying to accept request when timeout is not ended
        await assertRevert(contract.releaseForce(recipient,[time],[100]))

        // Checking current balance (sender,receiver,contract)
        await checkBalance(0,0,100)
    })
})
