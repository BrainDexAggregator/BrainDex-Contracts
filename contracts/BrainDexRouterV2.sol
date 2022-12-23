// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import { IKPool } from"./interface/IKPool.sol";
import { ISaddleStableSwap } from "./interface/ISaddleStableSwap.sol";
import { IWETH } from "./interface/IWETH.sol";
import { IERC20 } from "./interface/IERC20.sol";
import { IBrainDexExecutor } from "./interface/IBrainDexExecutor.sol";

import './libraries/TransferHelper.sol';

error BDEX_AmountOutLow();
error BDEX_Expired();
error BDEX_Paused();

error BDEX_BadFeeOrder();
error BDEX_FeeTooHigh();

error BDEX_AddressZero();
error BDEX_AmountOutMinZero();
error BDEX_SwapDataZero();

error BDEX_EthTransferFailed();

contract BrainDexRouterV2 is Ownable {

    address private _feeDeposit;
    uint256 private _minFee; // In bips
    uint256 private _maxFee; // In bips
    uint256 constant private feeCap = 200;

    address public immutable WETH;
    IBrainDexExecutor private _executor;

    bool private _feeOn;
    bool private _paused;

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

    modifier notPaused() {
        if (_paused) revert BDEX_Paused();
        _;
    }

    /**
     * @notice Upon completion of any swap, the executor contract will transfer its balance of `tokenOut` back 
     * to this contract, final balance checks will be completed, fees will be processed and the results of the 
     * swap will be transferred to the user.
     */

    /** 
     * @notice Performs a multi-path swap using the network token as the principal input and tokens as the principal output.
     * @param tokenOut Token to recieve after swap.
     * @param to Address to recieve resulting amount of tokenOut tokens.
     * @param amountOutMin Minimum amount of tokenOut to recieve, pre optimizer fee.
     * @param deadline Deadline for executing the swap. The transaction will revert if blocktime exceeds `deadline`.
     * @param swapData bytes package defining swap paramters for the executor contract.
    */
    function multiSwapEthForTokens(
        address tokenOut,
        address to,
        uint256 amountOutMin,
        uint256 deadline,
        bytes calldata swapData
    ) external payable notPaused ensureDeadline(deadline) {
        
        if (amountOutMin == 0) revert BDEX_AmountOutMinZero();
        if (swapData.length == 0) revert BDEX_SwapDataZero();

        IWETH(WETH).deposit{value: msg.value}();
        TransferHelper.safeTransfer(WETH, address(_executor), msg.value);
        _executor.executeSplitSwap(
            WETH,
            tokenOut,
            amountOutMin,
            swapData          
        );

        // Final balance checking
        uint256 netTokens = IERC20(tokenOut).balanceOf(address(this)) - 1;

        if (netTokens < amountOutMin) revert BDEX_AmountOutLow();

        netTokens = _feeOn ? _sendAdminFee(tokenOut, netTokens, amountOutMin) : netTokens;
        
        address receiver = to == address(0) ? msg.sender : to;
        // Transfer tokens net fees to user.
        TransferHelper.safeTransfer(tokenOut, receiver, netTokens);
    }

    /** 
     * @notice Performs a multi-path swap using tokens as the principal input and ETH as the principal output.
     * @param tokenIn Input token for swap.
     * @param to Address to recieve resulting amount of tokenOut tokens.
     * @param amountIn Amount of `tokenIn` tokens with which to initiate the swap.
     * @param amountOutMin Minimum amount of tokenOut to recieve, pre optimizer fee.
     * @param deadline Deadline for executing the swap. The transaction will revert if blocktime exceeds `deadline`.
     * @param swapData bytes package defining swap paramters for the executor contract.
    */
    function multiSwapTokensForEth(
        address tokenIn,
        address to,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        bytes calldata swapData
    ) external notPaused ensureDeadline(deadline) {

        if (amountOutMin == 0) revert BDEX_AmountOutMinZero();
        if (swapData.length == 0) revert BDEX_SwapDataZero();

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

        address receiver = to == address(0) ? msg.sender : to;

        IWETH(WETH).withdraw(netTokens);
        _sendEth(receiver, netTokens);
    }

    /** 
     * @notice Performs a multi-path swap using tokens as the principal input and tokens as the principal output.
     * @param tokenIn Input token for swap.
     * @param tokenOut Token to recieve after swap.
     * @param to Address to recieve resulting amount of tokenOut tokens.
     * @param amountIn Amount of `tokenIn` tokens with which to initiate the swap.
     * @param amountOutMin Minimum amount of tokenOut to recieve, pre optimizer fee.
     * @param deadline Deadline for executing the swap. The transaction will revert if blocktime exceeds `deadline`.
     * @param swapData bytes package defining swap paramters for the executor contract. 
    */
    function multiSwapTokensForTokens(
        address tokenIn,
        address tokenOut,
        address to,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        bytes calldata swapData
    ) external notPaused ensureDeadline(deadline) {

        if (amountOutMin == 0) revert BDEX_AmountOutMinZero();
        if (swapData.length == 0) revert BDEX_SwapDataZero();

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
        
        address receiver = to == address(0) ? msg.sender : to;
        // Transfer tokens net fees to user.
        TransferHelper.safeTransfer(tokenOut, receiver, netTokens);

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

    function setPaused(bool state) external onlyOwner {
        _paused = state;
    }

    function isPaused() external view returns(bool paused) {
        paused = _paused;
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