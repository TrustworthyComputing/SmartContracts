var eBookie = artifacts.require("./eBookie.sol");

//test suite
contract('eBookie', function(accounts) {
  var eBookieInstance;
  var bookie = accounts[1];
  var bettor = accounts[2];
  var name1 = "Game 1";
  var bettorTeamID1 = 111;
  var wager1 = 1;
  var odds1 = 5;
  var toWin1 = 5;
  var name2 = "Game 2";
  var bettorTeamID2 = 222;
  var wager2 = 1;
  var odds2 = 10;
  var toWin2 = 10;
  var bookieBalanceBeforeOffer, bookieBalanceAfterOffer;
  var bettorBalanceBeforePlace, bettorBalanceAfterPlace;

  it("should be initialized with empty values", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance = instance;
      return eBookieInstance.getNumberOfBets();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "bumber of bets should be zero");
      return eBookieInstance.getAvailableBets();
    }).then(function(data) {
      assert.equal(data.length, 0, "there shouldn't be any available bets");
    });
  });

  //offer a first bet
  it("should offer a first bet", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance = instance;
      //record balances of bookie before offering bet
      bookieBalanceBeforeOffer = web3.fromWei(web3.eth.getBalance(bookie), "ether").toNumber();
      return eBookieInstance.offerBet(name1, bettorTeamID1, odds1, {
        from: bookie,
        value: web3.toWei(toWin1, "ether")
      });
    }).then(function(receipt) {
      //check event
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogOfferBet", "event should be LogOfferBet");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "event id should be 1");
      assert.equal(receipt.logs[0].args._bookie, bookie, "event bookie should be "+bookie);
      assert.equal(receipt.logs[0].args._name, name1, "event name should be "+name1);
      assert.equal(receipt.logs[0].args._bettorTeamID, bettorTeamID1, "event bettorTeamID should be "+bettorTeamID1);
      assert.equal(receipt.logs[0].args._wager.toNumber(), web3.toWei(wager1, "ether"), "event wager should be "+web3.toWei(wager1, "ether"));
      assert.equal(receipt.logs[0].args._odds, odds1, "event odds should be "+odds1);
      assert.equal(receipt.logs[0].args._toWin.toNumber(), web3.toWei(toWin1, "ether"), "event toWin should be "+web3.toWei(toWin1, "ether"));
      //record balances of bettor after placing bet
      bookieBalanceAfterOffer= web3.fromWei(web3.eth.getBalance(bookie), "ether").toNumber();

      //check the effect of placeBet on balance of bettor - account for gas
      assert(bookieBalanceAfterOffer<= bookieBalanceBeforeOffer -toWin1, "bookie should put down toWin1 amount");
      return eBookieInstance.getNumberOfBets();
    }).then(function(data) {
      assert.equal(data, 1, "number of bets must be 1");
      return eBookieInstance.getAvailableBets();
    }).then(function(data) {
      assert.equal(data.length, 1, "there must be one bet available");
      assert.equal(data[0].toNumber(), 1, "bet id must be 1");

      return eBookieInstance.book(data[0]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "bet id must be 1");
      assert.equal(data[1], bookie, "bookie must be "+ bookie);
      assert.equal(data[2], 0x0, "bettor must be empty");
      assert.equal(data[3], name1, "Bet name must be "+name1);
      assert.equal(data[4].toNumber(), bettorTeamID1, "bettorTeamID must be "+bettorTeamID1);
      assert.equal(data[5].toNumber(), web3.toWei(wager1, "ether"), "wager must be " +web3.toWei(wager1, "ether"));
      assert.equal(data[6].toNumber(), odds1, "odds must be "+odds1);
      assert.equal(data[7].toNumber(), web3.toWei(toWin1, "ether"), "toWin must be "+web3.toWei(toWin1, "ether"));
      assert.equal(data[8], 0x0, "winner must be empty");
    });
  });

  //offer a second bet
  it("should offer a second bet", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance = instance;
      //record balances of bookie before offering bet
      bookieBalanceBeforeOffer = web3.fromWei(web3.eth.getBalance(bookie), "ether").toNumber();
      return eBookieInstance.offerBet(name2, bettorTeamID2, odds2, {
        from: bookie,
        value: web3.toWei(toWin2, "ether")
      });
    }).then(function(receipt) {
      //check event
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogOfferBet", "event should be LogOfferBet");
      assert.equal(receipt.logs[0].args._id.toNumber(), 2, "event id should be 2");
      assert.equal(receipt.logs[0].args._bookie, bookie, "event bookie should be "+bookie);
      assert.equal(receipt.logs[0].args._name, name2, "event name should be "+name2);
      assert.equal(receipt.logs[0].args._bettorTeamID, bettorTeamID2, "event bettorTeamID should be "+bettorTeamID2);
      assert.equal(receipt.logs[0].args._wager.toNumber(), web3.toWei(wager2, "ether"), "event wager should be "+web3.toWei(wager2, "ether"));
      assert.equal(receipt.logs[0].args._odds, odds2, "event odds should be "+odds2);
      assert.equal(receipt.logs[0].args._toWin.toNumber(), web3.toWei(toWin2, "ether"), "event toWin should be "+web3.toWei(toWin2, "ether"));
      //record balances of bookie after offering bet
      bookieBalanceAfterOffer= web3.fromWei(web3.eth.getBalance(bookie), "ether").toNumber();

      //check the effect of offerBet on balance of bookie - account for gas
      assert(bookieBalanceAfterOffer<= bookieBalanceBeforeOffer -toWin2, "bookie should put down toWin2 amount");
      return eBookieInstance.getNumberOfBets();
    }).then(function(data) {
      assert.equal(data, 2, "number of bets must be 2");
      return eBookieInstance.getAvailableBets();
    }).then(function(data) {
      assert.equal(data.length, 2, "there must be two bets available");
      assert.equal(data[1].toNumber(), 2, "bet id must be 2");

      return eBookieInstance.book(data[1]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 2, "bet id must be 2");
      assert.equal(data[1], bookie, "bookie must be "+ bookie);
      assert.equal(data[2], 0x0, "bettor must be empty");
      assert.equal(data[3], name2, "Bet name must be "+name2);
      assert.equal(data[4].toNumber(), bettorTeamID2, "bettorTeamID must be "+bettorTeamID2);
      assert.equal(data[5].toNumber(), web3.toWei(wager2, "ether"), "wager must be " +web3.toWei(wager2, "ether"));
      assert.equal(data[6].toNumber(), odds2, "odds must be "+odds2);
      assert.equal(data[7].toNumber(), web3.toWei(toWin2, "ether"), "toWin must be "+web3.toWei(toWin2, "ether"));
      assert.equal(data[8], 0x0, "winner must be empty");
    });
  });

  //place the first bet
  it("should place the first bet", function() {
    return eBookie.deployed().then(function(instance) {
      eBookieInstance = instance;
      //record balances of bettor before placing bet
      bettorBalanceBeforePlace = web3.fromWei(web3.eth.getBalance(bettor), "ether").toNumber();
      return eBookieInstance.placeBet(1, {
        from: bettor,
        value: web3.toWei(wager1, "ether")
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogPlaceBet", "event should be LogPlaceBet");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "event id should be 1");
      assert.equal(receipt.logs[0].args._bookie, bookie, "event bookie should be "+bookie);
      assert.equal(receipt.logs[0].args._bettor, bettor, "event bettor should be "+bettor);
      assert.equal(receipt.logs[0].args._name, name1, "event name should be "+name1);
      assert.equal(receipt.logs[0].args._bettorTeamID, bettorTeamID1, "event bettorTeamID should be "+bettorTeamID1);
      assert.equal(receipt.logs[0].args._wager.toNumber(), web3.toWei(wager1, "ether"), "event wager should be "+web3.toWei(wager1, "ether"));
      assert.equal(receipt.logs[0].args._odds, odds1, "event odds should be "+odds1);
      assert.equal(receipt.logs[0].args._toWin.toNumber(), web3.toWei(toWin1, "ether"), "event toWin should be "+web3.toWei(toWin1, "ether"));

      //record balances of bettor after placing bet
      bettorBalanceAfterPlace = web3.fromWei(web3.eth.getBalance(bettor), "ether").toNumber();

      //check the effect of placeBet on balance of bettor - account for gas
      assert(bettorBalanceAfterPlace <= bettorBalanceBeforePlace -wager1, "bettor should put down wager amount");

      return eBookieInstance.getAvailableBets();
    }).then(function(data) {
      assert.equal(data.length, 1, "there should now be only one available bet");
      assert.equal(data[0].toNumber(), 2, "the id of bet should be 2");

      return eBookieInstance.getNumberOfBets();
    }).then(function(data) {
      assert.equal(data.toNumber(), 2, "there should be two bets in total");
    });
  });


});
