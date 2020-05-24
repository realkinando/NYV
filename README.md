# :currency_exchange:NYV Money
NYV (pronounced Naive) aims to serve as a platform to bootstrap liquidity for innovative, low cap, niche stablecoins. 
  
NYV does this by :
- Incentivising liquidity with our own platform tokens of the same peg, on Uniswap V2  
- Providing a foreign exchange simulating infinite liquidity depth 
  
**The aim is to open up the stablecoin market and bring DeFi to the world!  
BUIDLed for #HackMoney**

REALLY EARLY DAYS, I AM (@realKinando) CURRENTLY WORKING ON THIS SOLO - WOULD LOVE FEEDBACK AND FOR PEOPLE TO JOIN ME  

Will add more to the readme soon, till then, DM me on Twitter to view the draft whitepaper :)

## NYV Assets
NYV Assets aim to securely match their peg by maintaining 1:1 pricing with a wide range of stablecoins of the same class. 
This is done by incentivising the maintaining of Uniswap (v2) reserves close to a target ratio.

## Depositors  
Depositor contracts receive source assets (e.g. UMA Derived Euro Synthetics, Dai, community fiat backed coin etc),
and debit the caller with the same amount of relevent NYV asset (NYV$,£,€,₹ etc). The source asset capital is then used to trade on uniswap.  
  
For this POC the depositor, SimpleDepositor.sol, simply takes the source capital and adds liquidity to the source asset | NYV asset pair - reverting if the source asset | NYV asset ratio < target. This is a really basic stability measure - we'll have to improve to go to production.  
  
Depositors are modular, and one source asset's depositor contract can be completely different to another.

## NYV Exchange
As most of DeFi is USD driven, and a huge use case for DeFi is remittances. NYV is being BUIDLed with a "Foreign Exchange" that has zero slippage.
Right now this being done by exchange.sol using a chainlink oracle to accordingly mint and burn NYV assets.

## The Demo
The demo is running on Rinkeby.
- Get some testnet Dai via the old UMA Token Builder Interface : https://tokenbuilder.umaproject.org/ViewPositions
- Add the various tokens to uniswapV2 manually
- Use your Dai to get NYV$ etc
- Approve the depositors to access your coins

The ABIs can be generated by cloning this repo and running following within the folder
```
npm install --save-dev @nomiclabs/buidler
npx buidler compile
```

Contract Addresses :
- Dai 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa
- Dai Depositor 0x6EAc2a22D0DC7C85fA1D1777237F1a9Fac916B9E
- Mock Bank Held USD 0xd7cfe3c3917622d51aa68525cc8828b3c1e7be86
- Mock Bank Held USD Depositor 0xA07a9B8D2e7433A370C8D60ededeAfc59521c29f
- UMA Euro Position 0x495f1A525A603d38eEdeE541Daa27f7334649969
- UMA Euro Depositor 0x3fFC558474Ca8c76320Be2f1bb515303443B4151
- Mock Stasis Euro 0x560855F6C23e7A69F878df15842dD76d6d78e1Cb
- Mock Stasis Euro Depositor 0x7d8dA1B258431D3b4DFCE9AA3674c48f1Dd85E48
- NYV$ 0xb1539c3B8a7059bffc7d77da2AC18347deFB99C3
- NYV€ 0x511e6B351aD53F491E08385047f5035e90B42Da5
- NYV Exchange POC 0x1a01564f53e32750B8859e1473D84797d4B7c7ca 
  
## Moving Forward
NYV needs much more comprehensive stabilisation measures to hold its peg. In addition, we would need a trusted decentralised organisation to assess the suitability of source assets.  
Many problems can be solved via the provision of a DAO; algorithmic burning & slashing of DAO tokens to hold pegs; and also via different depositor and exchange design.  

**This research will be discussed in the upcoming whitepaper.**
