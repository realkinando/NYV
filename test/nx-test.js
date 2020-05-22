const { expect } = require("chai");

describe("NYV Exchange", function () {

    let NYVAsset;
    let NYVExchange;
    let MockOracle;
    let nyvUSD;
    let nyvEUR;
    let oracleUSDEUR;
    let exchange;
    let exchangeRate = 107881900;
    let MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
    let BURNER_ROLE = ethers.utils.id("BURNER_ROLE");
    let owner;
    let addr1;
    let addrs;
    let initialBalance = ethers.utils.parseEther('1000.0');
    let exchangeAmount = ethers.utils.parseEther('100.0');
    let exchangeShouldRevertAmount = ethers.utils.parseEther('2000.0');
    let exchangeAmountEURtoUSD = 100*exchangeRate/100000000;
    let exchangeAmountUSDtoEUR = 10000000000/exchangeRate;
    let balancePostEURtoUSD = initialBalance.add(ethers.utils.parseEther(exchangeAmountEURtoUSD.toString(10)));
    let balancePostUSDtoEUR = initialBalance.add(ethers.utils.parseEther(exchangeAmountUSDtoEUR.toString(10)));
    let balancePostBurn = ethers.utils.parseEther('900.0');

    beforeEach(async function () {

        //Deploy what's needed
        [owner, addr1, ...addrs] = await ethers.getSigners();
        NYVAsset = await ethers.getContractFactory("NYVAsset");
        NYVExchange = await ethers.getContractFactory("NYVExchange");
        MockOracle = await ethers.getContractFactory("MockOracle");
        oracleUSDEUR = await MockOracle.deploy(exchangeRate);
        await oracleUSDEUR.deployed();
        nyvEUR = await NYVAsset.deploy("NYVEuro","NVEU");
        await nyvEUR.deployed();
        nyvUSD = await NYVAsset.deploy("NYVDollar","NVUS");
        await nyvUSD.deployed();
        exchange = await NYVExchange.deploy();
        await exchange.deployed();

        //Link Oracle + Authorise the Exchange
        await exchange.setQuoteBaseAggregator(nyvUSD.address,nyvEUR.address,oracleUSDEUR.address);
        await exchange.setOperating(true);
        await nyvUSD.grantRole(MINTER_ROLE,exchange.address);
        await nyvUSD.grantRole(BURNER_ROLE,exchange.address);
        await nyvEUR.grantRole(MINTER_ROLE,exchange.address);
        await nyvEUR.grantRole(BURNER_ROLE,exchange.address);

        //Mint Currency into addr1
        await nyvUSD.grantRole(MINTER_ROLE,owner.getAddress());
        await nyvUSD.mint(addr1.getAddress(),initialBalance);
        await nyvEUR.grantRole(MINTER_ROLE,owner.getAddress());
        await nyvEUR.mint(addr1.getAddress(),initialBalance);

    });

    //makes sure we actually know how to deploy the exchange, including giving it roles for token contracts
    describe("Deployment", function(){

        it("Should have mint permissions set for nyvUSD", async function(){
            expect(await nyvUSD.hasRole(MINTER_ROLE,exchange.address)).to.equal(true);
        });

        it("Should have burn permissions set for nyvUSD", async function(){
            expect(await nyvUSD.hasRole(BURNER_ROLE,exchange.address)).to.equal(true);
        });

        it("Should have mint permissions set for nyvEUR", async function(){
            expect(await nyvEUR.hasRole(MINTER_ROLE,exchange.address)).to.equal(true);
        });

        it("Should have burn permissions set for nyvEUR", async function(){
            expect(await nyvEUR.hasRole(BURNER_ROLE,exchange.address)).to.equal(true);
        });

    });

    describe("EUR to USD", function(){

        it("Mints the correct amount of USD",async function(){
            await exchange.connect(addr1).exchange(nyvUSD.address,nyvEUR.address,false,exchangeAmount);
            expect(await nyvUSD.balanceOf(await addr1.getAddress())).to.equal(balancePostEURtoUSD);
        });

        it("Burns the correct amount of EUR",async function(){
            await exchange.connect(addr1).exchange(nyvUSD.address,nyvEUR.address,false,exchangeAmount);
            expect(await nyvEUR.balanceOf(await addr1.getAddress())).to.equal(balancePostBurn);
        });

        it("Reverts when the user doesn't hold the requested exchange amount", async function(){
            try{
                await exchange.connect(addr1).exchange(nyvUSD.address,nyvEUR.address,false,exchangeShouldRevertAmount);
            }
            catch(error){};
            expect(await nyvEUR.balanceOf(await addr1.getAddress())).to.equal(initialBalance);
            expect(await nyvUSD.balanceOf(await addr1.getAddress())).to.equal(initialBalance);
        });

    })

    describe("USD to EUR", function(){

        it("Burns the correct amount of USD",async function(){
            await exchange.connect(addr1).exchange(nyvUSD.address,nyvEUR.address,true,exchangeAmount);
            expect(await nyvUSD.balanceOf(await addr1.getAddress())).to.equal(balancePostBurn);
        });

        it("Mints the correct amount of EUR",async  function(){
            await exchange.connect(addr1).exchange(nyvUSD.address,nyvEUR.address,true,exchangeAmount);
            expect(await nyvEUR.balanceOf(await addr1.getAddress())).to.equal(balancePostUSDtoEUR);
        });

        it("Reverts when the user doesn't hold the requested exchange amount", async function(){
            try{
                await exchange.connect(addr1).exchange(nyvUSD.address,nyvEUR.address,true,exchangeShouldRevertAmount);
            }
            catch(error){};
            expect(await nyvEUR.balanceOf(await addr1.getAddress())).to.equal(initialBalance);
            expect(await nyvUSD.balanceOf(await addr1.getAddress())).to.equal(initialBalance);
        })
        
    });

});