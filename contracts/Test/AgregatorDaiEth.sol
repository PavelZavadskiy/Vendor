// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

contract AgregatorDaiEth {
    uint8 _decimals = 18;
    uint80 _roundId = 36893488147419103277;
    int256 _answer = 214713221102546;                                          
    uint256 _startedAt = 1638387009;
    uint256 _updatedAt = 1638387009;
    uint80 _answeredInRound = 36893488147419103277;
    
    function decimals() external view returns (uint8) {
        return _decimals;
    }
    
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        roundId = _roundId;
        answer = _answer;
        startedAt = _startedAt;
        updatedAt = _updatedAt;
        answeredInRound = _answeredInRound;
    }

}