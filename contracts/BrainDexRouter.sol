// SPDX-License-Identifier: MIT

pragma solidity =0.8.15;

//FIXME: SAFEERC20
import "@openzeppelin/contracts/access/Ownable.sol";
import { IKPool } from"./interface/IKPool.sol";
import { ISaddleStableSwap } from "./interface/ISaddleStableSwap.sol";
import { IWETH } from "./interface/IWETH.sol";
import { IERC20 } from "./interface/IERC20.sol";

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

contract BrainDexRouter is Ownable, BrainDexTypes {

    address private _feeDeposit;
    uint256 private _minFee; // In bips
    uint256 private _maxFee; // In bips
    uint256 constant private feeCap = 1000;

    address public immutable WETH;

    bool private _feeOn;

    constructor(address _WETH) {
        _feeDeposit = msg.sender;
        _minFee = 5;
        _maxFee = 20;
        WETH = _WETH;
        _feeOn = true;
    }

    modifier ensureDeadline(uint256 deadline) {
        if (deadline < block.timestamp) revert BDEX_Expired();
        _;
    }

    /** 
     @notice Performs a multi-path swap using ETH as the principal input and tokens as the principal output.
    */
    function multiSwapEthForTokens(
        address tokenOut,
        address to,
        uint256 amountOutMin,
        uint256 deadline,
        SplitPaths[] calldata splitPaths
    ) external payable ensureDeadline(deadline) {
        // Setup, get initial balance
        
        uint256 bal0 = IERC20(tokenOut).balanceOf(address(this));
        uint256 netAmountIn;
        uint256 splitPathsLen = splitPaths.length;

        for (uint i; i<splitPathsLen;) {
            netAmountIn += splitPaths[i].amountIn;
            unchecked {++i;}
        }

        if (netAmountIn != msg.value) revert BDEX_BadAmountIn();

        //Creates a 2D array of amountsOut per split, where splitAmountsOut.length is the total number of splits.
        uint256[][] memory splitAmountsOut = getSplitSwapAmountsOut(splitPaths);
        uint256 netAmountOut = sumSplitSwapAmountsOut(splitAmountsOut);

        //Early revert in the event of an unfavorable swap.
        if (netAmountOut < amountOutMin) 
            revert BDEX_AmountOutLow();

        IWETH(WETH).deposit{value: msg.value}();
        _executeSplitSwap(
            WETH,
            splitPaths,
            splitAmountsOut
        );

        // Final balance checking
        uint256 netTokens = IERC20(tokenOut).balanceOf(address(this)) - bal0;

        if (netTokens < amountOutMin) revert BDEX_AmountOutLow();

        netTokens = _feeOn ? _sendAdminFee(tokenOut, netTokens, amountOutMin) : netTokens;
        // Transfer tokens net fees to user.
        TransferHelper.safeTransfer(tokenOut, to, netTokens);
    }

    /** 
     @notice Performs a multi-path swap using tokens as the principal input and ETH as the principal output.
    */
    function multiSwapTokensForEth(
        address tokenIn,
        address to,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        SplitPaths[] calldata splitPaths
    ) external ensureDeadline(deadline) {

        IERC20 weth = IERC20(WETH);
        // Setup, get initial balance
        uint256 bal0 = weth.balanceOf(address(this));

        // Creates a 2D array of amountsOut per split, where splitAmountsOut.length is the total number of splits.
        uint256[][] memory splitAmountsOut = getSplitSwapAmountsOut(
            splitPaths
        );
        uint256 netAmountOut = sumSplitSwapAmountsOut(splitAmountsOut);

        //Early revert in the event of an unfavorable swap.
        if (netAmountOut < amountOutMin) 
            revert BDEX_AmountOutLow();

        // Initial transfer of tokens from user
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        _executeSplitSwap(
            tokenIn,
            splitPaths,
            splitAmountsOut
        );
        // Final balance checking
        uint256 netTokens = weth.balanceOf(address(this)) - bal0;
        if (netTokens < amountOutMin)
            revert BDEX_AmountOutLow();
        netTokens = _feeOn ? _sendAdminFee(WETH, netTokens, amountOutMin) : netTokens;
        IWETH(WETH).withdraw(netTokens);
        _sendEth(to, netTokens);
    }

    /** 
     @notice Performs a multi-path swap using tokens as the principal input and tokens as the principal output.
    */
    function multiSwapTokensForTokens(
        address tokenIn,
        address tokenOut,
        address to,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        SplitPaths[] calldata splitPaths
    ) external ensureDeadline(deadline) {
        // Setup, get initial balance
        uint256 bal0 = IERC20(tokenOut).balanceOf(address(this));
        // Creates a 2D array of amountsOut per split, where splitAmountsOut.length is the total number of splits.
        uint256[][] memory splitAmountsOut = getSplitSwapAmountsOut(
            splitPaths
        );
        uint256 netAmountOut = sumSplitSwapAmountsOut(splitAmountsOut);

        //Early revert in the event of an unfavorable swap.
        if (netAmountOut < amountOutMin)
            revert BDEX_AmountOutLow();

        // Initial transfer of tokens from user
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        _executeSplitSwap(
            tokenIn,
            splitPaths,
            splitAmountsOut
        );

        // Final balance checking
        uint256 netTokens = IERC20(tokenOut).balanceOf(address(this)) - bal0;
        if (netTokens < amountOutMin)
            revert BDEX_AmountOutLow();
        netTokens = _feeOn ? _sendAdminFee(tokenOut, netTokens, amountOutMin) : netTokens;
        TransferHelper.safeTransfer(tokenOut, to, netTokens);

    }

    function _executeSplitSwap (
        address tokenIn,
        SplitPaths[] memory splitPaths,
        uint256[][] memory splitAmountsOut
    ) internal {
        uint256 lenOuter = splitPaths.length;
        for (uint i; i<lenOuter;) {

            SplitPaths memory splitPath = splitPaths[i];
            SwapData[] memory swapData = splitPath.swapData;
            address[] memory pools = splitPath.pools;
            uint256[] memory amountsOut = splitAmountsOut[i];

            uint256 len = pools.length;

            if (swapData[0].swapType < SwapType.SaddleStable) {
                TransferHelper.safeTransfer(tokenIn, pools[0], splitPath.amountIn);
            }

            for(uint j; j<len;) {
                SwapData memory swapData_ = swapData[j];
                // Constant product swap
                if (swapData_.swapType == SwapType.K) {
                    _kSwap(swapData, pools, amountsOut, len, j);
                }
                // Bytesless (zenlink) constant product swap
                else if (swapData_.swapType == SwapType.ZenK) {
                    _byteslessKSwap(swapData, pools, amountsOut, len, j);
                }
                // Saddle Stableswap
                else if (swapData_.swapType == SwapType.SaddleStable) {
                    _saddleStableSwap(swapData, pools, amountsOut, len, j);
                }
                unchecked {++j;}
            }
            unchecked {++i;}
        }
    }

    function getSplitSwapAmountOut(
        SplitPaths[] calldata splitPaths
    ) public view returns(uint256) {
        return sumSplitSwapAmountsOut(
            getSplitSwapAmountsOut(splitPaths)
        );    
    }

    function getSplitSwapAmountsOut(
        SplitPaths[] calldata splitPaths
    ) public view returns(uint256[][] memory) {
        uint256 len = splitPaths.length;
        uint256[][] memory amounts = new uint256[][](len);
        for (uint i; i<len;) {
            uint256[] memory amountsOut = getAmountsOut(
                splitPaths[i].amountIn,
                splitPaths[i].pools,
                splitPaths[i].swapData
            );
            amounts[i] = amountsOut;
            unchecked {++i;}
        }
        return amounts;
    }

    function sumSplitSwapAmountsOut(
        uint256[][] memory amounts
    ) internal pure returns(uint256 netAmountOut) {
        uint256 lenOuter = amounts.length;
        for (uint256 i; i<lenOuter;) {
            uint256 lenInner = amounts[i].length;
            netAmountOut += amounts[i][lenInner-1];
            unchecked {++i;}
        }
    }

    function getAmountsOut(
        uint256 amountIn,
        address[] memory pools,
        SwapData[] memory swapData
    ) public view returns (uint256[] memory amounts) {
        uint256 len = pools.length;
        uint256[] memory _amounts = new uint256[](len+1);
        _amounts[0] = amountIn;
        uint256 nextAmt = amountIn;
        
        for(uint i; i<len;) {
            SwapData memory swapData_ = swapData[i];
            if (swapData_.swapType < SwapType.SaddleStable) {
                nextAmt = _getAmountOutK(
                    pools[i], 
                    nextAmt,
                    swapData_.poolInPos, 
                    swapData_.poolFee
                );
                _amounts[i+1] = nextAmt;
            }
            else if (swapData_.swapType == SwapType.SaddleStable) {
                nextAmt = _getAmountOutSaddleStable(
                    pools[i],
                    nextAmt,
                    swapData_.poolInPos, 
                    swapData_.poolOutPos
                );
                _amounts[i+1] = nextAmt;
            }
            else {
                revert BDEX_BadSwapType();
            }
            unchecked {++i;}
        }
        amounts = _amounts;
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

    function _getFee(
        uint256 netTokens, 
        uint256 amountOutMin
    ) internal view returns(uint256, uint256) {
        uint256 amountDiff = netTokens - amountOutMin;
        uint256 feePercent = amountDiff * 10000 / ((amountOutMin + netTokens) / 2); // in bips

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

    function _kSwap(
        SwapData[] memory swapData,
        address[] memory pools,
        uint256[] memory amountsOut,
        uint256 swapLen,
        uint256 i
    ) internal {
        address to_;
        uint256 iPlusOne = i+1;

        (uint256 amount0Out, uint256 amount1Out) = swapData[i].poolInPos == 0 ? (uint256(0), amountsOut[iPlusOne]) : (amountsOut[iPlusOne], uint256(0));
        if (iPlusOne < swapLen) {
            to_ = (swapData[iPlusOne].swapType < SwapType.SaddleStable) ? pools[iPlusOne] : address(this);   
        } else {
            to_ = address(this);
        }
        IKPool(pools[i]).swap(amount0Out, amount1Out, to_, "");
    }

    function _byteslessKSwap(
        SwapData[] memory swapData,
        address[] memory pools,
        uint256[] memory amountsOut,
        uint256 swapLen,
        uint256 i
    ) internal {
        address to_;
        uint256 iPlusOne = i+1;
    
        (uint256 amount0Out, uint256 amount1Out) = swapData[i].poolInPos == 0 ? (uint256(0), amountsOut[iPlusOne]) : (amountsOut[iPlusOne], uint256(0));
        if (iPlusOne < swapLen) {
            to_ = (swapData[iPlusOne].swapType < SwapType.SaddleStable) ? pools[iPlusOne] : address(this);   
        } else {
            to_ = address(this);
        }
        IKPool(pools[i]).swap(amount0Out, amount1Out, to_);
    }

    function _saddleStableSwap(
        SwapData[] memory swapData,
        address[] memory pools,
        uint256[] memory amountsOut,
        uint256 swapLen,
        uint256 i
    ) internal {
        uint256 iPlusOne = i+1;
        SwapData memory data = swapData[i];
        
        uint256 amountOutThis = ISaddleStableSwap(pools[i]).swap(
            data.poolInPos, 
            data.poolOutPos, 
            amountsOut[i], 
            amountsOut[iPlusOne], 
            ~uint256(0)
        );
        if (iPlusOne < swapLen) {
            if (swapData[iPlusOne].swapType < SwapType.SaddleStable) {
                TransferHelper.safeTransfer(data.tokenOut, pools[iPlusOne], amountOutThis);
            }
        }
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

    function feeOn() public view returns (bool isFeeOn) {
        isFeeOn = _feeOn;
    }

    //Because curve-style pools rely on transferFrom, the swapper must approve them to transfer from this address.
    function approvePools(address[] calldata tokenAddresses, address[] calldata poolAddresses) external onlyOwner {
        uint256 len = tokenAddresses.length;
        for (uint i; i<len;) {
            IERC20(tokenAddresses[i]).approve(poolAddresses[i], ~uint256(0));
            unchecked {++i;}
        }
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