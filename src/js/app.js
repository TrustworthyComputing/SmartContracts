App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false,

     init: function() {
        return App.initWeb3();
     },

     initWeb3: function() {
        //initialize web3
        if(typeof web3 !== 'undefined') {
          //reuse provider of web3 object injected by Metamask
          App.web3Provider = web3.currentProvider;
        } else {
          //create new provider and plug directly into local node
          App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        App.displayAccountInfo();

        return App.initContract();
     },

     displayAccountInfo: function() {
       web3.eth.getCoinbase(function(err, account) {
         if(err === null) {
           App.account = account;
           $('#account').text(account);
           web3.eth.getBalance(account, function(err, balance) {
             if(err === null) {
               $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
             }
           })
         }
       });
     },

     initContract: function() {
        $.getJSON('eBookie.json', function(eBookieArtifact) {
          //get the contract artifact file and use it to instantiate truffle contract abstraction
          App.contracts.eBookie = TruffleContract(eBookieArtifact);
          //set the provider for contract
          App.contracts.eBookie.setProvider(App.web3Provider);
          //listen to events
          App.listenToEvents();
          //retrieve bet from the contract
          return App.reloadBets();
        });
     },

     reloadBets: function() {
       //avoid reetry
       if(App.loading) {
         return;
       }
       App.loading = true;
       console.log("entering reload");
        //refresh account information because balance might have changed
        App.displayAccountInfo();

        var eBookieInstance;

        App.contracts.eBookie.deployed().then(function(instance) {
          eBookieInstance = instance;
          return eBookieInstance.getAvailableBets();
        }).then(function(betIds) {
          //retrieve bet placeholder and clear it
          $('#blackBook').empty();

          for(var i=0; i<betIds.length; i++) {
            var betId = betIds[i]
            eBookieInstance.book(betId.toNumber()).then(function(bet) {
              App.displayBet(bet[0],bet[1], bet[3], bet[4], bet[5], bet[6], bet[7]);
            });
          }
          App.loading = false;
        }).catch(function(err) {
          console.error(err.message);
        });
        console.log("reloaded");
      },

      displayBet: function(id, bookie, name, bettorTeamID, wager, odds, toWin) {
        var blackBook = $('#blackBook');
        var etherWager = web3.fromWei(wager, "ether");
        var etherToWin = web3.fromWei(toWin, "ether");
        var betTemplate = $('#betTemplate');
        betTemplate.find('.panel-title').text(name);
        betTemplate.find('.bet-bettorTeamID').text(bettorTeamID);
        betTemplate.find('.bet-wager').text(etherWager +" ETH");
        betTemplate.find('.bet-odds').text(odds +" to 1 odds");
        betTemplate.find('.bet-toWin').text(etherToWin+ " ETH");
        betTemplate.find('.btn-place').attr('data-id', id);
        betTemplate.find('.btn-place').attr('data-value', etherWager);

        if (bookie == App.account) {
          betTemplate.find('.bet-bookie').text("You");
          betTemplate.find('.btn-place').hide();
        } else {
          betTemplate.find('.bet-bookie').text(bookie);
          betTemplate.find('.btn-place').show();
        }

        //add this new bet to list
        blackBook.append(betTemplate.html());
      },

      offerBet: function() {
        //retrieve detail of bet
        var _bet_name = $('#bet_name').val();
        var _bet_bettorTeam = $('#bet_bettorTeam').val();
        var _bet_toWin = web3.toWei(parseFloat($('#bet_toWin').val() || 0), "ether");
        var _bet_odds = $('#bet_odds').val();

        if((_bet_name.trim() =='') || (_bet_toWin == 0) || (_bet_odds == 0) || (_bet_odds == 1)) {
          //nothing to bet
          return false;
        }
        App.contracts.eBookie.deployed().then(function(instance) {
          return instance.offerBet(_bet_name, _bet_bettorTeam, _bet_odds, {
            from: App.account,
            value: _bet_toWin,
            gas: 500000
          });
        }).then(function(result) {

        }).catch(function(err) {
          console.error(err);
        });
      },

      //listen to events triggered by contract
      listenToEvents: function() {
        App.contracts.eBookie.deployed().then(function(instance) {
          instance.LogOfferBet({}, {}).watch(function(error, event) {
            if (!error) {
              $("#events").append('<li class="list-group-item">'+event.args._name + ' has been offered</li>');
            } else {
              console.error(error);
            }
            App.reloadBets();
          });
          instance.LogPlaceBet({}, {}).watch(function(error, event) {
            if (!error) {
              $("#events").append('<li class="list-group-item">'+event.args._bettor + ' has been placed bet on '+event.args._name+'</li>');
            } else {
              console.error(error);
            }
            App.reloadBets();
          });
        });
      },

      placeBet: function() {
        event.preventDefault();
        //retrieve the bet wager
        var _betId = $(event.target).data('id');
        var _wager = parseFloat($(event.target).data('value'));
        App.contracts.eBookie.deployed().then(function(instance) {
          return instance.placeBet(_betId, {
            from: App.account,
            value: web3.toWei(_wager, "ether"),
            gas: 500000
          });
        }).catch(function(error) {
          console.error(error);
        });
      }
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
