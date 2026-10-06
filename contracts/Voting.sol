// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title GovernX Voting Contract
 * @notice Decentralized governance where members create proposals, vote on-chain,
 *         and proposals auto-execute after reaching 10 YES votes.
 * @dev Improvements over the base spec:
 *      - Added ProposalExecuted event for frontend integration.
 *      - Added getProposalCount() helper.
 *      - Added getUserVote() helper returning (hasVoted, support).
 *      - Added explicit ExecutionFailed event on failed calls (no hard revert on failure
 *        so the vote state is preserved; execution result is logged).
 *      - Re-entrance guard on execute path via `executed` flag set before external call.
 */
contract Voting {
    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Proposal {
        address target;   // Contract/address to call when executed
        bytes data;       // Encoded calldata for the call
        uint256 yesCount;
        uint256 noCount;
        bool executed;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    Proposal[] public proposals;

    /// @notice proposalId => voter => their vote (true = YES, false = NO)
    mapping(uint256 => mapping(address => bool)) public votes;

    /// @notice proposalId => voter => whether they have cast a vote
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Whether an address is a governance member
    mapping(address => bool) public members;

    /// @notice Votes needed to auto-execute a proposal
    uint256 public constant EXECUTION_THRESHOLD = 10;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address target);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId, bool success);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _members Initial list of member addresses (deployer is always added).
     */
    constructor(address[] memory _members) {
        members[msg.sender] = true;
        for (uint256 i = 0; i < _members.length; i++) {
            members[_members[i]] = true;
        }
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyMember() {
        require(members[msg.sender], "GovernX: caller is not a member");
        _;
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @notice Create a new governance proposal.
     * @param target Contract address to call if the proposal passes.
     * @param data   ABI-encoded function call data.
     */
    function newProposal(address target, bytes calldata data) external onlyMember {
        require(target != address(0), "GovernX: target is zero address");

        uint256 proposalId = proposals.length;
        proposals.push(
            Proposal({
                target: target,
                data: data,
                yesCount: 0,
                noCount: 0,
                executed: false
            })
        );

        emit ProposalCreated(proposalId, msg.sender, target);
    }

    /**
     * @notice Cast or change a vote on a proposal.
     * @param proposalId Index of the proposal in the proposals array.
     * @param support    True = YES, False = NO.
     */
    function castVote(uint256 proposalId, bool support) external onlyMember {
        require(proposalId < proposals.length, "GovernX: invalid proposal id");

        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "GovernX: proposal already executed");

        if (hasVoted[proposalId][msg.sender]) {
            // Vote change — only update if switching sides
            bool previousVote = votes[proposalId][msg.sender];
            if (previousVote != support) {
                if (support) {
                    proposal.noCount--;
                    proposal.yesCount++;
                } else {
                    proposal.yesCount--;
                    proposal.noCount++;
                }
                votes[proposalId][msg.sender] = support;
                emit VoteCast(proposalId, msg.sender, support);
            }
            // If same vote — silently ignore (no state change, no event)
        } else {
            // First-time vote
            if (support) {
                proposal.yesCount++;
            } else {
                proposal.noCount++;
            }
            hasVoted[proposalId][msg.sender] = true;
            votes[proposalId][msg.sender] = support;
            emit VoteCast(proposalId, msg.sender, support);
        }

        // Auto-execute when threshold reached (and not yet executed)
        if (proposal.yesCount >= EXECUTION_THRESHOLD && !proposal.executed) {
            proposal.executed = true; // Set before call to prevent re-entrance
            (bool success, ) = proposal.target.call(proposal.data);
            emit ProposalExecuted(proposalId, success);
            // We emit result but do NOT revert on failure so vote state is preserved.
            // Callers can inspect the ProposalExecuted event for the success flag.
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Returns the total number of proposals.
     */
    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @notice Returns a voter's status on a proposal.
     * @return voted   Whether the address has cast a vote.
     * @return support The vote they cast (meaningless if voted == false).
     */
    function getUserVote(
        uint256 proposalId,
        address voter
    ) external view returns (bool voted, bool support) {
        voted = hasVoted[proposalId][voter];
        support = votes[proposalId][voter];
    }

    /**
     * @notice Fetch a proposal by ID (convenience for structs).
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address target,
            bytes memory data,
            uint256 yesCount,
            uint256 noCount,
            bool executed
        )
    {
        require(proposalId < proposals.length, "GovernX: invalid proposal id");
        Proposal storage p = proposals[proposalId];
        return (p.target, p.data, p.yesCount, p.noCount, p.executed);
    }
}
