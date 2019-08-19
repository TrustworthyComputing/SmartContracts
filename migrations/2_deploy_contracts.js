var eBookie = artifacts.require("./eBookie.sol");

module.exports = function(deployer) {
  deployer.deploy(eBookie);
}
