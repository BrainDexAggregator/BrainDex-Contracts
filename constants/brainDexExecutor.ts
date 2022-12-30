export const brainDexExecutorData = {
  abi:[
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "executeSplitSwap",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "getSplitSwapAmountsOut",
    "outputs": [
      {
        "internalType": "uint256[][]",
        "name": "",
        "type": "uint256[][]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "getSplitSwapAmountOut",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newRouter",
        "type": "address"
      }
    ],
    "name": "setRouter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
],
bytecode: "0x608060405234801561001057600080fd5b5061001a3361001f565b61006f565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b611d298061007e6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c80638da5cb5b1161005b5780638da5cb5b146100c5578063c04ad433146100ed578063c0d7865514610100578063f2fde38b1461011357600080fd5b80631c212c20146100825780632eb6f60414610097578063715018a6146100bd575b600080fd5b610095610090366004611357565b610126565b005b6100aa6100a53660046114c0565b610481565b6040519081526020015b60405180910390f35b6100956104b2565b60005460405173ffffffffffffffffffffffffffffffffffffffff90911681526020016100b4565b6100956100fb3660046115bf565b6104c6565b61009561010e36600461162b565b6105fa565b61009561012136600461162b565b610696565b60015473ffffffffffffffffffffffffffffffffffffffff163314610177576040517fd981f75a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600061018582840184611759565b8051909150600090815b818110156101ca578381815181106101a9576101a96118e6565b602002602001015160000151836101c09190611944565b925060010161018f565b5060006101d684610752565b905060006101e382610848565b90508781101561021f576040517f7e52ee5e00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b50835160005b818110156103d5576000868281518110610241576102416118e6565b602090810291909101810151604081015191810151805191935090600383600081518110610271576102716118e6565b602002602001015160000151600581111561028e5761028e61195c565b10156102bd576102bd8f836000815181106102ab576102ab6118e6565b602002602001015186600001516108d2565b60005b818110156103c55760008482815181106102dc576102dc6118e6565b60200260200101519050600160058111156102f9576102f961195c565b8151600581111561030c5761030c61195c565b0361033c5761033785858b8a81518110610328576103286118e6565b60200260200101518686610a15565b6103bc565b6002815160058111156103515761035161195c565b0361037c5761033785858b8a8151811061036d5761036d6118e6565b60200260200101518686610bc3565b6003815160058111156103915761039161195c565b036103bc576103bc85858b8a815181106103ad576103ad6118e6565b60200260200101518686610d2a565b506001016102c0565b5084600101945050505050610225565b506040517f70a0823100000000000000000000000000000000000000000000000000000000815230600482015260009073ffffffffffffffffffffffffffffffffffffffff8b16906370a0823190602401602060405180830381865afa158015610443573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610467919061198b565b90506104748a33836108d2565b5050505050505050505050565b600080828060200190518101906104989190611a63565b90506104ab6104a682610752565b610848565b9392505050565b6104ba610ef7565b6104c46000610f78565b565b6104ce610ef7565b8260005b818110156105f2578585828181106104ec576104ec6118e6565b9050602002016020810190610501919061162b565b73ffffffffffffffffffffffffffffffffffffffff1663095ea7b385858481811061052e5761052e6118e6565b9050602002016020810190610543919061162b565b6040517fffffffff0000000000000000000000000000000000000000000000000000000060e084901b16815273ffffffffffffffffffffffffffffffffffffffff90911660048201527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6024820152604401600060405180830381600087803b1580156105cf57600080fd5b505af11580156105e3573d6000803e3d6000fd5b505050508060010190506104d2565b505050505050565b610602610ef7565b73ffffffffffffffffffffffffffffffffffffffff811661064f576040517f9698cd7500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600180547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b61069e610ef7565b73ffffffffffffffffffffffffffffffffffffffff8116610746576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f646472657373000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b61074f81610f78565b50565b805160609060008167ffffffffffffffff811115610772576107726113f6565b6040519080825280602002602001820160405280156107a557816020015b60608152602001906001900390816107905790505b50905060005b828110156108405760006108178683815181106107ca576107ca6118e6565b6020026020010151600001518784815181106107e8576107e86118e6565b602002602001015160200151888581518110610806576108066118e6565b602002602001015160400151610fed565b90508083838151811061082c5761082c6118e6565b6020908102919091010152506001016107ab565b509392505050565b8051600090815b818110156108cb57600084828151811061086b5761086b6118e6565b6020026020010151519050848281518110610888576108886118e6565b602002602001015160018261089d9190611be3565b815181106108ad576108ad6118e6565b6020026020010151846108c09190611944565b93505060010161084f565b5050919050565b6040805173ffffffffffffffffffffffffffffffffffffffff8481166024830152604480830185905283518084039091018152606490920183526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb0000000000000000000000000000000000000000000000000000000017905291516000928392908716916109699190611bfa565b6000604051808303816000865af19150503d80600081146109a6576040519150601f19603f3d011682016040523d82523d6000602084013e6109ab565b606091505b50915091508115806109d75750805115806109d55750808060200190518101906109d59190611c35565b155b15610a0e576040517fe9e9cd1f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5050505050565b600080610a23836001611944565b9050600080888581518110610a3a57610a3a6118e6565b60200260200101516020015160ff16600014610a7157868381518110610a6257610a626118e6565b60200260200101516000610a8e565b6000878481518110610a8557610a856118e6565b60200260200101515b9150915085831015610af8576003898481518110610aae57610aae6118e6565b6020026020010151600001516005811115610acb57610acb61195c565b10610ad65730610af1565b878381518110610ae857610ae86118e6565b60200260200101515b9350610afc565b3093505b878581518110610b0e57610b0e6118e6565b60209081029190910101516040517f022c0d9f000000000000000000000000000000000000000000000000000000008152600481018490526024810183905273ffffffffffffffffffffffffffffffffffffffff868116604483015260806064830152600060848301529091169063022c0d9f9060a4015b600060405180830381600087803b158015610ba057600080fd5b505af1158015610bb4573d6000803e3d6000fd5b50505050505050505050505050565b600080610bd1836001611944565b9050600080888581518110610be857610be86118e6565b60200260200101516020015160ff16600014610c1f57868381518110610c1057610c106118e6565b60200260200101516000610c3c565b6000878481518110610c3357610c336118e6565b60200260200101515b9150915085831015610ca6576003898481518110610c5c57610c5c6118e6565b6020026020010151600001516005811115610c7957610c7961195c565b10610c845730610c9f565b878381518110610c9657610c966118e6565b60200260200101515b9350610caa565b3093505b878581518110610cbc57610cbc6118e6565b60209081029190910101516040517f6d9a640a000000000000000000000000000000000000000000000000000000008152600481018490526024810183905273ffffffffffffffffffffffffffffffffffffffff868116604483015290911690636d9a640a90606401610b86565b6000610d37826001611944565b90506000868381518110610d4d57610d4d6118e6565b602002602001015190506000868481518110610d6b57610d6b6118e6565b602002602001015173ffffffffffffffffffffffffffffffffffffffff16639169558683602001518460400151898881518110610daa57610daa6118e6565b60200260200101518a8881518110610dc457610dc46118e6565b60209081029190910101516040517fffffffff0000000000000000000000000000000000000000000000000000000060e087901b16815260ff9485166004820152939092166024840152604483015260648201527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff608482015260a4016020604051808303816000875af1158015610e60573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e84919061198b565b905084831015610eed576003888481518110610ea257610ea26118e6565b6020026020010151600001516005811115610ebf57610ebf61195c565b1015610eed57610eed8260600151888581518110610edf57610edf6118e6565b6020026020010151836108d2565b5050505050505050565b60005473ffffffffffffffffffffffffffffffffffffffff1633146104c4576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161073d565b6000805473ffffffffffffffffffffffffffffffffffffffff8381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b81516060906000610fff826001611944565b67ffffffffffffffff811115611017576110176113f6565b604051908082528060200260200182016040528015611040578160200160208202803683370190505b5090508581600081518110611057576110576118e6565b60209081029190910101528560005b8381101561119a576000868281518110611082576110826118e6565b602002602001015190506003600581111561109f5761109f61195c565b815160058111156110b2576110b261195c565b1015611118576110e88883815181106110cd576110cd6118e6565b602002602001015184836020015160ff1684608001516111a6565b925082846110f7846001611944565b81518110611107576111076118e6565b602002602001018181525050611191565b60038151600581111561112d5761112d61195c565b0361115f576110e8888381518110611147576111476118e6565b60200260200101518483602001518460400151611289565b6040517fed34f18e00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b50600101611066565b50909695505050505050565b60008060008673ffffffffffffffffffffffffffffffffffffffff16630902f1ac6040518163ffffffff1660e01b81526004016040805180830381865afa1580156111f5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112199190611c57565b915091506000808660001461122f578284611232565b83835b90925090506000611243878a611c7b565b905060006112518383611c7b565b905060008261126386620f4240611c7b565b61126d9190611944565b90506112798183611cb8565b9c9b505050505050505050505050565b6040517fa95b089f00000000000000000000000000000000000000000000000000000000815260ff8084166004830152821660248201526044810184905260009073ffffffffffffffffffffffffffffffffffffffff86169063a95b089f90606401602060405180830381865afa158015611308573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061132c919061198b565b95945050505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461074f57600080fd5b60008060008060006080868803121561136f57600080fd5b853561137a81611335565b9450602086013561138a81611335565b935060408601359250606086013567ffffffffffffffff808211156113ae57600080fd5b818801915088601f8301126113c257600080fd5b8135818111156113d157600080fd5b8960208285010111156113e357600080fd5b9699959850939650602001949392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60405160a0810167ffffffffffffffff81118282101715611448576114486113f6565b60405290565b6040516060810167ffffffffffffffff81118282101715611448576114486113f6565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff811182821017156114b8576114b86113f6565b604052919050565b600060208083850312156114d357600080fd5b823567ffffffffffffffff808211156114eb57600080fd5b818501915085601f8301126114ff57600080fd5b813581811115611511576115116113f6565b611541847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f84011601611471565b9150808252868482850101111561155757600080fd5b8084840185840137600090820190930192909252509392505050565b60008083601f84011261158557600080fd5b50813567ffffffffffffffff81111561159d57600080fd5b6020830191508360208260051b85010111156115b857600080fd5b9250929050565b600080600080604085870312156115d557600080fd5b843567ffffffffffffffff808211156115ed57600080fd5b6115f988838901611573565b9096509450602087013591508082111561161257600080fd5b5061161f87828801611573565b95989497509550505050565b60006020828403121561163d57600080fd5b81356104ab81611335565b600067ffffffffffffffff821115611662576116626113f6565b5060051b60200190565b6006811061074f57600080fd5b60ff8116811461074f57600080fd5b600082601f83011261169957600080fd5b813560206116ae6116a983611648565b611471565b82815260a092830285018201928282019190878511156116cd57600080fd5b8387015b8581101561174c5781818a0312156116e95760008081fd5b6116f1611425565b81356116fc8161166c565b81528186013561170b81611679565b8187015260408281013561171e81611679565b9082015260608281013561173181611335565b908201526080828101359082015284529284019281016116d1565b5090979650505050505050565b6000602080838503121561176c57600080fd5b823567ffffffffffffffff8082111561178457600080fd5b818501915085601f83011261179857600080fd5b81356117a66116a982611648565b81815260059190911b830184019084810190888311156117c557600080fd5b8585015b838110156118d9578035858111156117e057600080fd5b86016060818c037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe001121561181457600080fd5b61181c61144e565b88820135815260408201358781111561183457600080fd5b8201603f81018d1361184557600080fd5b898101356118556116a982611648565b81815260059190911b8201604001908b8101908f83111561187557600080fd5b6040840193505b8284101561189e57833561188f81611335565b8252928c0192908c019061187c565b848d01525050506060820135878111156118b757600080fd5b6118c58d8b83860101611688565b6040830152508452509186019186016117c9565b5098975050505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000821982111561195757611957611915565b500190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b60006020828403121561199d57600080fd5b5051919050565b600082601f8301126119b557600080fd5b815160206119c56116a983611648565b82815260a092830285018201928282019190878511156119e457600080fd5b8387015b8581101561174c5781818a031215611a005760008081fd5b611a08611425565b8151611a138161166c565b815281860151611a2281611679565b81870152604082810151611a3581611679565b90820152606082810151611a4881611335565b908201526080828101519082015284529284019281016119e8565b60006020808385031215611a7657600080fd5b825167ffffffffffffffff80821115611a8e57600080fd5b818501915085601f830112611aa257600080fd5b8151611ab06116a982611648565b81815260059190911b83018401908481019088831115611acf57600080fd5b8585015b838110156118d957805185811115611aea57600080fd5b86016060818c037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0011215611b1e57600080fd5b611b2661144e565b888201518152604082015187811115611b3e57600080fd5b8201603f81018d13611b4f57600080fd5b89810151611b5f6116a982611648565b81815260059190911b8201604001908b8101908f831115611b7f57600080fd5b6040840193505b82841015611ba8578351611b9981611335565b8252928c0192908c0190611b86565b848d0152505050606082015187811115611bc157600080fd5b611bcf8d8b838601016119a4565b604083015250845250918601918601611ad3565b600082821015611bf557611bf5611915565b500390565b6000825160005b81811015611c1b5760208186018101518583015201611c01565b81811115611c2a576000828501525b509190910192915050565b600060208284031215611c4757600080fd5b815180151581146104ab57600080fd5b60008060408385031215611c6a57600080fd5b505080516020909101519092909150565b6000817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0483118215151615611cb357611cb3611915565b500290565b600082611cee577f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b50049056fea2646970667358221220594172f999056de2fc9e8422f6bf848678f8445d4fd325e49e18f7ec9688039164736f6c634300080f0033"
};