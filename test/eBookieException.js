//contract to be tested
var eBookie = artifacts.require("./eBookie.sol");

//test suite
contract("eBookie", function(accounts) {
  var eBookieInstance;
  var bookie = accounts[8];
  var bettor = accounts[9];
  var name= "Game 1";
  var bettorTeamID= 111;
  var wager = 1;
  var odds = 5;
  var toWin = 5;

  //no bet offered yet
  it("should throw an exception if you try to place a bet with no bet offered", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance= instance;
      return eBookieInstance.placeBet(1, {
        from: bettor,
        value: web3.toWei(wager, "ether")
      });
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return eBookieInstance.getNumberOfBets();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "number of bets must be 0");
    });
  });

  //place a bet that doesn't exist
  it("should throw an exception if you try to place a bet that does not exist", function () {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance = instance;
      //console.log(web3.eth.getBalance(bookie).toNumber());
      return eBookieInstance.offerBet(name, bettorTeamID, odds, {from: bookie, value: web3.toWei(toWin, "ether")});
    }).then(function(receipt) {
      //console.log(web3.eth.getBalance(bookie).toNumber());
      return eBookieInstance.placeBet(2, {from: bettor, value: web3.toWei(wager, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return eBookieInstance.book(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "bet id must be 1");
      assert.equal(data[1], bookie, "bookie must be "+ bookie);
      assert.equal(data[2], 0x0, "bettor must be empty");
      assert.equal(data[3], name, "Bet name must be "+name);
      assert.equal(data[4].toNumber(), bettorTeamID, "bettorTeamID must be "+bettorTeamID);
      assert.equal(data[5].toNumber(), web3.toWei(wager, "ether"), "wager must be " +web3.toWei(wager, "ether"));
      assert.equal(data[6].toNumber(), odds, "odds must be "+odds);
      assert.equal(data[7].toNumber(), web3.toWei(toWin, "ether"), "toWin must be "+web3.toWei(toWin, "ether"));
    });
  });

  //placing a bet you offered
  it("should throw an exception if you try to place your own bet", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance= instance;
        return eBookieInstance.placeBet(1, {from:bookie, value: web3.toWei(wager, "ether")});
      }).then(assert.fail)
      .catch(function(error) {
        assert(true);
      }).then(function() {
        return eBookieInstance.book(1);
      }).then(function(data) {
        assert.equal(data[0].toNumber(), 1, "bet id must be 1");
        assert.equal(data[1], bookie, "bookie must be "+ bookie);
        assert.equal(data[2], 0x0, "bettor must be empty");
        assert.equal(data[3], name, "Bet name must be "+name);
        assert.equal(data[4].toNumber(), bettorTeamID, "bettorTeamID must be "+bettorTeamID);
        assert.equal(data[5].toNumber(), web3.toWei(wager, "ether"), "wager must be " +web3.toWei(wager, "ether"));
        assert.equal(data[6].toNumber(), odds, "odds must be "+odds);
        assert.equal(data[7].toNumber(), web3.toWei(toWin, "ether"), "toWin must be "+web3.toWei(toWin, "ether"));
        assert.equal(data[8], 0x0, "winner must be empty");
      });
    });

  //incorrect value
  it("should throw an exception if you try to place a bet for a value different from wager amount", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance= instance;
      return eBookieInstance.placeBet(1, {from:bettor, value: web3.toWei(wager+1, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return eBookieInstance.book(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "bet id must be 1");
      assert.equal(data[1], bookie, "bookie must be "+ bookie);
      assert.equal(data[2], 0x0, "bettor must be empty");
      assert.equal(data[3], name, "Bet name must be "+name);
      assert.equal(data[4].toNumber(), bettorTeamID, "bettorTeamID must be "+bettorTeamID);
      assert.equal(data[5].toNumber(), web3.toWei(wager, "ether"), "wager must be " +web3.toWei(wager, "ether"));
      assert.equal(data[6].toNumber(), odds, "odds must be "+odds);
      assert.equal(data[7].toNumber(), web3.toWei(toWin, "ether"), "toWin must be "+web3.toWei(toWin, "ether"));
      assert.equal(data[8], 0x0, "winner must be empty");
    });
  });

  //bet has already been placed
  it("should throw an exception if you try to place a bet that has already been placed", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance= instance;
      return eBookieInstance.placeBet(1, {from:bettor, value: web3.toWei(wager, "ether")});
    }).then(function() {
      return eBookieInstance.placeBet(1, {from: web3.eth.accounts[3], value: web3.toWei(wager, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return eBookieInstance.book(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "bet id must be 1");
      assert.equal(data[1], bookie, "bookie must be "+ bookie);
      assert.equal(data[2], bettor, "bettor must be "+bettor);
      assert.equal(data[3], name, "Bet name must be "+name);
      assert.equal(data[4].toNumber(), bettorTeamID, "bettorTeamID must be "+bettorTeamID);
      assert.equal(data[5].toNumber(), web3.toWei(wager, "ether"), "wager must be " +web3.toWei(wager, "ether"));
      assert.equal(data[6].toNumber(), odds, "odds must be "+odds);
      assert.equal(data[7].toNumber(), web3.toWei(toWin, "ether"), "toWin must be "+web3.toWei(toWin, "ether"));
      assert.equal(data[8], 0x0, "winner must be empty");
    });
  });

});
