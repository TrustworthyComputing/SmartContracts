pragma solidity ^0.4.18;

import "./safemath.sol";
import "./Ownable.sol";
import "./OraclizeAPI.sol";

/*
/// @title eBookie- is Decentralized Sports Betting a way for everyone to be their own bookie
/// @author Ryan Peterson
/// @notice
  struct Bet- each bet is comprised of the
              id: identification for the bet
              bookie: controls odds, initializes bets
              bettor: accepts bets
              name: Away Team/Home Team
              bettorTeam: team bettor will bet on
              wager: amount of ether bettor will be putting down
              odds: example "5" for "5 to 1" odds
              toWin: amount of money bookie will be putting down
              winner: address of the winner of bet, set to 0x0 until winner is determined
              date: date of the event
              homeTeam; field to help us determine who won the bet
  event LogOfferBet- event for when a bet is offered
  event LogPlaceBet- event for when a bet is placed/accepted
  event newOraclizeQuery- event for when query is sent through Oraclize
  function kill()- deactivates contract, can only be called by owner of contract,
              should only be called to update contract features
  function offerBet- creates a bet, called by bookie, accepts_eventName, _typeOfBet,
              _stake, and _odds. Calculates amount bookie must downpay from _stake and _odds.
              payable (requires correct bookie amount). increases betCounter.
              Logs the event
  function getNumberOfBets- returns the number of bets
  function getAvailableBets-returns the bet IDs of all available bets
  function placeBet- accepts a bet, requires betCounter to be greater than 0,
              requires the bet to exist, gets the bet, requires bettor is still 0x0,
              requires bettor is not bookie, payable (requires correct bettor amount),
              holds the bettor's address, Logs the event
  function disperseWinnings- checks the event's result by sending queries , gives
              winnings to bookie or bettor depending on result, takes out small fee
              for sending out queries
  Other Additions to think about
              Should there be a minimum betting amount? enough to cover the API  call cost
              Can we implement other bets? Not just winner of game
              Can we add a page(html) that contains a list of all current bets
*/

contract eBookie is Ownable, usingOraclize {

  using SafeMath for uint256;

  struct Bet {
    uint id;
    address bookie;
    address bettor;
    string name;           // Away Team/Home Team
    uint256 bettorTeamID;  // Each team has an ID
    uint256 wager;        // wager to be put up by bettor
    uint256 odds;         // 5 to 1 => 5
    uint256 toWin;        // wager bookie must put up
    address winner;
    uint date;
    string homeTeam;
  }
  //state variables
  string homeTeamHolder;
  string homeScoreHolder;
  string awayScoreHolder;
  mapping (uint => Bet) public book;
  uint betCounter;
  mapping (bytes32 => bool) public homeTeamQueryIds;
  mapping (bytes32 => bool) public homeScoreQueryIds;
  mapping (bytes32 => bool) public awayScoreQueryIds;

  //events
  event LogOfferBet(
    uint indexed _id,
    address indexed _bookie,
    string _name,
    uint256 _bettorTeamID,
    uint256 _wager,
    uint256 _odds,
    uint256 _toWin
  );
  event LogPlaceBet(
    uint indexed _id,
    address indexed _bookie,
    address indexed _bettor,
    string _name,
    uint256 _bettorTeamID,
    uint256 _wager,
    uint256 _odds,
    uint256 _toWin
    );
  event newOraclizeQuery(string description);

  //contructor
  function eBookie() public {
    //Oraclize
    OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
  }
  //deactivate contract
  function kill() public onlyOwner {
    selfdestruct(owner); //deactivates contract, gives all remaining funds to owner
  }

  function offerBet(string _name, uint256 _bettorTeamID, uint256 _odds) payable public {
    //a new bet
    betCounter++;
    uint256 wager = (msg.value).div(_odds); //fix division math to calculate wager
    book[betCounter] = Bet(
      betCounter,
      msg.sender,
      0x0,
      _name,
      _bettorTeamID,
      wager,
      _odds,
      msg.value,
      0x0,
      20190724, //hard coded value for date right now
      ""
      );

    LogOfferBet(betCounter, msg.sender, _name, _bettorTeamID, wager, _odds, msg.value);
  }

  //fetch number of bets in contract
  function getNumberOfBets() public view returns(uint){
    return betCounter;
  }

  //fetch and return all bet IDs for available bets
  function getAvailableBets() public view returns(uint[]) {
    //prepare output array
    uint[] memory betIDs = new uint[](betCounter); //max amount of available bets is betCounter

    uint numberOfAvailableBets = 0;
    //iterate over articles
    for(uint i = 1; i<=betCounter; i++) {
      //keep the ID if the bet is still available
      if(book[i].bettor == 0x0) {
        betIDs[numberOfAvailableBets] = book[i].id;
        numberOfAvailableBets++;
      }
    }

    //copy the betIds array into a smaller availableArray
    uint[] memory available = new uint[](numberOfAvailableBets);
    for(uint j = 0; j< numberOfAvailableBets; j++) {
      available[j]= betIDs[j];
    }
    return available;
  }


  function placeBet(uint _id) payable public {
    //check whether there is bet available
    require(betCounter > 0);

    //check that bet exists
    require(_id > 0 && _id <= betCounter);

    //retrieve bet from the mapping
    Bet storage bet = book[_id];

    //check that the bet has not been sold yet
    require(bet.bettor == 0x0);
    //we don't allow bookie to place own bet
    require(msg.sender != bet.bookie);
    //check that value sent corresponds to bet wager (revert thrown)
    require(msg.value == bet.wager);
    //keep bettor information
    bet.bettor = msg.sender;

    //trigger the event
    LogPlaceBet(_id, bet.bookie, bet.bettor, bet.name, bet.bettorTeamID, bet.wager, bet.odds, bet.toWin);
  }
/*
  //give winnings to correct account
    //currently can only be called by owner, should only be called if game is over
    //this means all API calls can only be made by the owner
      //pro: owner can ensure all API calls are made at correct time with correct information
      //con: disperse must be called, so owner must be paying attention to all bets on this application
  function disperseWinnings(uint _id) public payable onlyOwner {
    //HOW DO I AUTHORIZE MY QUERIES USING API KEY AND PASSWORD
    //example URLs for queries
      //https://api.mysportsfeeds.com/v1.2/pull/mlb/2019/scoreboard.json?fordate=20190721&team=114

    string url= "https://api.mysportsfeeds.com/v1.2/pull/mlb/2019/scoreboard.json?";
    Bet storage payBet = book[_id];
    url= strConcat(url,"fordate=", payBet.date);
    url= strConcat(url,"&team=",payBet.bettorTeamID);

    uint priceForQueries = oraclize_getPrice("URL").mul(3); //need three query calls to decide winner
    if (priceForQueries > this.balance) {
      //If this contract does not have enough balance fire event to notify
      newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
    } else {
      //Fire event to notify successfull call to endpoint
      newOraclizeQuery("Oraclize query was sent, standing by for the answer...");
      //Save queryId for later validation to ensure same query id was returned with response

      //first query checks ID the home team is
      bytes32 queryId = oraclize_query("URL", "json("+url+").gameScore.game.hometeam.ID");
      homeTeamQueryIds[queryId] = true;
      //second query checks the home team score
      queryId = oraclize_query("URL", "json("+url+").gameScore.homeScore");
      homeScoreQueryIds[queryId] = true;
      //third query check the away team score
      queryId = oraclize_query("URL", "json("+url+").gameScore.awayScore");
      awayScoreQueryIds[queryId] = true;
    }
    //all holders should be strings
    if(payBet.bettorTeamID == parseInt(homeTeamHolder)) { //bettor bet on home team
      if(parseInt(homeScoreHolder) > parseInt(awayScoreHolder)) {       //bettor won
        payBet.winner = payBet.bettor;
      } else {                                      //bookie won
        payBet.winner = payBet.bookie;
      }
    } else {                                  //bettor bet on away team
      if(parseInt(awayScoreHolder) > parseInt(homeScoreHolder)) {     //bettor won
        payBet.winner = payBet.bettor;
      } else {                                    //bookie won
        payBet.winner = payBet.bookie;
      }
    }

    uint winningAmt = uint(payBet.wager + payBet.toWin) - priceForQueries; //take out small fee for API calls
    (payBet.winner).transfer(winningAmt);
  }

  function __callback(bytes32 myid, string result) public {
    //Check if calling address is valid
    require(msg.sender == oraclize_cbAddress());
    //Find which query kind we received, save to correct state variable
    if(homeTeamQueryIds[myid] == true) {
      homeTeamHolder= result;
      delete homeTeamQueryIds[myid];
    }
    if(homeScoreQueryIds[myid] == true) {
      homeScoreHolder=result;
      delete homeScoreQueryIds[myid];
    }
    if (awayScoreQueryIds[myid] == true) {
      awayScoreHolder=result;
      delete awayScoreQueryIds[myid];
    }
  }
*/

}
