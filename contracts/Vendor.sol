// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface I_Agregator{
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface I_ERC721{
    function balanceOf(address owner) external view returns (uint256);
}

contract Vendor is Ownable{
    using SafeERC20 for IERC20;

    address private token;
    address private agregatorEth;
    address private tokenERC721;
    mapping (address => address) private approvedTokens;

    event BuyToken(address indexed _from, address indexed _to, uint256 _amount);

    constructor(address _token, address _agregator, address _tokenERC721){
        token = _token;
        agregatorEth = _agregator;
        tokenERC721 = _tokenERC721;
    }

    function setApprovedToken(address _token, address _agregator) external onlyOwner{
        require(_token != address(0) && _agregator != address(0), "Wrong input values!");
        require(approvedTokens[_token] == address(0), "Token already exists!");

        approvedTokens[_token] = _agregator;
    }

    function removeApprovedToken(address _token) external onlyOwner{
        require(_token != address(0), "Wrong input value!");
        require(approvedTokens[_token] != address(0), "Token isn't exists!");

        delete approvedTokens[_token];
    }

    function buyToken(address _token, uint256 _amount) external payable{
        bytes memory _resp_string;
        bool result = true;
        uint256 fullAmount = 0;
        do{
            if(I_ERC721(tokenERC721).balanceOf(msg.sender) == 0){
                _resp_string = "You can't buy token! You have not ERC721 token!";
                result = false;
                break;
            }
            if(msg.value == 0 && (_amount == 0 || _token == address(0))){
                _resp_string = "Wrong input values!";
                result = false;
                break;
            }

            if(msg.value > 0){
                if(msg.sender.balance < msg.value){
                    _resp_string = "You do not have enough ether in your balance!";
                    result = false;
                    break;
                }
                ( , int256 _priceSst, , , ) = I_Agregator(agregatorEth).latestRoundData();
                uint256 _decimalsSst = uint256(I_Agregator(agregatorEth).decimals());
                fullAmount += (msg.value * uint256(_priceSst)) / 10**_decimalsSst;
            }

            if(_amount != 0 && _token != address(0)){
                address _agregatorToken = approvedTokens[_token];
                if(_agregatorToken == address(0)){
                    _resp_string = "This token wasn't approved!";
                    result = false;
                    break;
                }
                if(IERC20(_token).balanceOf(msg.sender) < _amount){
                    _resp_string = "You do not have enough token in your balance!";
                    result = false;
                    break;
                }
                if(IERC20(_token).allowance(msg.sender, address(this)) < _amount){
                    _resp_string = "You have not approved enough tokens!";
                    result = false;
                    break;
                }
                ( , int256 _priceSst, , , ) = I_Agregator(_agregatorToken).latestRoundData();
                uint256 _decimalsSst = uint256(I_Agregator(_agregatorToken).decimals());
                fullAmount += (msg.value * uint256(_priceSst)) / 10**_decimalsSst;
            }

            if(fullAmount == 0){
                _resp_string = "Your total amount of token is zerro!";
                result = false;
                break;
            }

            if(fullAmount > IERC20(token).balanceOf(address(this))){
                _resp_string = "Sorry, there is not enough tokens to buy!";
                result = false;
                break;
            }
        }while(false);

        if(result == false){
            bool sent;
            if(msg.value > 0){
                (sent, ) = msg.sender.call{value: msg.value}(_resp_string);
            } else {
                (sent, ) = msg.sender.call(_resp_string);
            }
            require(sent, "Error calling the fallback function!");        
            return;
        }

        if(_amount > 0) {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        IERC20(token).safeTransfer(msg.sender, fullAmount);

        emit BuyToken(address(this), msg.sender, fullAmount);
    } 
}