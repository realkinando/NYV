const bre = require("@nomiclabs/buidler");
const routerABI = require("./UniswapV2Router01ABI");

async function main(){
    const [deployer] = await ethers.getSigners();
    console.log(
        "Deploying contracts with the account:",
        await deployer.getAddress()
      );
    console.log("Account balance:", (await deployer.getBalance()).toString());
    //deploy all assets
    //give the exchange mint and burn roles for all assets
    //deploy the depositors
    //give the depositors mint and burn roles
}