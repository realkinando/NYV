const { expect } = require("chai");
const IUniswapV2Pair = require("./IUniswapV2Pair");

//THIS IS BROKEN

describe("Simple Depositor" , function(){

    let NYVAsset;
    let SimpleDepositor;
    let RouterContract;
    let FactoryContract;

    let nyvUSD;
    let mockUSDC;
    let mockWETH;
    let mockRouter;
    let mockFactory;
    let pairAddress;
    let usdcDepositor;

    let MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
    let BURNER_ROLE = ethers.utils.id("BURNER_ROLE");
    let lowLiquidityAmountToAdd = ethers.utils.parseEther('1000000.0')
    let middleLiquidityAmountToAdd = ethers.utils.parseEther('1001000.0');
    let highLiquidityAmountToAdd = ethers.utils.parseEther('1050000.0');
    let deposit = ethers.utils.parseEther('1000.0');
    let nyvDesiredLow = ethers.utils.parseEther('900.0');
    let initialTargetBasisPoints = 10010;
    let pairContract;

    let owner;
    let addr1;
    let addrs;

    beforeEach(async function () {

        //basic setup
        [owner, addr1, ...addrs] = await ethers.getSigners();
        NYVAsset = await ethers.getContractFactory("NYVAsset");
        FactoryContract = await ethers.getContractFactory("MockUniswapFactory");
        SimpleDepositor = await ethers.getContractFactory("SimpleDepositor");
        RouterContract = await ethers.getContractFactory("UniswapV2Router01");

        //contract deployment pt 1
        nyvUSD = await NYVAsset.deploy("NYVDollar","NVUS");
        await nyvUSD.deployed();
        mockUSDC = await NYVAsset.deploy("USDC","USDC");
        await mockUSDC.deployed();
        mockWETH = await NYVAsset.deploy("WETH","WETH");
        await mockWETH.deployed();
        mockFactory = await FactoryContract.deploy();
        await mockFactory.deployed();
        mockRouter = await RouterContract.deploy(mockFactory.address,mockWETH.address);
        await mockRouter.deployed();

        //contract deployment pt 2
        let pairTx = await mockFactory.createPair(mockUSDC.address,nyvUSD.address);
        let pairTxDone = await pairTx.wait();
        pairAddress = pairTxDone.events[0].args.pair;
        pairContract = await ethers.getContractAt(IUniswapV2Pair.abi,pairAddress,owner);
        usdcDepositor = await SimpleDepositor.deploy(mockUSDC.address,nyvUSD.address,mockRouter.address,pairAddress,initialTargetBasisPoints);
        
        //Giving authoritah!
        await nyvUSD.grantRole(MINTER_ROLE,usdcDepositor.address);
        await nyvUSD.grantRole(MINTER_ROLE,owner.getAddress());
        await mockUSDC.grantRole(MINTER_ROLE,owner.getAddress());
        await usdcDepositor.setOperating(true);

    });

    describe("When NYVUSD value is equal to target", async function(){

        it("Liquidity is added correctly", async function(){
            let newUSDCReserve;
            let newNYVUSDReserve;
            //set up liquidity pool
            let nyvMint = await nyvUSD.mint(owner.getAddress(),lowLiquidityAmountToAdd);
            await nyvMint.wait();
            let usdcMint = await mockUSDC.mint(owner.getAddress(),middleLiquidityAmountToAdd);
            await usdcMint.wait();
            let nyvApprove = await nyvUSD.approve(mockRouter.address,lowLiquidityAmountToAdd);
            await nyvApprove.wait();
            let usdcApprove = await mockUSDC.approve(mockRouter.address,middleLiquidityAmountToAdd);
            await usdcApprove.wait();
            let addLiq  = await mockRouter.addLiquidity(mockUSDC.address,nyvUSD.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                owner.getAddress(),deposit);
            await addLiq.wait();


            //Give mock depositor required funds
            await mockUSDC.mint(addr1.getAddress(),deposit);
            await mockUSDC.connect(addr1).approve(usdcDepositor.address,deposit);
            //Deposit
            let depositTx = await usdcDepositor.connect(addr1).
            deposit(deposit,nyvDesiredLow,deposit,deposit,deposit);
            let depositTxDone = await depositTx.wait();
            let [nyvAssetAddded, sourceAssetAdded] = depositTxDone;
            expect(sourceAssetAdded.div(nyvAssetAddded).toNumber()).to.equal(initialTargetBasisPoints/10000);
            
            //Get pair balances
            let [reserve0,reserve1] = pairContract.getReserves();

            //the actual check
            let token0 = pairContract.token0();
            let token1 = pairContract.token1();
            if (token0 == mockUSDC){
                newUSDCReserve = reserve0;
                newNYVUSDReserve = reserve1;
            }
            else{
                newUSDCReserve = reserve1;
                newNYVUSDReserve = reserve0;
            }
            expect(await newUSDCReserve.div(newNYVUSDReserve).toNumber()).to.equal(initialTargetBasisPoints/10000);
            expect(await newUSDCReserve.sub(sourceAssetAdded)).to.equal(middleLiquidityAmountToAdd);
        });

        it("User receives NYVUSD equal to the amount USDC used for adding liquidity", async function(){

            //set up liquidity pool
            await nyvUSD.mint(owner.getAddress(),lowLiquidityAmountToAdd);
            await mockUSDC.mint(owner.getAddress(),middleLiquidityAmountToAdd);
            await mockRouter.addLiquidity(mockUSDC.address,nyvUSD.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                owner.getAddress(),ethers.utils.bigNumberify(Math.floor(Date.now()/1000)+120));
            
            //Give mock depositor required funds
            await mockUSDC.mint(addr1.getAddress(),deposit);
            
            //Deposit
            let [nyvAssetAddded, sourceAssetAdded] = await usdcDepositor.connect(addr1).
            deposit(deposit,nyvDesiredLow,deposit,deposit,ethers.utils.bigNumberify(Math.floor(Date.now()/1000)+120));

            //the check
            expect(await nyvUSD.balanceOf(await addr1.getAddress())).to.equal(sourceAssetAdded);

        });

        it("User gets refund on USDC not used to add liquidity", async function(){
            //set up liquidity pool
            await nyvUSD.mint(owner.getAddress(),lowLiquidityAmountToAdd);
            await mockUSDC.mint(owner.getAddress(),middleLiquidityAmountToAdd);
            await mockRouter.addLiquidity(mockUSDC.address,nyvUSD.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                owner.getAddress(),ethers.utils.bigNumberify(Math.floor(Date.now()/1000)+120));

            //Give mock depositor required funds
            let bigDeposit = deposit.mul(ethers.utils.bigNumberify(2));
            await mockUSDC.mint(addr1.getAddress(),bigDeposit);

            //Deposit with figures designed to lower actual deposited amount.
            let [nyvAssetAddded, sourceAssetAdded] = await usdcDepositor.connect(addr1).
            deposit(deposit,nyvDesiredLow,bigDeposit,deposit,ethers.utils.bigNumberify(Math.floor(Date.now()/1000)+120));

            expect(await mockUSDC.balanceOf(addr1.getAddress()).add(sourceAssetAdded)).to.equal(bigDeposit);
            
        });

        it("User doesn't get NYVUSD when liquidity is not added", async function(){
            //set up liquidity pool
            await nyvUSD.mint(owner.getAddress(),lowLiquidityAmountToAdd);
            await mockUSDC.mint(owner.getAddress(),middleLiquidityAmountToAdd);
            await mockRouter.addLiquidity(mockUSDC.address,nyvUSD.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
                owner.getAddress(),ethers.utils.bigNumberify(Math.floor(Date.now()/1000)+120));
            try{
                let [nyvAssetAddded, sourceAssetAdded] = await usdcDepositor.connect(addr1).
            deposit(deposit,nyvDesiredLow,deposit,deposit,ethers.utils.bigNumberify(Math.floor(Date.now()/1000)+120));
            }
            catch(error){
                pass
            }
            expect(nyvUSD.balanceOf(addr1).toNumber()).to.equal(0);
        });

    });

    describe("When NYVUSD value exceeds target", async function(){

        it("Liquidity is added correctly", async function(){
        });

        it("User receives NYVUSD equal to the amount USDC used for adding liquidity", async function(){
        });

        it("User gets refund on USDC not used to add liquidity", async function(){

        });

        it("User doesn't get NYVUSD when liquidity is not added", async function(){

        });

    });

    describe("When NYVUSD value is less than target", async function(){
        it("REVERTS", async function(){

        });
    })

})