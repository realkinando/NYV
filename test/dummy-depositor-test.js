const { expect } = require("chai");

describe("dummy depositor", function (){
    let NYVAsset;
    let SimpleDepositor;

    let nyvUSD;
    let mockUSDC;
    let usdcDepositor;

    let MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
    let deposit = ethers.utils.parseEther('1000.0');
    let approve = ethers.utils.parseEther('1001.0');

    let owner;
    let addr1;
    let addrs;

    it("works", async function(){
        [owner, addr1, ...addrs] = await ethers.getSigners();
        NYVAsset = await ethers.getContractFactory("NYVAsset");
        SimpleDepositor = await ethers.getContractFactory("DummyDepositor");
        nyvUSD = await NYVAsset.deploy("NYVDollar","NVUS");
        await nyvUSD.deployed();
        mockUSDC = await NYVAsset.deploy("USDC","USDC");
        await mockUSDC.deployed();
        usdcDepositor = await SimpleDepositor.deploy(mockUSDC.address,nyvUSD.address);
        await nyvUSD.grantRole(MINTER_ROLE,usdcDepositor.address);
        await nyvUSD.grantRole(MINTER_ROLE,owner.getAddress());
        await mockUSDC.grantRole(MINTER_ROLE,owner.getAddress());
        let usdcMint = await mockUSDC.mint(addr1.getAddress(),deposit);
        await usdcMint.wait();
        let usdcapprove = await mockUSDC.connect(addr1).approve(usdcDepositor.address,approve);
        await usdcapprove.wait();
        await usdcDepositor.connect(addr1).deposit(deposit);
        expect(await nyvUSD.balanceOf(addr1.getAddress())).to.equal(deposit);
    })
})