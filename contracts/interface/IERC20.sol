// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external;
    function balanceOf(address who) external view returns (uint256);
    function approve(address user, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}