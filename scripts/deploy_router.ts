import { ethers } from "hardhat";

async function main() {

  const WGLMR = "0xAcc15dC74880C9944775448304B263D191c6077F";
  const WMOVR = "0x98878B06940aE243284CA214f92Bb71a2b032B8A";

  const Swapper = await ethers.getContractFactory("BrainDexRouter");
  const swapper = await Swapper.deploy(WMOVR);
  await swapper.deployed();

  console.log("Swapper deployed to:", swapper.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
