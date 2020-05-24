//cos I messed up the deployment
//fml
const bre = require("@nomiclabs/buidler");
const nyvUSDAddress = "0xb1539c3B8a7059bffc7d77da2AC18347deFB99C3";
const daiAddress = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa";
const usdcAddress = "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b";
const umaEuroAddress = "0x495f1A525A603d38eEdeE541Daa27f7334649969";
const lowLiquidityAmountToAdd = ethers.utils.parseEther('1000000.0')
const middleLiquidityAmountToAdd = ethers.utils.parseEther('1001000.0');
const mockBankLowLiquidityAmountToAdd = ethers.utils.parseEther('100000000.0');
const mockBankMiddleLiquidityAmountToAdd = ethers.utils.parseEther('100100000.0');
const nyvEURAddress = "0x511e6B351aD53F491E08385047f5035e90B42Da5";
const mockEURAddress = "0x560855F6C23e7A69F878df15842dD76d6d78e1Cb";
const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
const deposit = ethers.utils.parseEther('1000.0');

async function main(){
    let [owner] = await ethers.getSigners();
    let mockRouter = await ethers.getContractAt("UniswapV2Router01","0xf164fC0Ec4E93095b804a4795bBe1e041497b92a");
    let pairIFlopped = await ethers.getContractAt("ERC20","0x9b08eb762ea2f677ae5a51b842881866ceefc978");
    /*await mockRouter.addLiquidity(daiAddress,nyvUSDAddress,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        owner.getAddress(),deposit,{gasLimit:5500000});
    console.log("first liquidity adding");*/
    await mockRouter.addLiquidity(umaEuroAddress,nyvEURAddress,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
        owner.getAddress(),deposit,{gasLimit:5500000});
    let floppedLiquidityBalance = await pairIFlopped.balanceOf(owner.getAddress());
    let redemption = await mockRouter.removeLiquidity(usdcAddress,nyvUSDAddress,floppedLiquidityBalance,0,0,owner.getAddress(),deposit);
    await redemption.wait();
    console.log("redemption complete");
    await mockRouter.addLiquidity(usdcAddress,nyvUSDAddress,mockBankMiddleLiquidityAmountToAdd,mockBankLowLiquidityAmountToAdd,
        mockBankMiddleLiquidityAmountToAdd,mockBankLowLiquidityAmountToAdd,
        owner.getAddress(),deposit);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });