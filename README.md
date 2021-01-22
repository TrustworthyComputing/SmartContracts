# Marketplace Truffle Box
## An online marketplace for buying and selling goods

### Overview
A DApp for buying and selling items using a blockchain. One account can put an item up for sale by indicating its name, a description of the item, and its price, and another account can buy the item which then debits the buying account and credits the selling account.

### Installation

1. Install Truffle globally.
    ```javascript
    npm install -g truffle
    ```

2. Download the box. This also takes care of installing the necessary dependencies.
    ```javascript
    truffle unbox chainskills/chainskills-box
    ```

3. Run the development console.
    ```javascript
    truffle develop
    ```

4. Compile and migrate the smart contracts. Note inside the development console we don't preface commands with `truffle`.
    ```javascript
    compile
    migrate
    ```

5. Run the `liteserver` development server (outside the development console) for front-end hot reloading. Smart contract changes must be manually recompiled and migrated.
    ```javascript
    // Serves the front-end on http://localhost:3000
    npm run dev
    ```

#### Disclaimer
This Truffle Box has all you need to create a DApp by following the course delivered by [ChainSkills](https://www.udemy.com/getting-started-with-ethereum-solidity-development/).

This DApp has been based on [pet-shop-box](https://github.com/truffle-box/pet-shop-box).

