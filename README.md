# GovernX — Decentralized Governance Platform

> **Alchemy University EVM Chain Certification Final Project**

GovernX is a transparent, fully on-chain governance platform where members create proposals, vote on the blockchain, and automatically execute approved decisions — all powered by Solidity and the EVM.

---

## Problem

Centralized governance systems suffer from opacity, corruption, and single points of failure. DAOs and Web3 organizations need a simple, trustless voting mechanism where:
- Proposals are created transparently
- Votes are immutable and publicly verifiable
- Execution happens automatically when consensus is reached — no trusted intermediary required

## Solution

GovernX is a minimal but complete governance system deployed on Sepolia:
- **On-chain voting** — every vote is a real blockchain transaction
- **10-vote threshold** — proposals auto-execute when 10 YES votes are reached
- **No manual execution** — the smart contract handles execution atomically
- **Full stack** — React frontend + Solidity contracts + viem

---

## Features

- ✅ Connect MetaMask wallet
- ✅ Membership check on-chain
- ✅ Create governance proposals
- ✅ Vote YES / NO
- ✅ Change vote (as long as proposal is active)
- ✅ Real-time voting progress bar
- ✅ Automatic proposal execution at 10 YES votes
- ✅ DemoTarget contract for certification demo
- ✅ Calldata generator / encoder
- ✅ Transaction lifecycle UI (confirm → pending → confirmed)
- ✅ Sepolia Etherscan links for all transactions
- ✅ Wrong network detection + auto-switch
- ✅ Responsive design (desktop + mobile)
- ✅ Toast notifications

---

## Architecture

```
governx/
├── contracts/
│   ├── Voting.sol        # Main governance contract
│   └── DemoTarget.sol    # Demo contract for certification
├── scripts/
│   └── deploy.ts         # Hardhat deploy script
├── test/
│   └── Voting.test.ts    # Comprehensive test suite
├── frontend/
│   └── src/
│       ├── abi/          # Contract ABIs
│       ├── components/   # Navbar, ProposalCard, VotingProgress, TxStatusBadge
│       ├── config/       # Chain + contract configuration
│       ├── hooks/        # useWallet, useProposals, useTx
│       ├── pages/        # Landing, Dashboard, Proposals, Create, Detail, Demo
│       ├── services/     # wallet.ts, contract.ts (viem)
│       └── types/        # TypeScript interfaces
├── hardhat.config.ts
├── package.json
└── .env.example
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity ^0.8.24, Hardhat |
| Blockchain | Sepolia Testnet (EVM) |
| Frontend | React 18, TypeScript, Vite |
| Blockchain interaction | viem |
| Styling | Tailwind CSS |
| Wallet | MetaMask |
| Notifications | react-hot-toast |

---

## Smart Contract Explanation

### Voting.sol

```solidity
struct Proposal {
  address target;   // Contract to call when executed
  bytes data;       // Encoded calldata
  uint yesCount;
  uint noCount;
  bool executed;
}
```

**Key behaviors:**
- Only `members` can create proposals or vote
- `castVote(id, bool)` handles both first-time votes AND vote changes
- When `yesCount >= 10` and not yet executed: the contract calls `proposal.target.call(proposal.data)` atomically
- `executed` flag is set **before** the external call to prevent re-entrance

**Events:**
- `ProposalCreated(uint indexed proposalId, address indexed proposer, address target)`
- `VoteCast(uint indexed proposalId, address indexed voter, bool support)`
- `ProposalExecuted(uint indexed proposalId, bool success)`

### DemoTarget.sol

Simple target contract used for the certification demo.

```solidity
function updateValue(uint256 newValue) external
function updateMessage(string calldata newMessage) external
```

After 10 YES votes, GovernX calls `updateValue(42)` on DemoTarget and the `storedValue` changes on-chain.

---

## How Voting Works

1. A member calls `newProposal(target, calldata)` → proposal is stored
2. Members call `castVote(proposalId, true/false)` → YES/NO is recorded
3. If a member already voted, they can switch sides (counts adjust accordingly)
4. Once `yesCount >= 10`: execution is triggered atomically in the same `castVote` transaction
5. `executed = true` is set **before** the external call (re-entrance protection)
6. `ProposalExecuted(id, success)` is emitted whether or not the call succeeded

---

## Installation

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Sepolia ETH (from a faucet)

### Clone and install

```bash
# Install root (Hardhat) dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

---

## Environment Variables

**Root `.env`** (for contract deployment):
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

**Frontend `frontend/.env`** (after deployment):
```env
VITE_CONTRACT_ADDRESS=0xYOUR_VOTING_CONTRACT_ADDRESS
VITE_DEMO_TARGET_ADDRESS=0xYOUR_DEMO_TARGET_ADDRESS
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_EXPLORER_URL=https://sepolia.etherscan.io
```

> ⚠️ **Never commit `.env` files**. Only commit `.env.example`.

---

## Local Development

```bash
# Terminal 1: Start local Hardhat node
npm run node

# Terminal 2: Deploy to local node
npm run deploy:local

# Terminal 3: Start frontend (set VITE_CONTRACT_ADDRESS in frontend/.env first)
npm run frontend
```

---

## Testing

```bash
npm test
```

The test suite covers:
- Deployment and membership
- Proposal creation (member vs. non-member)
- YES/NO voting
- Vote changes
- Execution at exactly 10 YES votes
- No double execution
- DemoTarget state changes
- All three events

---

## Deployment to Sepolia

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   DEPLOYER_PRIVATE_KEY=0xYOUR_KEY
   ```

3. Deploy:
   ```bash
   npm run deploy:sepolia
   ```

4. Copy the output addresses to `frontend/.env`:
   ```env
   VITE_CONTRACT_ADDRESS=0x...
   VITE_DEMO_TARGET_ADDRESS=0x...
   ```

5. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

---

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| Voting (GovernX) | _Add after deployment_ |
| DemoTarget | _Add after deployment_ |

---

## Certification Demo Flow

1. **Connect wallet** to Sepolia in MetaMask
2. **Confirm** your wallet is shown as `✓ Member`
3. **Go to Demo Target** page → click "Generate" with value `42` → copy calldata
4. **Create Proposal** → paste DemoTarget address and calldata → submit → confirm in MetaMask
5. **Vote YES** from 10 different member accounts on the proposal
6. **Watch progress bar** fill up from 0→10
7. **On the 10th vote**, the proposal auto-executes in the same transaction
8. **Go to Demo Target** page → `storedValue` now reads `42`
9. **Show the Etherscan link** — the tx hash proves on-chain execution

---

## Future Improvements

- [ ] Quorum percentage voting (not just yes count)
- [ ] Proposal descriptions stored on IPFS
- [ ] Time-locked proposals (voting period)
- [ ] Member management (add/remove members via governance)
- [ ] Delegation support
- [ ] Multi-chain support
- [ ] Snapshot.js integration

---

## Certification

This project was built as the final certification project for:

**Alchemy University — EVM Chain Certification**

It demonstrates:
- Solidity smart contract development
- Contract deployment to Sepolia testnet
- Events and access control
- Encoded calldata and low-level contract calls
- Frontend Web3 integration with viem
- MetaMask wallet connection
- Contract reads and writes
- Real on-chain state as source of truth

---

*Built with ❤️ for the Alchemy University community.*
