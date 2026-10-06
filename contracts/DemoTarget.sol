// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DemoTarget
 * @notice A simple demo contract that can be controlled by the GovernX governance.
 *         Use this to demonstrate the 10-vote execution flow during your certification.
 *
 * Demo flow:
 *   1. Create a proposal targeting this contract's address.
 *   2. Set calldata = abi.encodeWithSignature("updateValue(uint256)", 42)
 *   3. Gather 10 YES votes.
 *   4. GovernX automatically calls updateValue(42) on this contract.
 *   5. Read `storedValue` to confirm the state change.
 */
contract DemoTarget {
    uint256 public storedValue;
    string public message;
    address public lastCaller;
    uint256 public updateCount;

    event ValueUpdated(uint256 newValue, address caller);
    event MessageUpdated(string newMessage, address caller);

    /**
     * @notice Update the stored numeric value.
     *         Intended to be called via GovernX proposal execution.
     */
    function updateValue(uint256 newValue) external {
        storedValue = newValue;
        lastCaller = msg.sender;
        updateCount++;
        emit ValueUpdated(newValue, msg.sender);
    }

    /**
     * @notice Update the stored message string.
     */
    function updateMessage(string calldata newMessage) external {
        message = newMessage;
        lastCaller = msg.sender;
        updateCount++;
        emit MessageUpdated(newMessage, msg.sender);
    }

    /**
     * @notice Returns all state for easy frontend display.
     */
    function getState()
        external
        view
        returns (
            uint256 value,
            string memory msg_,
            address caller,
            uint256 count
        )
    {
        return (storedValue, message, lastCaller, updateCount);
    }
}
