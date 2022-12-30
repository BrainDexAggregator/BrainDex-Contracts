import { time, loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AbiCoder } from "ethers/lib/utils";

import { brainDexExecutorData } from "../../constants/brainDexExecutor";

const abiCoder = ethers.utils.defaultAbiCoder;

function makeBigNumber(principal: Number, decimals: Number) {
    const decimalVal = toBigNum(10).pow(toBigNum(decimals));
    return toBigNum(principal).mul(decimalVal);
}

function toBigNum(input: any) {
    return ethers.BigNumber.from(input);
}

function encodeSwapData(data: any) {
    const swapData = abiCoder.encode(
        ["tuple(uint256 amountIn, address[] pools, tuple(uint8 swapType, uint8 poolInPos, uint8 poolOutPos, address tokenOut, uint256 poolFee)[] swapData)[]"],
        [data]
    );
    return swapData
}

// This set of tests does retains dust tokens on the router.

describe("BrainDex Gas Test", function () {
    async function deployBrainDexFixture() {
        const now = await time.latest();

        //Moobeam Tokens
        const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" // WMATIC
        const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

        const ERC20 = await ethers.getContractFactory("TEST20");
        const WETH = await ethers.getContractFactory("WETH9");
        const WETH_CONTRACT = await WETH.attach(WMATIC);
        const USDC_CONTRACT = await ERC20.attach(USDC);

        const KLIMA = "0x4e78011Ce80ee02d2c3e649Fb657E45898257815"

        const WETH_USDC_LP = "0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827";
        const USDC_KLIMA_LP = "0x5786b267d35F9D011c4750e0B0bA584E1fDbeAD1";

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const BrainDexExecutor = await ethers.getContractFactory(brainDexExecutorData.abi, brainDexExecutorData.bytecode);
        const executor = await BrainDexExecutor.deploy();

        const BrainDexRouter = await ethers.getContractFactory("BrainDexRouterV2");
        const router = await BrainDexRouter.deploy(WMATIC, executor.address);

        const USDC_WHALE = "0x92f17E8d81A944691C10E753AF1b1baAe1A2cD0D";
        const USDC_WHALE_SIGNER = await ethers.getImpersonatedSigner(USDC_WHALE);

        await executor.connect(owner).setRouter(
            router.address
        )

        return {
            router, executor, owner, otherAccount, now,
            WMATIC, USDC, KLIMA,
            WETH_USDC_LP,
            WETH_CONTRACT, USDC_CONTRACT,
            USDC_WHALE_SIGNER, USDC_KLIMA_LP
        };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { router, owner } = await loadFixture(deployBrainDexFixture);
            expect(await router.owner()).to.equal(owner.address);
        });
    });

    describe("Gas test for router gas savings, retain", function () {
        it("multiSwapEthForTokens", async function () {
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC,
                WETH_USDC_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP,
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);

            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                USDC,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used:", receipt.gasUsed.toString());
        });

        it("multiSwapEthForTokens, twice", async function () {
            // Second transaction should cost less gas.
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC,
                WETH_USDC_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP,
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);
            await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                USDC,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )
            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                USDC,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used, 2 tx:", receipt.gasUsed.toString());
        });

    });

    describe("Gas test for router gas savings, retain, Initialized WETH", function () {
        it("multiSwapEthForTokens", async function () {
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC,
                WETH_USDC_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).deposit({value: 3});
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(router.address, 1);
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(executor.address, 1);

            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP,
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);

            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                USDC,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used:", receipt.gasUsed.toString());
        });

        it("multiSwapEthForTokens, twice", async function () {
            // Second transaction should cost less gas.
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC,
                WETH_USDC_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).deposit({value: 3});
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(router.address, 1);
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(executor.address, 1);

            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP,
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);

            await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                USDC,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )
            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                USDC,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used, 2 tx:", receipt.gasUsed.toString());
        });

    });

    describe("Gas test for router gas savings, retain, double gas action", function () {
        it("multiSwapEthForTokens", async function () {
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC, KLIMA,
                WETH_USDC_LP, USDC_KLIMA_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);
            
            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP, USDC_KLIMA_LP
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    },
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: KLIMA,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);
            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                KLIMA,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used:", receipt.gasUsed.toString());
        });

        it("multiSwapEthForTokens, twice", async function () {
            // Second transaction should cost less gas.
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC, KLIMA,
                WETH_USDC_LP, USDC_KLIMA_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP, USDC_KLIMA_LP
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    },
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: KLIMA,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);

            const whaleBal0 = await USDC_CONTRACT.balanceOf(USDC_WHALE_SIGNER.address);
            await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                KLIMA,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )
            // expect(await USDC_CONTRACT.balanceOf(USDC_WHALE_SIGNER.address)).to.equal(whaleBal0.add(amountOut));
            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                KLIMA,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used, 2 tx:", receipt.gasUsed.toString());
        });

    });

    describe("Gas test for router gas savings, retain, initialized WETH, double gas action", function () {
        it("multiSwapEthForTokens", async function () {
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC, KLIMA,
                WETH_USDC_LP, USDC_KLIMA_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).deposit({value: 3});
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(router.address, 1);
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(executor.address, 1);
            
            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP, USDC_KLIMA_LP
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    },
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: KLIMA,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);
            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                KLIMA,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used:", receipt.gasUsed.toString());
        });

        it("multiSwapEthForTokens, twice", async function () {
            // Second transaction should cost less gas.
            const {
                router, executor, owner, otherAccount, now,
                WMATIC, USDC, KLIMA,
                WETH_USDC_LP, USDC_KLIMA_LP,
                WETH_CONTRACT, USDC_CONTRACT,
                USDC_WHALE_SIGNER
            } = await loadFixture(deployBrainDexFixture);

            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).deposit({value: 3});
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(router.address, 1);
            await WETH_CONTRACT.connect(USDC_WHALE_SIGNER).transfer(executor.address, 1);

            const route1 = {
                amountIn: makeBigNumber(10, 18), // 400 WGLMR
                pools: [
                    WETH_USDC_LP, USDC_KLIMA_LP
                ],
                //WETH > USDC > BUSD
                swapData: [
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: USDC,
                        poolFee: 997000
                    },
                    {
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: KLIMA,
                        poolFee: 997000
                    }
                ]
            }

            const swapData = encodeSwapData([route1])
            const amountOut = await executor.getSplitSwapAmountOut(swapData);

            const whaleBal0 = await USDC_CONTRACT.balanceOf(USDC_WHALE_SIGNER.address);
            await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                KLIMA,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )
            // expect(await USDC_CONTRACT.balanceOf(USDC_WHALE_SIGNER.address)).to.equal(whaleBal0.add(amountOut));
            const tx = await router.connect(USDC_WHALE_SIGNER).multiSwapEthForTokens(
                KLIMA,
                USDC_WHALE_SIGNER.address,
                1,
                now + 1000,
                swapData,
                { value: makeBigNumber(10, 18) }
            )

            const receipt = await tx.wait();
            console.log("\t Gas used, 2 tx:", receipt.gasUsed.toString());
        });

    });
});
