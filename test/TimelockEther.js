
const TimelockEther = artifacts.require('TimelockEtherTest');
const web3 = global.web3;
const uint = v => web3.toBigNumber(v)
const num = v => web3.fromBigNumber(v)
const eth = v => web3.toWei(v, "ether")

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

contract('TimelockEther', async(accounts) => {
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

    beforeEach(async () => {
        contract = await TimelockEther.new(fromAdmin)
        let currentBalance = web3.eth.getBalance(owner)
        let requiredBalance = eth(1)
        assert(currentBalance > requiredBalance,"not enough eth")
    })
    it('sending $100 and unlocking now', async() => {
        await contract.accept(owner, uint(now), uint(0), { value: eth(1) })
    })
    it('sending $100 locked for 1 minute', async() => {
        await contract.accept(recipient, uint(now+minute), uint(0), { value: eth(1) })
    })
    it('sending $100 unlocked 1 minute ago', async() => {
        await contract.accept(recipient, uint(now-minute), uint(0), { value: eth(1) })
    })
    it('getting unlocked $100', async() => {
        let time = uint(now-minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await contract.release([time],[eth(1)],fromRecipient)
    })
    it('trying to take locked $100', async() => {
        let time = uint(now+minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await assertRevert(contract.release([time],[eth(1)],fromRecipient))
    })
    it('waiting for unlock date and taking $100', async() => {
        let time = uint(now+minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await contract.setTimestamp(time)
        await contract.release([time],[eth(1)],fromRecipient)
    })
    it('trying to take $100, waiting and taking $100', async() => {
        let time = uint(now+minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await assertRevert(contract.release([time],[eth(1)],fromRecipient))
        await contract.setTimestamp(time)
        await contract.release([time],[eth(1)],fromRecipient)
    })
    it('sending $10 multiple times at the same timecode', async() => {
        let time = uint(now-minute)
        for (var i = 0; i < 10; i++) {
            await contract.accept(recipient, time, uint(0), { value: eth(0.1) })
        }
        await contract.release([time],[eth(1)],fromRecipient)
    })
    it('sending $10 multiple times at the different timecodes', async() => {
        let array = [];
        for (var i = 1; i <= 10; i++) {
            array.push(uint(now+minute*i))
        }
        let values = array.map(_ => 10)

        await array.forEach(async function(timecode) {
            await contract.accept(recipient, timecode, uint(0), { value: eth(0.1) })
        });
        await contract.setTimestamp(uint(now+minute*10))
        await contract.release(array,values,fromRecipient)
    })
    it('trying to take some money from incompleted timecodes', async() => {
        let array = [];
        for (var i = 1; i <= 10; i++) {
            array.push(uint(now+minute*i))
        }
        let values = array.map(_ => eth(0.1))

        await array.forEach(async function(timecode) {
            await contract.accept(recipient, timecode, uint(0), { value: eth(0.1) })
        });
        await assertRevert(contract.release(array,values,fromRecipient))
    })
    it('trying to take some money from half incompleted and half completed timecodes', async() => {
        let array = [];
        for (var i = 1; i <= 10; i++) {
            array.push(uint(now+minute*i))
        }
        let values = array.map(_ => eth(0.1))

        await array.forEach(async function(timecode) {
            await contract.accept(recipient, timecode, uint(0), { value: eth(0.1) })
        });
        await contract.setTimestamp(uint(now+minute*5))
        await assertRevert(contract.release(array,values,fromRecipient))
    })
    it('trying release $100 from different address ', async() => {
        let time = uint(now-minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await assertRevert(contract.release([time],[eth(1)],fromAdmin))
    })
    it('force releasing $100 by admin', async() => {
        let time = uint(now-minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await contract.releaseForce(recipient,[time],[eth(1)],fromAdmin)
    })
    it('trying to force release $100 not by admin', async() => {
        let time = uint(now-minute)
        await contract.accept(recipient, time, uint(0), { value: eth(1) })
        await assertRevert(contract.releaseForce(recipient,[time],[eth(1)]))
    })
})
