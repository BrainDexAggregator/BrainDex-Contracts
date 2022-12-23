import { time, loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

function makeBigNumber(principal: Number, decimals: Number) {
    const decimalVal = toBigNum(10).pow(toBigNum(decimals));
    return toBigNum(principal).mul(decimalVal);
}

function toBigNum(input: any) {
    return ethers.BigNumber.from(input);
}

describe("BrainDex", function () {
    async function deployBrainDexFixture() {
        const now = await time.latest();

        //Moobeam Tokens
        const WETH = "0xAcc15dC74880C9944775448304B263D191c6077F" // WGLMR
        const USDC_WH = "0x931715FEE2d06333043d11F658C8CE934aC61D0c";
        const USDC_MC = "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b";
        const BUSD = "0x692c57641fc054c2ad6551ccc6566eba599de1ba";
        //XC tokens don't work from forked mainnets. Avoid.
        const XC_DOT = "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080";
        const XC_INTR = "0xFffFFFFF4C1cbCd97597339702436d4F18a375Ab";
        const XC_TUSD = "0xFFFFFFfFea09FB06d082fd1275CD48b191cbCD1d";
        const WELL = "0x511aB53F793683763E5a8829738301368a2411E3";

        const ERC20 = await ethers.getContractFactory("TEST20");
        const WGLMR = await ethers.getContractFactory("WETH9");
        const WETH_CONTRACT = await WGLMR.attach(WETH);
        const BUSD_CONTRACT = await ERC20.attach(BUSD);
        const USDC_WH_CONTRACT = await ERC20.attach(USDC_WH);

        const WETH_USDC_MC = "0x8CCBbcAF58f5422F6efD4034d8E8a3c9120ADf79";
        const STEL_STAB_4POOL = "0xB1BC9f56103175193519Ae1540A0A4572b1566F6";

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const BrainDexRouter = await ethers.getContractFactory("BrainDexRouter");
        const router = await BrainDexRouter.deploy(WETH);

        await router.connect(owner).approvePools(
            [
                BUSD,
                USDC_WH
            ],
            [
                STEL_STAB_4POOL,
                STEL_STAB_4POOL
            ]
        )

        return {
            router, owner, otherAccount, now, WETH,
            BUSD, USDC_WH, USDC_MC, XC_DOT, XC_INTR, XC_TUSD, WELL,
            WETH_USDC_MC, STEL_STAB_4POOL,
            WETH_CONTRACT, BUSD_CONTRACT, USDC_WH_CONTRACT
        };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { router, owner } = await loadFixture(deployBrainDexFixture);
            expect(await router.owner()).to.equal(owner.address);
        });
    });

    describe("Views", function () {
        describe("Get amounts out starting from KPool", function () {
            it("GetAmountsOut, single KPool", async function () {
                const { router, WETH_USDC_MC } = await loadFixture(deployBrainDexFixture);
                const amountsOut = await router.getAmountsOut(
                    1000000,
                    [WETH_USDC_MC],
                    [{
                        swapType: 1,
                        poolInPos: 0,
                        poolOutPos: 1,
                        tokenOut: "0xacc15dc74880c9944775448304b263d191c6077f",
                        poolFee: 997500
                    }]
                )
                expect(amountsOut).to.eql(
                    [toBigNum("1000000"), toBigNum("2844470013364455740")]
                )
            });

            it("GetAmountsOut, single Stable pool", async function () {
                const { router, STEL_STAB_4POOL } = await loadFixture(deployBrainDexFixture);
                //Inter-contract calls to XC-tokens don't work from fork
                const amountsOut = await router.getAmountsOut(
                    1000000,
                    [STEL_STAB_4POOL],
                    [{
                        swapType: 3,
                        poolInPos: 0,
                        poolOutPos: 2,
                        tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                        poolFee: 0
                    }]
                )
                expect(amountsOut).to.eql(
                    [toBigNum("1000000"), toBigNum("999291590559806155")]
                )
            });

            it("GetAmountsOut ending with Stablepool", async function () {
                const { router, WETH_USDC_MC, STEL_STAB_4POOL } = await loadFixture(deployBrainDexFixture);
                const route ={
                    amountIn: makeBigNumber(5, 20), // 500 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        STEL_STAB_4POOL
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                    }
                const amountsOut = await router.getAmountsOut(route.amountIn, route.pools, route.swapData);
                expect(amountsOut).to.eql(
                    [toBigNum("500000000000000000000"), toBigNum("174878830"), toBigNum("174754847519309521232")]
                )
            });

            it("GetSplitSwapAmountOut ending with Stablepool", async function () {
                const { router, WETH_USDC_MC, STEL_STAB_4POOL } = await loadFixture(deployBrainDexFixture);
                const route1 ={
                    amountIn: makeBigNumber(45, 19), // 400 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        STEL_STAB_4POOL
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }

                const route2 ={
                    amountIn: makeBigNumber(5, 19), // 100 WGLMR
                    pools: [
                        "0x88c3c88f668aaec67a454b3c931ed70a37e7c467"
                    ],
                    //WETH > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 997500
                        }
                    ]
                }
                const amountOut = await router.getSplitSwapAmountOut([route1, route2]);
                expect(amountOut).to.equal(toBigNum("160366978553752989893"));
                const amountsOut = await router.getSplitSwapAmountsOut([route1, route2]);
                expect(amountsOut).to.eql(
                    [
                    [toBigNum("450000000000000000000"), toBigNum("157393009"), toBigNum("157281432054813543713")],
                    [toBigNum("50000000000000000000"), toBigNum("3085546498939446180")]
                    ]
                )
            });
        });
    });
    describe("Swaps", function () {
        describe("Happy path", function () {
            it("multiSwapEthForTokens single path", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, 
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);

                const route1 ={
                    amountIn: makeBigNumber(10, 18), // 400 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6"
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }
                const amountOut = await router.getSplitSwapAmountOut([route1]);
                const fees = await router.getFee(amountOut, 1);
                expect(amountOut).to.equal(fees[0].add(fees[1]));

                await expect(router.connect(otherAccount).multiSwapEthForTokens(
                    BUSD,
                    otherAccount.address,
                    1,
                    now + 1000,
                    [route1],
                    {value: makeBigNumber(10, 18)}
                ))
                .to.changeEtherBalance(otherAccount.address, makeBigNumber(10, 18).mul(-1))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, fees[1])
                .to.changeTokenBalance(BUSD_CONTRACT, owner.address, fees[0])

            });

            it("multiSwapEthForTokens multi path", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, 
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);

                const route1 ={
                    amountIn: makeBigNumber(15, 18), // 15 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6"
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }

                const route2 ={
                    amountIn: makeBigNumber(5, 18), // 5 WGLMR
                    pools: [
                        "0x88c3c88f668aaec67a454b3c931ed70a37e7c467"
                    ],
                    //WETH > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 997500
                        }
                    ]
                }

                const amountOut = await router.getSplitSwapAmountOut([route1, route2]);
                const fees = await router.getFee(amountOut, 1);
                expect(amountOut).to.equal(fees[0].add(fees[1]));

                await expect(router.connect(otherAccount).multiSwapEthForTokens(
                    BUSD,
                    otherAccount.address,
                    1,
                    now + 1000,
                    [route1, route2],
                    {value: makeBigNumber(20, 18)}
                ))
                .to.changeEtherBalance(otherAccount.address, makeBigNumber(20, 18).mul(-1))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, fees[1])
                .to.changeTokenBalance(BUSD_CONTRACT, owner.address, fees[0])

            });

            it("multiSwapTokensForTokens single path", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, 
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);



                await WETH_CONTRACT.connect(otherAccount).deposit({value: makeBigNumber(10, 18)});

                const route1 ={
                    amountIn: makeBigNumber(10, 18), // 400 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6"
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }
                const amountOut = await router.getSplitSwapAmountOut([route1]);
                const fees = await router.getFee(amountOut, 1);
                expect(amountOut).to.equal(fees[0].add(fees[1]));

                await WETH_CONTRACT.connect(otherAccount).approve(router.address, makeBigNumber(1000, 18));

                await expect(router.connect(otherAccount).multiSwapTokensForTokens(
                    WETH,
                    BUSD,
                    otherAccount.address,
                    makeBigNumber(10, 18),
                    1,
                    now + 1000,
                    [route1]
                ))
                .to.changeTokenBalance(WETH_CONTRACT, otherAccount.address, makeBigNumber(10, 18).mul(-1))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, fees[1].add)
                .to.changeTokenBalance(BUSD_CONTRACT, owner.address, fees[0])
            });

            it.only("multiSwapTokensForTokens multi path", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, USDC_WH_CONTRACT,
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);

                await WETH_CONTRACT.connect(otherAccount).deposit({value: makeBigNumber(50, 18)});

                const route1 ={
                    amountIn: makeBigNumber(15, 18), // 15 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6"
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }

                const route2 ={
                    amountIn: makeBigNumber(5, 18), // 5 WGLMR
                    pools: [
                        "0x88c3c88f668aaec67a454b3c931ed70a37e7c467"
                    ],
                    //WETH > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 997500
                        }
                    ]
                }
                const amountOut = await router.getSplitSwapAmountOut([route1, route2]);
                const fees = await router.getFee(amountOut, 1);
                expect(amountOut).to.equal(fees[0].add(fees[1]));

                await WETH_CONTRACT.connect(otherAccount).approve(router.address, makeBigNumber(2000, 18));

                await expect(router.connect(otherAccount).multiSwapTokensForTokens(
                    WETH,
                    BUSD,
                    otherAccount.address,
                    makeBigNumber(20, 18),
                    1,
                    now + 1000,
                    [route1, route2]
                ))
                .to.changeTokenBalance(WETH_CONTRACT, otherAccount.address, makeBigNumber(20, 18).mul(-1))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, fees[1])
                .to.changeTokenBalance(BUSD_CONTRACT, owner.address, fees[0])

                await mine(1);

                const amountOut2 = await router.getSplitSwapAmountOut([route1, route2]);
                const fees2 = await router.getFee(amountOut2, 1);
                expect(amountOut2).to.equal(fees2[0].add(fees2[1]));

                await expect(router.connect(otherAccount).multiSwapTokensForTokens(
                    WETH,
                    BUSD,
                    otherAccount.address,
                    makeBigNumber(20, 18),
                    1,
                    now + 1000,
                    [route1, route2]
                ))
                .to.changeTokenBalance(WETH_CONTRACT, otherAccount.address, makeBigNumber(20, 18).mul(-1))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, fees2[1])
                .to.changeTokenBalance(BUSD_CONTRACT, owner.address, fees2[0])
                expect(await BUSD_CONTRACT.balanceOf(router.address)).to.equal(1)

            });

            it("multiSwapTokensForEth single path", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, 
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);

                const initRoute ={
                    amountIn: makeBigNumber(75, 18), // 75 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6"
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }

                await router.connect(otherAccount).multiSwapEthForTokens(
                    BUSD,
                    otherAccount.address,
                    1,
                    now + 1000,
                    [initRoute],
                    {value: makeBigNumber(75, 18)}
                );

                const route1 ={
                    amountIn: makeBigNumber(10, 18), // 10 BUSD
                    pools: [
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6",
                        WETH_USDC_MC
                    ],
                    //BUSD > USDC > WETH
                    swapData: [
                        {
                            swapType: 3,
                            poolInPos: 2,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 0
                        },
                        {
                            swapType: 1,
                            poolInPos: 0,
                            poolOutPos: 1,
                            tokenOut: WETH,
                            poolFee: 997500
                        }
                    ]
                }
                const amountOut = await router.getSplitSwapAmountOut([route1]);
                const fees = await router.getFee(amountOut, 1);
                expect(amountOut).to.equal(fees[0].add(fees[1]));

                await mine(1); //Mine to get changeTokenBalance to agree with things

                await BUSD_CONTRACT.connect(otherAccount).approve(router.address, makeBigNumber(1000, 18));

                await expect(router.connect(otherAccount).multiSwapTokensForEth(
                    BUSD,
                    otherAccount.address,
                    makeBigNumber(10, 18),
                    1,
                    now + 1000,
                    [route1]
                ))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, makeBigNumber(10, 18).mul(-1))
                .to.changeEtherBalance(otherAccount.address, fees[1])
                .to.changeTokenBalance(WETH_CONTRACT, owner.address, fees[0])
            });

            it("multiSwapTokensForEth multi path", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, 
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);

                const initRoute ={
                    amountIn: makeBigNumber(75, 18), // 75 WGLMR
                    pools: [
                        WETH_USDC_MC,
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6"
                    ],
                    //WETH > USDC > BUSD
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 1,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 997500
                        },{
                            swapType: 3,
                            poolInPos: 0,
                            poolOutPos: 2,
                            tokenOut: "0x692c57641fc054c2ad6551ccc6566eba599de1ba",
                            poolFee: 0
                        }
                    ]
                }

                await router.connect(otherAccount).multiSwapEthForTokens(
                    BUSD,
                    otherAccount.address,
                    1,
                    now + 1000,
                    [initRoute],
                    {value: makeBigNumber(75, 18)}
                );

                const route1 ={
                    amountIn: makeBigNumber(10, 18), // 10 BUSD
                    pools: [
                        "0xb1bc9f56103175193519ae1540a0a4572b1566f6",
                        WETH_USDC_MC
                    ],
                    //BUSD > USDC > WETH
                    swapData: [
                        {
                            swapType: 3,
                            poolInPos: 2,
                            poolOutPos: 0,
                            tokenOut: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",
                            poolFee: 0
                        },
                        {
                            swapType: 1,
                            poolInPos: 0,
                            poolOutPos: 1,
                            tokenOut: WETH,
                            poolFee: 997500
                        }
                    ]
                }

                const route2 ={
                    amountIn: makeBigNumber(5, 18), // 5 BUSD
                    pools: [
                        "0x88c3c88f668aaec67a454b3c931ed70a37e7c467"
                    ],
                    //BUSD > WETH
                    swapData: [
                        {
                            swapType: 1,
                            poolInPos: 0,
                            poolOutPos: 1,
                            tokenOut: WETH,
                            poolFee: 997500
                        }
                    ]
                }

                const amountOut = await router.getSplitSwapAmountOut([route1, route2]);
                const fees = await router.getFee(amountOut, 1);
                expect(amountOut).to.equal(fees[0].add(fees[1]));

                await BUSD_CONTRACT.connect(otherAccount).approve(router.address, makeBigNumber(1000, 18));

                await mine(1); //Mine to get changeTokenBalance to agree with things

                await expect(router.connect(otherAccount).multiSwapTokensForEth(
                    BUSD,
                    otherAccount.address,
                    makeBigNumber(15, 18),
                    1,
                    now + 1000,
                    [route1, route2]
                ))
                .to.changeTokenBalance(BUSD_CONTRACT, otherAccount.address, makeBigNumber(15, 18).mul(-1))
                .to.changeEtherBalance(otherAccount.address, fees[1])
                .to.changeTokenBalance(WETH_CONTRACT, owner.address, fees[0])
            });
            
        });

        describe("Sad path", function () {
            it("multiSwapTokensForTokens single path", async function () {

            });
        });

        describe("Fee calculation", function () {
            it("Fee should equal half of difference between netTokens and AmountOutMin.", async function () {
                const { 
                    router, WETH, BUSD, WETH_USDC_MC, USDC_WH, STEL_STAB_4POOL,
                    WETH_CONTRACT, BUSD_CONTRACT, 
                    owner, otherAccount, now 
                } = await loadFixture(deployBrainDexFixture);

                const amountIn = makeBigNumber(75, 18); // 75 WGLMR
                
                const fees = await router.getFee(amountIn, amountIn.mul(999).div(1000));
                console.log(fees);
                expect(fees[0]).to.equal(amountIn.sub(amountIn.mul(999).div(1000)).div(2));
                console.log
            });
        });

        describe("Events", function () {
            it("Should emit an event on withdrawals", async function () {

            });
        });

    });
});
