// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import { IKPool } from"./interface/IKPool.sol";
import { ISaddleStableSwap } from "./interface/ISaddleStableSwap.sol";
import { IWETH } from "./interface/IWETH.sol";
import { IERC20 } from "./interface/IERC20.sol";
import { IBrainDexExecutor } from "./interface/IBrainDexExecutor.sol";

import './libraries/TransferHelper.sol';

import { BrainDexTypes } from "./BrainDexTypes.sol";

error BDEX_AmountOutLow();
error BDEX_BadAmountIn();
error BDEX_BadSwapType();
error BDEX_Expired();

error BDEX_BadFeeOrder();
error BDEX_FeeTooHigh();

error BDEX_AddressZero();

error BDEX_EthTransferFailed();

contract BrainDexRouterV2 is Ownable, BrainDexTypes {

    address private _feeDeposit;
    uint256 private _minFee; // In bips
    uint256 private _maxFee; // In bips
    uint256 constant private feeCap = 1000;

    address public immutable WETH;
    IBrainDexExecutor private _executor;

    bool private _feeOn;

    constructor(address WETH_, address executor_) {
        _feeDeposit = msg.sender;
        _minFee = 5;
        _maxFee = 20;
        WETH = WETH_;
        _executor = IBrainDexExecutor(executor_);
        _feeOn = true;
    }

    modifier ensureDeadline(uint256 deadline) {
        if (deadline < block.timestamp) revert BDEX_Expired();
        _;
    }

    /** 
     * @notice Performs a multi-path swap using the network token as the principal input and tokens as the principal output.
     * @dev Executes a swap according to the data structure provided in `splitPaths`. `amountOutMin` is the minimum
     * number of tokens to be returned prior to the router fee.
    */
    function multiSwapEthForTokens(
        address tokenOut,
        address to,
        uint256 amountOutMin,
        uint256 deadline,
        bytes calldata swapData
    ) external payable ensureDeadline(deadline) {
        
        uint256 bal0 = IERC20(tokenOut).balanceOf(address(this));

        IWETH(WETH).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WETH, address(_executor), msg.value);
        
        _executor.executeSplitSwap(
            WETH,
            tokenOut,
            amountOutMin,
            swapData          
        );

        // Final balance checking
        uint256 netTokens = IERC20(tokenOut).balanceOf(address(this)) - bal0;

        if (netTokens < amountOutMin) revert BDEX_AmountOutLow();

        netTokens = _feeOn ? _sendAdminFee(tokenOut, netTokens, amountOutMin) : netTokens;
        // Transfer tokens net fees to user.
        TransferHelper.safeTransfer(tokenOut, to, netTokens);
    }

    /** 
     * @notice Performs a multi-path swap using tokens as the principal input and ETH as the principal output.
     * @dev Executes a swap according to the data structure provided in `splitPaths`. `amountOutMin` is the minimum
     * number of tokens to be returned prior to the router fee.
    */
    function multiSwapTokensForEth(
        address tokenIn,
        address to,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        bytes calldata swapData
    ) external ensureDeadline(deadline) {

        // Initial transfer of tokens from user
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(_executor), amountIn);

        _executor.executeSplitSwap(
            tokenIn,
            WETH,
            amountOutMin,
            swapData
        );
        // Final balance checking
        uint256 netTokens = IERC20(WETH).balanceOf(address(this)) - 1;
        
        if (netTokens < amountOutMin) revert BDEX_AmountOutLow();
        
        netTokens = _feeOn ? _sendAdminFee(WETH, netTokens, amountOutMin) : netTokens;
        IWETH(WETH).withdraw(netTokens);
        _sendEth(to, netTokens);
    }

    /** 
     * @notice Performs a multi-path swap using tokens as the principal input and tokens as the principal output.
     * @dev Executes a swap according to the data structure provided in `splitPaths`. `amountOutMin` is the minimum
     * number of tokens to be returned prior to the router fee.
    */
    function multiSwapTokensForTokens(
        address tokenIn,
        address tokenOut,
        address to,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        bytes calldata swapData
    ) external ensureDeadline(deadline) {

        // Initial transfer of tokens from user
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(_executor), amountIn);

        _executor.executeSplitSwap(
            tokenIn,
            tokenOut,
            amountOutMin,
            swapData
        );

        // Final balance checking
        uint256 netTokens = IERC20(tokenOut).balanceOf(address(this)) - 1;

        if (netTokens < amountOutMin) revert BDEX_AmountOutLow();
        netTokens = _feeOn ? _sendAdminFee(tokenOut, netTokens, amountOutMin) : netTokens;
        TransferHelper.safeTransfer(tokenOut, to, netTokens);

    }

    function _sendAdminFee(
        address token, 
        uint256 netTokens, 
        uint256 amountOutMin
    ) internal returns(uint256) {
        (uint256 feeAmount, uint256 amountNetFee) = _getFee(netTokens, amountOutMin);
        TransferHelper.safeTransfer(token, owner(), feeAmount);
        return amountNetFee;
    }

    function getFee(
        uint256 netTokens, 
        uint256 amountOutMin
    ) public view returns(uint256, uint256) {
        return _getFee(netTokens, amountOutMin);
    }

    // Fee is equal to half of the difference between netTokens and AmountOutMin, floored at _minFee 
    // and capped at _maxFee.

    function _getFee(
        uint256 netTokens, 
        uint256 amountOutMin
    ) internal view returns(uint256, uint256) {
        uint256 amountDiff = netTokens - amountOutMin;
        uint256 feePercent = amountDiff * 10000 / ((amountOutMin + netTokens) / 2) / 2; // in bips

        if (feePercent < _minFee) {
            feePercent = _minFee;
        }
        else if (feePercent > _maxFee) {
            feePercent = _maxFee;
        }
        uint256 feeAmount = (netTokens * feePercent / 10000);
        uint256 amountNetFee = netTokens - feeAmount; 
        return (feeAmount, amountNetFee);
    }

    function _getAmountOutK(
        address pool, 
        uint256 amountIn, 
        uint256 poolInPos, 
        uint256 fee
    ) internal view returns(uint256 amtOut) {
        (uint256 reserve0, uint256 reserve1) = IKPool(pool).getReserves();
        (uint256 reserveIn, uint256 reserveOut) = poolInPos == 0 ? (reserve0, reserve1) : (reserve1, reserve0);
        uint256 amountInWithFee = amountIn * fee;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1_000_000) + amountInWithFee;

        amtOut = numerator/denominator;
    }

    function _getAmountOutSaddleStable(
        address pool, 
        uint256 amountIn, 
        uint8 poolInPos, 
        uint8 poolOutPos
    ) internal view returns(uint256 amtOut) {
        amtOut = ISaddleStableSwap(pool).calculateSwap(poolInPos, poolOutPos, amountIn);
    }

    function _sendEth(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        if(!success) revert BDEX_EthTransferFailed();
    }

    function setFeeDeposit(address newFeeDeposit) external onlyOwner {
        if (newFeeDeposit == address(0)) revert BDEX_AddressZero();
        _feeDeposit = newFeeDeposit;
    }

    function setFees(uint256 minFee_, uint256 maxFee_) external onlyOwner {
        if (minFee_ > maxFee_) revert BDEX_BadFeeOrder();
        if (maxFee_ > feeCap) revert BDEX_FeeTooHigh();

        _minFee = minFee_;
        _maxFee = maxFee_;
    }

    function setFeeOn(bool state) external onlyOwner {
        _feeOn = state;
    }

    function minFee() public view returns(uint256 fee) {
        fee = _minFee;
    }

    function maxFee() public view returns(uint256 fee) {
        fee = _maxFee;
    }

    function executor() public view returns (address) {
        return address(_executor);
    }

    function feeOn() public view returns (bool isFeeOn) {
        isFeeOn = _feeOn;
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        TransferHelper.safeTransfer(token, owner(), amount);
    }

    function rescueEth(uint256 amount) external onlyOwner {
        _sendEth(owner(), amount);
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }

}