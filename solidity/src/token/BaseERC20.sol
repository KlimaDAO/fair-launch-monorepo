// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BaseERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_) ERC20(name_, symbol_) { 
        _mint(msg.sender, initialSupply_); 
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}