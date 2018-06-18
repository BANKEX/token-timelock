const TokensTransfer = artifacts.require('TokensTransfer');
const TestERC20Token = artifacts.require('TestERC20Token');


contract('TokensTransfer', async(accounts) => {

    const admin = accounts[9];

    const owner = accounts[0];
    const recipient = accounts[1];

    const fromOwner = { from: owner};
    const fromRecipient = { from: recipient };
    const fromAdmin = { from: admin };

    let tokenInstance;
    let tokenTransferInstance;

    let token;

    beforeEach(async () => {

        tokenInstance = await TestERC20Token.new("Test token", "TST", fromOwner );
        token = tokenInstance.address;
        tokenTransferInstance = await TokensTransfer.new([admin]);


        const balance = await tokenInstance.balanceOf(owner);
        const totalSupply = await tokenInstance.totalSupply();
        // console.log(balance.toString());
        // console.log(totalSupply.toString());
    });


    it('should send tokens to the contract', async() => {

        const amount = web3.toWei('100', 'ether');
        const amount10 = web3.toWei('1000', 'ether');

        await tokenInstance.approve(tokenTransferInstance.address, amount10, fromOwner );

        const releaseTimestamp = nowInSeconds() + 60;


        await tokenTransferInstance.acceptTokens(recipient, token, releaseTimestamp - 100, 0, amount, fromOwner);
        await tokenTransferInstance.acceptTokens(recipient, token, (releaseTimestamp + 100), releaseTimestamp - 100, amount, fromOwner);
        await tokenTransferInstance.acceptTokens(recipient, token, releaseTimestamp + 200, (releaseTimestamp + 100), amount, fromOwner);


        const totalBalance = await  tokenTransferInstance.getTotalBalance(recipient, token);
        console.log(`totalBalance: ${web3.fromWei(totalBalance.toString(), 'ether')}`);

        const balanceAt = await tokenTransferInstance.getBalanceAt(recipient, token, releaseTimestamp+100);
        console.log(`balanceAt: ${web3.fromWei(balanceAt.toString(), 'ether')}`);

        const balance = await tokenTransferInstance.getBalance(recipient, token);
        console.log(`balance: ${web3.fromWei(balance.toString(), 'ether')}`);

        // await tokenTransferInstance.release(token, 2*amount, fromRecipient);
        // const releaseBalance = await tokenInstance.balanceOf(recipient);
        // console.log(`releaseBalance: ${web3.fromWei(releaseBalance.toString(), 'ether')}`);

        await tokenTransferInstance.releaseForce(recipient, token, amount/2, fromAdmin);
        const releaseBalance = await tokenInstance.balanceOf(recipient);
        console.log(`releaseBalance: ${web3.fromWei(releaseBalance.toString(), 'ether')}`);


    });


    function nowInSeconds() {
        return Math.floor(Date.now()/1000);
    }

});