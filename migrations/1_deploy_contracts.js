require('dotenv').config();

let Exchange = artifacts.require("./Exchange.sol");

module.exports = async function (deployer) {
    await deployer.deploy(Exchange, process.env.SST_AGREGATOR, process.env.DAI_ADDRESS, process.env.DAI_AGREGATOR);
}