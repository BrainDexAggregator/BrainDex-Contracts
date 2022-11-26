// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract BrainDexTypes {

    enum SwapType { 
        None, 
        K, 
        ZenK, 
        SaddleStable, 
        SaddleStableMeta, 
        SaddleStablePseudoMeta 
    }

    /*

    Swap types use a buffered enum for compasability and future-proofing.

    1 = conventional kpool, swap takes four paramaters
    2 = modified kpool, "bytesless swap" ala Zenlink

    3 = Saddle-style stableswap
    4 = Saddle-style metapool
    5 = Saddle-style pseudo-metapool

    Below unimplemented
    6 = Curve-style stableswap 
    7 = Curve-style metapool
    8 = Curve-style aCrypto  

    9 = Dodo-style PMM

    */

    struct SplitPaths {
        uint256 amountIn;
        address[] pools;
        SwapData[] swapData;
    }

    struct SwapData {
        SwapType swapType; //? enum
        uint8 poolInPos; //1
        uint8 poolOutPos; //
        address tokenOut; //20
        uint256 poolFee; //32
    }
}