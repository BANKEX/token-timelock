const TimelockERC20 = artifacts.require('TimelockERC20Test');
const SafeERC20TimelockTest = artifacts.require('SafeERC20TimelockTest');
const ERC20 = artifacts.require('ERC20');
const web3 = global.web3;
const uint = v => web3.utils.toBN(v)
const util = require('web3-utils');

function functionData(name,types,binaryArgs) {
    let functionInterface = `${name}(${types})`
    let functionData = `${name}(${binaryArgs})`
    let hash = remove0x(util.keccak256(functionInterface)).substring(0,8)
    return `0x${hash}${binaryArgs.split(",").join("")}`
}
function remove0x(value) {
    if (value.startsWith("0x")) {
        return value.substring(2,value.length)
    } else {
        return value
    }
}
function uint256Bin(value) {
    // Превращает 0x64 в string 0000000000000000000000000000000000000000000000000000000000000064
    return remove0x(util.padLeft(value, 64));
}
function addressBin(value) {
    // Превращаем 160бит address в 256бит
    return "000000000000000000000000"+remove0x(value)
}

let address = addressBin("CA35b7d915458EF540aDe6068dFe2F44E8fa733c")
let value = uint256Bin(0x1448)
functionData("getData", "address,uint256", `${address},${value}`)
console.log("done")



contract('SafeERC20Timelock', async(accounts) => {


    let erc20;
    let contract;
    let time = uint(75785)
    const admin = accounts[0];
    const owner = accounts[1];
    const recipient = accounts[2];

    const fromOwner = { from: owner };
    const fromRecipient = { from: recipient };
    const fromAdmin = { from: admin };

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
    async function checkBalance(ownerBalance,recipientBalance,contractBalance) {
        let cbOwner = await erc20.balanceOf(owner)
        let cbRecipient = await erc20.balanceOf(recipient)
        let cbContract = await erc20.balanceOf(contract.address)
        let balances = `{ owner: ${cbOwner}, recipient: ${cbRecipient}, contract: ${cbContract} }`
        assert(cbOwner.eq(uint(ownerBalance)),`owner.balance(${cbOwner}) != ${ownerBalance} ${balances}`)
        assert(cbRecipient.eq(uint(recipientBalance)),`recipient.balance(${cbRecipient}) != ${recipientBalance} ${balances}`)
        assert(cbContract.eq(uint(contractBalance)),`contract.balance(${cbContract}) != ${contractBalance} ${balances}`)
    }
    it('getting balance back', async() => {
        erc20 = await ERC20.new(uint(200),fromOwner)
        contract = await SafeERC20TimelockTest.new(erc20.address,fromAdmin)

        await erc20.approve(contract.address,uint(100), fromOwner)
        await contract.accept(recipient, time, uint(100), fromOwner)
        await checkBalance(100,0,100)

        // sending random balance
        await erc20.transfer(contract.address,uint(100),fromOwner)
        await checkBalance(0,0,200)
        let data = functionData("transfer","address,uint256", `${addressBin(owner)},${uint256Bin(100)}`)
        await contract.execute(erc20.address,data,fromAdmin)
        await checkBalance(100,0,100)

        await contract.release([time],[100],fromRecipient)
        await checkBalance(100,100,0)
    })


    it('sending balance from different erc20 token', async() => {
        erc20 = await ERC20.new(uint(100),fromRecipient)
        contract = await SafeERC20TimelockTest.new(erc20.address,fromAdmin)
        erc20 = await ERC20.new(uint(100),fromOwner)

        await checkBalance(100,0,0)
        await erc20.transfer(contract.address,uint(100),fromOwner)
        await checkBalance(0,0,100)
        let data = functionData("transfer","address,uint256", `${addressBin(owner)},${uint256Bin(100)}`)

        await contract.execute(erc20.address,data,fromAdmin)
        await checkBalance(100,0,0)
    })

    it('trying to get more balance than sended', async() => {
        erc20 = await ERC20.new(uint(200),fromOwner)
        contract = await SafeERC20TimelockTest.new(erc20.address,fromAdmin)

        // approving contract to get 100 balance from owner
        await erc20.approve(contract.address,uint(100), fromOwner)
        await contract.accept(recipient, time, uint(100), fromOwner)
        await checkBalance(100,0,100)

        // sending random balance
        await erc20.transfer(contract.address,uint(100),fromOwner)
        await checkBalance(0,0,200)
        let data = functionData("transfer","address,uint256", `${addressBin(owner)},${uint256Bin(200)}`)
        await assertRevert(contract.execute(erc20.address,data,fromAdmin))
        await checkBalance(0,0,200)

        await contract.release([time],[100],fromRecipient)
        await checkBalance(0,100,100)
    })

    it('trying to steal balance that contract dont have', async() => {
        erc20 = await ERC20.new(uint(100),fromOwner)
        contract = await SafeERC20TimelockTest.new(erc20.address,fromAdmin)

        await checkBalance(100,0,0)
        await erc20.transfer(contract.address,uint(100),fromOwner)
        await checkBalance(0,0,100)
        let data = functionData("transfer","address,uint256", `${addressBin(owner)},${uint256Bin(200)}`)

        await assertRevert(contract.execute(erc20.address,data,fromAdmin))
        await checkBalance(0,0,100)
    })
})
