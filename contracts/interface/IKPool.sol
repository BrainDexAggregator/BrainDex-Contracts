// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IKPool {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function swap(uint amount0Out, uint amount1Out, address to) external;
    function getReserves() external view returns (uint256, uint256);
}