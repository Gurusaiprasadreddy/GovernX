import { expect } from "chai";
import { ethers } from "hardhat";
import { Voting, DemoTarget } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ContractTransactionReceipt } from "ethers";

describe("GovernX — Voting Contract", function () {
  let voting: Voting;
  let demoTarget: DemoTarget;
  let deployer: SignerWithAddress;
  let member1: SignerWithAddress;
  let member2: SignerWithAddress;
  let nonMember: SignerWithAddress;
  let signers: SignerWithAddress[];

  // Helper to encode DemoTarget.updateValue(uint256)
  const encodeUpdateValue = (value: number) =>
    demoTarget.interface.encodeFunctionData("updateValue", [value]);

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [deployer, member1, member2, nonMember] = signers;

    // Deploy DemoTarget
    const DemoTargetFactory = await ethers.getContractFactory("DemoTarget");
    demoTarget = await DemoTargetFactory.deploy() as DemoTarget;
    await demoTarget.waitForDeployment();

    // Deploy Voting with member1 and member2 as initial members
    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy([
      member1.address,
      member2.address,
    ]) as Voting;
    await voting.waitForDeployment();
  });

  // ── Deployment & Membership ────────────────────────────────────────────────

  describe("Deployment", function () {
    it("deployer is a member", async function () {
      expect(await voting.members(deployer.address)).to.be.true;
    });

    it("constructor members are members", async function () {
      expect(await voting.members(member1.address)).to.be.true;
      expect(await voting.members(member2.address)).to.be.true;
    });

    it("non-member is not a member", async function () {
      expect(await voting.members(nonMember.address)).to.be.false;
    });

    it("EXECUTION_THRESHOLD is 10", async function () {
      expect(await voting.EXECUTION_THRESHOLD()).to.equal(10);
    });

    it("starts with zero proposals", async function () {
      expect(await voting.getProposalCount()).to.equal(0);
    });
  });

  // ── Proposal Creation ─────────────────────────────────────────────────────

  describe("newProposal", function () {
    it("member can create a proposal", async function () {
      const data = encodeUpdateValue(42);
      await expect(
        voting.connect(deployer).newProposal(await demoTarget.getAddress(), data)
      ).to.not.be.reverted;
      expect(await voting.getProposalCount()).to.equal(1);
    });

    it("non-member cannot create a proposal", async function () {
      const data = encodeUpdateValue(42);
      await expect(
        voting.connect(nonMember).newProposal(await demoTarget.getAddress(), data)
      ).to.be.revertedWith("GovernX: caller is not a member");
    });

    it("reverts if target is zero address", async function () {
      await expect(
        voting.connect(deployer).newProposal(ethers.ZeroAddress, "0x")
      ).to.be.revertedWith("GovernX: target is zero address");
    });

    it("emits ProposalCreated event", async function () {
      const data = encodeUpdateValue(42);
      const demoAddr = await demoTarget.getAddress();
      await expect(
        voting.connect(deployer).newProposal(demoAddr, data)
      )
        .to.emit(voting, "ProposalCreated")
        .withArgs(0, deployer.address, demoAddr);
    });

    it("multiple members can each create proposals", async function () {
      const data = encodeUpdateValue(1);
      const demoAddr = await demoTarget.getAddress();
      await voting.connect(deployer).newProposal(demoAddr, data);
      await voting.connect(member1).newProposal(demoAddr, data);
      expect(await voting.getProposalCount()).to.equal(2);
    });
  });

  // ── Voting ─────────────────────────────────────────────────────────────────

  describe("castVote — basic", function () {
    beforeEach(async function () {
      const data = encodeUpdateValue(42);
      await voting
        .connect(deployer)
        .newProposal(await demoTarget.getAddress(), data);
    });

    it("non-member cannot vote", async function () {
      await expect(
        voting.connect(nonMember).castVote(0, true)
      ).to.be.revertedWith("GovernX: caller is not a member");
    });

    it("member can vote YES", async function () {
      await voting.connect(deployer).castVote(0, true);
      const [, , yes, ,] = await voting.getProposal(0);
      expect(yes).to.equal(1);
    });

    it("member can vote NO", async function () {
      await voting.connect(deployer).castVote(0, false);
      const [, , , no,] = await voting.getProposal(0);
      expect(no).to.equal(1);
    });

    it("emits VoteCast event", async function () {
      await expect(voting.connect(deployer).castVote(0, true))
        .to.emit(voting, "VoteCast")
        .withArgs(0, deployer.address, true);
    });

    it("reverts on invalid proposal id", async function () {
      await expect(
        voting.connect(deployer).castVote(99, true)
      ).to.be.revertedWith("GovernX: invalid proposal id");
    });

    it("hasVoted is set after voting", async function () {
      await voting.connect(deployer).castVote(0, true);
      expect(await voting.hasVoted(0, deployer.address)).to.be.true;
    });

    it("getUserVote returns correct data", async function () {
      await voting.connect(deployer).castVote(0, true);
      const [voted, support] = await voting.getUserVote(0, deployer.address);
      expect(voted).to.be.true;
      expect(support).to.be.true;
    });
  });

  // ── Vote Changes ───────────────────────────────────────────────────────────

  describe("castVote — vote changes", function () {
    beforeEach(async function () {
      const data = encodeUpdateValue(42);
      await voting
        .connect(deployer)
        .newProposal(await demoTarget.getAddress(), data);
    });

    it("member can change vote from YES to NO", async function () {
      await voting.connect(deployer).castVote(0, true);
      await voting.connect(deployer).castVote(0, false);
      const [, , yes, no,] = await voting.getProposal(0);
      expect(yes).to.equal(0);
      expect(no).to.equal(1);
    });

    it("member can change vote from NO to YES", async function () {
      await voting.connect(deployer).castVote(0, false);
      await voting.connect(deployer).castVote(0, true);
      const [, , yes, no,] = await voting.getProposal(0);
      expect(yes).to.equal(1);
      expect(no).to.equal(0);
    });

    it("casting same vote twice does not change counts", async function () {
      await voting.connect(deployer).castVote(0, true);
      await voting.connect(deployer).castVote(0, true); // same vote
      const [, , yes, no,] = await voting.getProposal(0);
      expect(yes).to.equal(1);
      expect(no).to.equal(0);
    });

    it("vote counts stay correct across multiple voters", async function () {
      await voting.connect(deployer).castVote(0, true);
      await voting.connect(member1).castVote(0, false);
      await voting.connect(member2).castVote(0, true);
      const [, , yes, no,] = await voting.getProposal(0);
      expect(yes).to.equal(2);
      expect(no).to.equal(1);
    });
  });

  // ── Execution at Threshold ─────────────────────────────────────────────────

  describe("Execution at 10 YES votes", function () {
    let tenMembers: SignerWithAddress[];

    beforeEach(async function () {
      // signers[0..9] = 10 members (deployer + 9 more)
      tenMembers = signers.slice(0, 10);
      const extra = tenMembers.slice(1).map((s) => s.address);

      const VotingFactory = await ethers.getContractFactory("Voting");
      voting = (await VotingFactory.deploy(extra)) as Voting;
      await voting.waitForDeployment();

      const data = encodeUpdateValue(99);
      await voting
        .connect(deployer)
        .newProposal(await demoTarget.getAddress(), data);
    });

    it("proposal does NOT execute before 10 YES votes", async function () {
      for (let i = 0; i < 9; i++) {
        await voting.connect(tenMembers[i]).castVote(0, true);
      }
      const [, , , , executed] = await voting.getProposal(0);
      expect(executed).to.be.false;
      expect(await demoTarget.storedValue()).to.equal(0);
    });

    it("proposal executes automatically at 10 YES votes", async function () {
      for (let i = 0; i < 10; i++) {
        await voting.connect(tenMembers[i]).castVote(0, true);
      }
      const [, , , , executed] = await voting.getProposal(0);
      expect(executed).to.be.true;
      expect(await demoTarget.storedValue()).to.equal(99);
    });

    it("emits ProposalExecuted event on execution", async function () {
      for (let i = 0; i < 9; i++) {
        await voting.connect(tenMembers[i]).castVote(0, true);
      }
      await expect(voting.connect(tenMembers[9]).castVote(0, true))
        .to.emit(voting, "ProposalExecuted")
        .withArgs(0, true);
    });

    it("cannot execute an already executed proposal", async function () {
      for (let i = 0; i < 10; i++) {
        await voting.connect(tenMembers[i]).castVote(0, true);
      }
      // Change vote to trigger another execution attempt
      await expect(
        voting.connect(tenMembers[0]).castVote(0, false)
      ).to.be.revertedWith("GovernX: proposal already executed");
    });

    it("DemoTarget state changes after execution", async function () {
      for (let i = 0; i < 10; i++) {
        await voting.connect(tenMembers[i]).castVote(0, true);
      }
      expect(await demoTarget.storedValue()).to.equal(99);
      expect(await demoTarget.updateCount()).to.equal(1);
    });

    it("NO votes do not trigger execution", async function () {
      for (let i = 0; i < 10; i++) {
        await voting.connect(tenMembers[i]).castVote(0, false);
      }
      const [, , , , executed] = await voting.getProposal(0);
      expect(executed).to.be.false;
    });
  });

  // ── DemoTarget ─────────────────────────────────────────────────────────────

  describe("DemoTarget", function () {
    it("initial value is 0", async function () {
      expect(await demoTarget.storedValue()).to.equal(0);
    });

    it("updateValue changes storedValue", async function () {
      await demoTarget.updateValue(123);
      expect(await demoTarget.storedValue()).to.equal(123);
    });

    it("updateMessage changes message", async function () {
      await demoTarget.updateMessage("Hello GovernX");
      expect(await demoTarget.message()).to.equal("Hello GovernX");
    });

    it("emits ValueUpdated event", async function () {
      await expect(demoTarget.updateValue(7))
        .to.emit(demoTarget, "ValueUpdated")
        .withArgs(7, deployer.address);
    });
  });
});
