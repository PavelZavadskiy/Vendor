require('dotenv').config();

let Vendor = artifacts.require("./Vendor.sol");

module.exports = async function (deployer) {
    await deployer.deploy(Vendor, process.env.SST_TOKEN, process.env.SST_AGREGATOR, process.env.ERC721_ADDRESS);
}