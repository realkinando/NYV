const bre = require("@nomiclabs/buidler");
const nyvUSDAddress = "0xb1539c3B8a7059bffc7d77da2AC18347deFB99C3";
const daiAddress = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa";
const usdcAddress = "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b";
const umaEuroAddress = "0x495f1A525A603d38eEdeE541Daa27f7334649969";
const eurusdoracle = "0x476d86Dfad0AEa4e33Cc728cd5aF0093f059368C";
const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
const BURNER_ROLE = ethers.utils.id("BURNER_ROLE");
const lowLiquidityAmountToAdd = ethers.utils.parseEther('1000000.0')
const middleLiquidityAmountToAdd = ethers.utils.parseEther('1001000.0');
const mockBankLowLiquidityAmountToAdd = ethers.utils.parseEther('100000000.0');
const mockBankMiddleLiquidityAmountToAdd = ethers.utils.parseEther('100100000.0');
const initialTargetBasisPoints = 10010;
const deposit = ethers.utils.parseEther('1000.0');


//assumes test-depositor-deploy.js ran on Rinkeby and that the contract addresses are typed into this file as constants //DONE
//deploys : NYV EUR, a mock bank held Euro coin, daiDepositor, USDCDepositor, UMAEuroDepositor, MockEURSDepositor
//activates all depositors
//deploys : NYV Exchange + adds oracle + activates exchange
//grants nyv USD mint permission to : DaiDepositor, USDCDepositor, NYVExchange
//grants nyv EUR mint permission to : Self, UMA EURO, Mock EURS, NYVExchange
//grant nyv USD burn permission to NYVExchange
//grant nyv EUR burn permission to NYVExchange
//Approve router to spend 2000K Nyv EUR
//Approve router to spend 101K Dai
//Approve router to spend 1010K USDC
//Approve router to spend 1010K MockEURS
//Approve router to spend 101K UMA Euros
//Add 101K Dai : 100K Nyv USD to liquidity pool
//Add 101K USDC : 100K Nyv USD to liquidity pool
//Add 101K MockEURS : 100K Nyv Eur to liquidity pool
//Add 101K UMAEURS : 100K NYV Eur to liquidity pool is

async function main(){
    let [owner] = await ethers.getSigners();
    let nyvUSD = await ethers.getContractAt("NYVAsset",nyvUSDAddress);
    let dai = await ethers.getContractAt("ERC20",daiAddress);
    let usdc = await ethers.getContractAt("ERC20",usdcAddress);
    let umaEuro = await ethers.getContractAt("ERC20",umaEuroAddress);
    let NYVAsset = await ethers.getContractFactory("NYVAsset");
    let SimpleDepositor = await ethers.getContractFactory("SimpleDepositor");
    let NYVExchange = await ethers.getContractFactory("NYVExchange");
    let mockRouter = await ethers.getContractAt("UniswapV2Router01","0xf164fC0Ec4E93095b804a4795bBe1e041497b92a");

    let nyvEUR = await NYVAsset.deploy("NYVEuro","NVEU");
    await nyvEUR.deployed();
    let mockEUR = await NYVAsset.deploy("MEUR","MEUR");
    await mockEUR.deployed();
    console.log("mockEUR address: " + mockEUR.address);
    console.log("NYVEUR address: " + nyvEUR.address);

    //Deploy MockEURO depositor
    let mockEuroDepositor = await SimpleDepositor.deploy(mockEUR.address,nyvEUR.address,"0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",initialTargetBasisPoints);
    await mockEuroDepositor.deployed();
    console.log("Mock Euro Depositor Address : "+mockEuroDepositor.address);
    await mockEuroDepositor.setOperating(true);

    //Deploy UMA Euro Depositor
    let umaEuroDepositor = await SimpleDepositor.deploy(umaEuro.address,nyvEUR.address,"0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",initialTargetBasisPoints);
    await umaEuroDepositor.deployed();
    console.log("UMA Euro Depositor Address : "+umaEuroDepositor.address);
    await umaEuroDepositor.setOperating(true);

    //Deploy DAI depositor
    let daiDepositor = await SimpleDepositor.deploy(dai.address,nyvUSD.address,"0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",initialTargetBasisPoints);
    await daiDepositor.deployed();
    console.log("Dai Depositor Address : " +daiDepositor.address);
    await daiDepositor.setOperating(true);

    //Deploy USDC depositor
    let usdcDepositor = await SimpleDepositor.deploy(usdc.address,nyvUSD.address,"0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",initialTargetBasisPoints);
    await usdcDepositor.deployed();
    console.log("USDC Depositor Address : " +usdcDepositor.address);
    await usdcDepositor.setOperating(true);

    let exchange = await NYVExchange.deploy();
    await exchange.deployed();
    //Link Oracle + Authorise the Exchange
    await exchange.setQuoteBaseAggregator(nyvUSD.address,nyvEUR.address,eurusdoracle);
    await exchange.setOperating(true);
    console.log("NYVExchange Address : " +exchange.address);
    
    let grant0 = await nyvUSD.grantRole(MINTER_ROLE,usdcDepositor.address);
    await grant0.wait();
    console.log("usdcdepositor is minter");
    let grant1 = await nyvUSD.grantRole(MINTER_ROLE,daiDepositor.address);
    await grant1.wait();
    console.log("daidepositor is minter");
    let grant2 = await nyvUSD.grantRole(MINTER_ROLE,exchange.address);
    await grant2.wait();
    console.log("exchange is nyvusd minter");

    let grant3 = await nyvEUR.grantRole(MINTER_ROLE,mockEuroDepositor.address);
    await grant3.wait();
    console.log("mockEuroDepositor is minter");
    let grant4 = await nyvEUR.grantRole(MINTER_ROLE,umaEuroDepositor.address);
    await grant4.wait();
    console.log("umaeurodepositor is minter");
    let grant5 = await nyvEUR.grantRole(MINTER_ROLE,owner.getAddress());
    await grant5.wait();
    console.log("owner can mint euros");
    let grant6 = await nyvEUR.grantRole(MINTER_ROLE,exchange.address);
    await grant6.wait();
    console.log("exchange is nyvEUR minter");

    let grant7 = await nyvEUR.grantRole(BURNER_ROLE,exchange.address);
    await grant7.wait();
    console.log("exchange is nyvEUR burner");

    let grant8 = await nyvUSD.grantRole(BURNER_ROLE,exchange.address);
    await grant8.wait();
    console.log("exchange is nyvUSD burner");

    let approve0 = await nyvUSD.approve(mockRouter.address,lowLiquidityAmountToAdd.add(mockBankLowLiquidityAmountToAdd));
    await approve0.wait();
    let approve1 = await nyvEUR.approve(mockRouter.address,lowLiquidityAmountToAdd.add(mockBankLowLiquidityAmountToAdd));
    await approve1.wait();
    let approve2 = await dai.approve(mockRouter.address,middleLiquidityAmountToAdd);
    await approve2.wait();
    let approve3 = await umaEuro.approve(mockRouter.address,middleLiquidityAmountToAdd);
    await approve3.wait();
    let approve4 = await usdc.approve(mockRouter.address,mockBankMiddleLiquidityAmountToAdd);
    await approve4.wait();
    let approve5 = await mockEUR.approve(mockRouter.address,mockBankMiddleLiquidityAmountToAdd);
    await approve5.wait();

    let mint0 = await nyvUSD.mint(owner.getAddress(),lowLiquidityAmountToAdd.add(mockBankLowLiquidityAmountToAdd));
    await mint0.wait();
    let mint1 = await nyvEUR.mint(owner.getAddress(),lowLiquidityAmountToAdd.add(mockBankLowLiquidityAmountToAdd));
    await mint1.wait();
    let mint2 = await mockEUR.mint(owner.getAddress(),mockBankMiddleLiquidityAmountToAdd);
    await mint2.wait();

    await mockRouter.addLiquidity(dai.address,nyvUSD.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        owner.getAddress(),deposit);

    await mockRouter.addLiquidity(umaEuro.address,nyvEUR.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        owner.getAddress(),deposit);

    await mockRouter.addLiquidity(mockEUR.address,nyvEUR.address,mockBankMiddleLiquidityAmountToAdd,mockBankLowLiquidityAmountToAdd,
        middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        owner.getAddress(),deposit);

    await mockRouter.addLiquidity(usdcAddress,nyvUSD.address,mockBankMiddleLiquidityAmountToAdd,mockBankLowLiquidityAmountToAdd,
        middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        owner.getAddress(),deposit);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });