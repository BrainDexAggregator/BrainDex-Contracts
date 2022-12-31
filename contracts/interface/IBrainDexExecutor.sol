// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBrainDexExecutor {
    function executeSplitSwap(address tokenIn, address tokenOut, uint256 amountOutMin, bytes calldata swapData) external;
    function getSplitSwapAmountOut(bytes calldata data) external view returns(uint256);
}