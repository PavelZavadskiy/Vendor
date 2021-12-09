const truffleAssert = require('truffle-assertions');
import { assert, web3, artifacts } from "hardhat";

const Dai = artifacts.require("Dai");
const Sst = artifacts.require("Sst");
const Vendor = artifacts.require("Vendor")
const AgregatorDaiSst = artifacts.require("AgregatorDaiSst");
const AgregatorDaiSst_1 = artifacts.require("AgregatorDaiSst_1");
const AgregatorEthSst = artifacts.require("AgregatorEthSst");
const Test721 = artifacts.require("Test721");

const bn1e18 = web3.utils.toBN(1e18);
const bn1e17 = web3.utils.toBN(1e17);
const bn1e16 = web3.utils.toBN(1e16);

describe("Exchange", () => {
    let accounts: string[];
    let owner: any;
    let payer1: any;
    let payer2: any;
    let vendor: any;
    let sst: any;
    let dai_token: any;
    let agregator_dai_to_sst: any;
    let agregator_dai_to_sst_1: any;
    let agregator_eth_to_sst: any;
    let test721: any;
    const paymentAmount = bn1e18.muln(1);
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
  
    beforeEach(async function () {
        accounts = await web3.eth.getAccounts();
        owner = accounts[0];
        payer1 = accounts[1];
        payer2 = accounts[2];

        dai_token = await Dai.new();
        sst = await Sst.new();
        agregator_dai_to_sst = await AgregatorDaiSst.new();
        agregator_dai_to_sst_1 = await AgregatorDaiSst_1.new();        
        agregator_eth_to_sst = await AgregatorEthSst.new();
        test721 = await Test721.new();
        vendor = await Vendor.new(sst.address, agregator_eth_to_sst.address, test721.address);

        sst.mint(vendor.address, bn1e18.muln(1000), {from: owner});
        dai_token.mint(payer1, bn1e18.muln(50000), {from: owner});
        dai_token.mint(payer2, bn1e18.muln(50000), {from: owner});
        test721.mint(payer1, web3.utils.toBN("1"), {from: owner});
    });

    describe( "setApprovedToken", function() {
        it("Should setApprovedToken successfully", async () => {
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("0").eq(count_approved_tokens_before));
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_after));
        });

        it("Should not add token. Token address is 0", async () => {
            await truffleAssert.reverts(vendor.setApprovedToken(NULL_ADDRESS, agregator_dai_to_sst.address, {from: owner}), "Wrong input values!");
        });

        it("Should not add token. Agregator address is 0", async () => {
            await truffleAssert.reverts(vendor.setApprovedToken(dai_token.address, NULL_ADDRESS, {from: owner}), "Wrong input values!");
        });

        it("Should not add token. Sender isn't owner", async () => {
            await truffleAssert.reverts(vendor.setApprovedToken(dai_token.address, NULL_ADDRESS, {from: payer1}), "Ownable: caller is not the owner");
        });

        it("Should not add token. Token already exists", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_after));
            await truffleAssert.reverts(vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner}), "Token already exists!");
        });
    });

    describe( "removeApprovedToken", function() {
        it("Should removeApprovedToken successfully", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_before));
            await vendor.removeApprovedToken(dai_token.address, {from: owner});
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("0").eq(count_approved_tokens_after));
        });

        it("Should not remove token. Sender isn't owner", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_before));
            await truffleAssert.reverts(vendor.removeApprovedToken(dai_token.address, {from: payer1}), "Ownable: caller is not the owner");
        });

        it("Should not remove token. Token isn't exists", async () => {
            await truffleAssert.reverts(vendor.removeApprovedToken(dai_token.address, {from: owner}), "Token isn't exists!");
        });

        it("Should not remove token. Wrong input value", async () => {
            await truffleAssert.reverts(vendor.removeApprovedToken(NULL_ADDRESS, {from: owner}), "Wrong input value!");
        });
    });

    describe( "getCountApprovedTokens", function() {
        it("Should getCountApprovedTokens successfully", async () => {
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("0").eq(count_approved_tokens_before));
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_after));
        });
    });

    describe( "getInfoApprovedToken", function() {
        it("Should getInfoApprovedToken successfully", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_after));
            const {_adr, _name, _symbol} = await vendor.getInfoApprovedToken(web3.utils.toBN(0));
            assert.equal(_adr, dai_token.address);
            assert.equal(_name, "Dai Test Token");
            assert.equal(_symbol, "DAI");
        });

        it("Should be fail. Wrong token's index", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, web3.utils.toBN("1").eq(count_approved_tokens_after));
            await truffleAssert.reverts(vendor.getInfoApprovedToken(web3.utils.toBN(3)), "Wrong token's index!");
        });
    });

    describe( "buyToken", function() {
        it("Should successfully. Buying sst token for ether", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const expected_amount_sst_payer = web3.utils.toBN("464706547924000000000");
            const result =  await vendor.buyToken(NULL_ADDRESS, web3.utils.toBN("0"), {from: payer1, value: amount_eth_before});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));          
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(amount_eth_before)));
        });

        it("Should successfully. Buying sst token for dai", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const expected_amount_sst_payer = web3.utils.toBN("1000816750000000000");
            await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(1), {from: payer1});
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
        });

        it("Should successfully. Buying sst token for ether and dai", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const expected_amount_sst_payer = web3.utils.toBN("465707364674000000000");
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(dai_token.address, bn1e18.muln(1), {from: payer1, value: amount_eth_before});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve)).sub(amount_eth_before)));
        });

        it("Should successfully. Amount of tokens entered, no token address, ether entered", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const expected_amount_sst_payer = web3.utils.toBN("464706547924000000000");
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(NULL_ADDRESS, bn1e18.muln(1), {from: payer1, value: amount_eth_before});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve)).sub(amount_eth_before)));
        });

        it("Should successfully. Token address entered, no amount of tokens, ether entered", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const expected_amount_sst_payer = web3.utils.toBN("464706547924000000000");
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(dai_token.address, web3.utils.toBN("0"), {from: payer1, value: amount_eth_before});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve)).sub(amount_eth_before)));
        });

        it("Should be fail. You can't buy token! You have not ERC721 token! Buying sst token for ether and dai", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer2);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer2));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer2});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(dai_token.address, bn1e18.muln(1), {from: payer2, value: amount_eth_before});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer2);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer2));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. Your total amount of token is zerro! Amounts and address are not entered", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(NULL_ADDRESS, web3.utils.toBN("0"), {from: payer1, value: web3.utils.toBN("0")});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. Your total amount of token is zerro!! Amount of tokens entered, no token address, no ether", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(NULL_ADDRESS, bn1e18.muln(1), {from: payer1, value: web3.utils.toBN("0")});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. Your total amount of token is zerro!! Token address entered, no amount of tokens, no ether", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e17.muln(1);
            const resAprove = await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            const transaction_approve = await web3.eth.getTransaction(resAprove.tx);
            const used_gas_approve = web3.utils.toBN(resAprove.receipt.gasUsed);
            const gas_price_approve = web3.utils.toBN(transaction_approve.gasPrice);
            const result = await vendor.buyToken(dai_token.address, web3.utils.toBN("0"), {from: payer1, value: web3.utils.toBN("0")});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. You do not have enough ether in your balance", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            await dai_token.approve(vendor.address, bn1e18.muln(50001), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(50001), {from: payer1});
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. This token wasn't approved", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(1), {from: payer1});
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. You have not approved enough tokens", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(2), {from: payer1});
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. Sorry, there is not enough tokens to buy. No amount, no token address, ether entered", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_before_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_before = bn1e18.muln(10);
            const result = await vendor.buyToken(NULL_ADDRESS, web3.utils.toBN("0"), {from: payer1, value: amount_eth_before});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = web3.utils.toBN(await web3.eth.getBalance(payer1));
            const amount_eth_after_contract = web3.utils.toBN(await web3.eth.getBalance(vendor.address));  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price))));
        });

        it("Should be fail. Sorry, there is not enough tokens to buy. Amount and token address entered, no ether", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            await dai_token.approve(vendor.address, bn1e18.muln(1000), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(1000), {from: payer1});
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. Your total amount of token is zerro! Amount and token address entered, no ether", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst_1.address, {from: owner});
            await dai_token.approve(vendor.address, web3.utils.toBN("1"), {from: payer1});
            await vendor.buyToken(dai_token.address, web3.utils.toBN("1"), {from: payer1});
            const amount_sst_after_payer = await sst.balanceOf(payer1);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });
    });

    describe( "claimAll", function() {
        it("Should successfully. Claim ether", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            await vendor.buyToken(NULL_ADDRESS, web3.utils.toBN("0"), {from: payer1, value: bn1e17.muln(1)});
            const amount_eth_contract_before = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            assert.equal(true, amount_eth_contract_before.eq(bn1e17.muln(1)));
            const amount_eth_owner_before = web3.utils.toBN(await web3.eth.getBalance(owner));
            const result =  await vendor.claimAll({from: owner});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_eth_contract_after = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_owner_after = web3.utils.toBN(await web3.eth.getBalance(owner));
            assert.equal(true, amount_eth_contract_after.eq(web3.utils.toBN(0)));
            assert.equal(true, amount_eth_owner_after.eq(amount_eth_owner_before.add(amount_eth_contract_before).sub(used_gas.mul(gas_price))));
        });

        it("Should successfully. Claim dai", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            await vendor.buyToken(NULL_ADDRESS, web3.utils.toBN("0"), {from: payer1, value: bn1e17.muln(1)});
            const amount_eth_contract_before = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            assert.equal(true, amount_eth_contract_before.eq(bn1e17.muln(1)));
            const amount_eth_owner_before = web3.utils.toBN(await web3.eth.getBalance(owner));
            await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(1), {from: payer1});
            const amount_dai_contract_before = await dai_token.balanceOf(vendor.address);
            assert.equal(true, amount_dai_contract_before.eq(bn1e18.muln(1)));
            const result =  await vendor.claimAll({from: owner});
            const transaction = await web3.eth.getTransaction(result.tx);
            const used_gas = web3.utils.toBN(result.receipt.gasUsed);
            const gas_price = web3.utils.toBN(transaction.gasPrice);
            const amount_dai_contract_after = await dai_token.balanceOf(vendor.address);
            const amount_dai_owner_after = await dai_token.balanceOf(owner);
            assert.equal(true,amount_dai_owner_after.eq(amount_dai_contract_before));
            assert.equal(true,amount_dai_contract_after.eq(web3.utils.toBN("0")));
            const amount_eth_contract_after = web3.utils.toBN(await web3.eth.getBalance(vendor.address));
            const amount_eth_owner_after = web3.utils.toBN(await web3.eth.getBalance(owner));
            assert.equal(true, amount_eth_contract_after.eq(web3.utils.toBN(0)));
            assert.equal(true, amount_eth_owner_after.eq(amount_eth_owner_before.add(amount_eth_contract_before).sub(used_gas.mul(gas_price))));
        });

        it("Should successfully. Claim dai and ether", async () => {
            await vendor.setApprovedToken(dai_token.address, agregator_dai_to_sst.address, {from: owner});
            await dai_token.approve(vendor.address, bn1e18.muln(1), {from: payer1});
            await vendor.buyToken(dai_token.address, bn1e18.muln(1), {from: payer1});
            const amount_dai_contract_before = await dai_token.balanceOf(vendor.address);
            assert.equal(true, amount_dai_contract_before.eq(bn1e18.muln(1)));
            await vendor.claimAll({from: owner});
            const amount_dai_contract_after = await dai_token.balanceOf(vendor.address);
            const amount_dai_owner_after = await dai_token.balanceOf(owner);
            assert.equal(true,amount_dai_owner_after.eq(amount_dai_contract_before));
            assert.equal(true,amount_dai_contract_after.eq(web3.utils.toBN("0")));
        });

        it("Should be fail. Ownable: caller is not the owner", async () => {
            await truffleAssert.reverts(vendor.claimAll({from: payer1}), "Ownable: caller is not the owner");
        });
    });
});

