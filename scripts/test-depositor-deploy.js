const bre = require("@nomiclabs/buidler");
const routerABI = require("./UniswapV2Router01ABI");

async function main(){
    let [owner] = await ethers.getSigners();
    let MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
    let BURNER_ROLE = ethers.utils.id("BURNER_ROLE");
    let lowLiquidityAmountToAdd = ethers.utils.parseEther('1000000.0')
    let middleLiquidityAmountToAdd = ethers.utils.parseEther('1001000.0');
    let deposit = ethers.utils.parseEther('1000.0');
    let initialTargetBasisPoints = 10010;
    let NYVAsset = await ethers.getContractFactory("NYVAsset");
    let SimpleDepositor = await ethers.getContractFactory("SimpleDepositor");
    let mockRouter = await ethers.getContractAt(routerABI,"0xf164fC0Ec4E93095b804a4795bBe1e041497b92a");
    let nyvUSD = await NYVAsset.deploy("NYVDollar","NVUS");
    await nyvUSD.deployed();
    let mockUSD = await NYVAsset.deploy("MUSD","MUSD");
    await mockUSD.deployed();
    console.log("mockUSD address: " + mockUSD.address);
    console.log("NYVUSD address: " + nyvUSD.address);
    let usdDepositor = await SimpleDepositor.deploy(mockUSD.address,nyvUSD.address,"0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",initialTargetBasisPoints);
    await usdDepositor.deployed();
    console.log(usdDepositor.address);

    //Giving authoritah!
    let grant0 = await nyvUSD.grantRole(MINTER_ROLE,usdDepositor.address);
    await grant0.wait();
    console.log("depositor is minter");
    let grant1 = await nyvUSD.grantRole(MINTER_ROLE,owner.getAddress());
    await grant1.wait();
    console.log("owner is minter");
    let grant2 = await mockUSD.grantRole(MINTER_ROLE,owner.getAddress());
    await grant2.wait();
    console.log("owner is mock usd minter");
    await usdDepositor.setOperating(true);
    
    
    //minting liquidity
    let nyvmint = await nyvUSD.mint(owner.getAddress(),lowLiquidityAmountToAdd);
    await nyvmint.wait();
    console.log("nyvusd minted");
    let nyvaprv = await nyvUSD.approve("0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",lowLiquidityAmountToAdd);
    await nyvaprv.wait();
    console.log("nyvusd approved");
    let usdmint = await mockUSD.mint(owner.getAddress(),middleLiquidityAmountToAdd);
    await usdmint.wait();
    console.log("usd minted");
    let usdaprv = await mockUSD.approve("0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",middleLiquidityAmountToAdd);
    await usdaprv.wait();
    await mockRouter.addLiquidity(mockUSD.address,nyvUSD.address,middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
      middleLiquidityAmountToAdd,lowLiquidityAmountToAdd,
      owner.getAddress(),deposit);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });