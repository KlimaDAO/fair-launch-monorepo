'use server';

//  /// @notice Calculates the amount of tokens to burn when unstaking
//     /// @param amount Amount of tokens being unstaked
//     /// @param stakeStartTime Timestamp when the stake was created
//     /// @return Amount of tokens to burn
//     /// @dev Base burn is 25%, additional burn up to 75% based on stake duration
//     function calculateBurn(uint256 amount, uint256 stakeStartTime) public view returns (uint256) {
//       // Base burn is 25% of amount
//       uint256 baseBurn = (amount * 25) / 100;

//       // Calculate time-based burn percentage (capped at 75%)
//       uint256 daysStaked = (block.timestamp - stakeStartTime) / 1 days;
//       uint256 timeBasedBurnPercent = (daysStaked * 75) / 365;
//       if (timeBasedBurnPercent > 75) timeBasedBurnPercent = 75;

//       // Calculate time-based burn amount
//       uint256 timeBasedBurn = (amount * timeBasedBurnPercent) / 100;

//       // Return total burn
//       return baseBurn + timeBasedBurn;
//   }

export const calculateBurnAllocations = async () => {
  // fetch all users from the subgraph...
  // fetch the current burn ratio from the contract...
  // fetch the current block timestamp
  // https://github.com/wevm/wagmi/discussions/2068

  // TODO - implement logic...
  return [];
};