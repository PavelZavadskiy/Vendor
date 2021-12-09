pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Test721 is Ownable, ERC721("ERC721", "T721") {
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}