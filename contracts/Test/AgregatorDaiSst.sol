// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

contract AgregatorDaiSst {
    uint8 _decimals = 8;
    uint80 _roundId = 55340232221128654861;
    int256 _answer = 100081675;                                          
    uint256 _startedAt = 1638990587;
    uint256 _updatedAt = 1638990587;
    uint80 _answeredInRound = 55340232221128654861;
    
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