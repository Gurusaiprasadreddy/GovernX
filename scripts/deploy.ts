import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("\n❌ No deployer account found!");
    console.error("Please create a .env file in the project root with your private key:");
    console.error("  DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere");
    console.error("  SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YourApiKey (optional, defaults to public RPC)\n");
    process.exit(1);
  }
  const [deployer] = signers;
  console.log("Deploying contracts with:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ── Deploy DemoTarget ──────────────────────────────────────────────────────
  console.log("\n[1/2] Deploying DemoTarget...");
  const DemoTarget = await ethers.getContractFactory("DemoTarget");
  const demoTarget = await DemoTarget.deploy();
  await demoTarget.waitForDeployment();
  const demoTargetAddress = await demoTarget.getAddress();
  console.log("DemoTarget deployed to:", demoTargetAddress);

  // ── Deploy Voting ──────────────────────────────────────────────────────────
  console.log("\n[2/2] Deploying Voting (GovernX)...");
  // Pass empty array — only deployer becomes a member by default.
  // Add addresses here to include extra initial members.
  const initialMembers: string[] = [];

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(initialMembers);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("Voting deployed to:", votingAddress);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("Deployment complete!");
  console.log("════════════════════════════════════════");
  console.log("Network:             ", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:            ", deployer.address);
  console.log("Voting contract:     ", votingAddress);
  console.log("DemoTarget contract: ", demoTargetAddress);
  console.log("\nAdd to your frontend/.env:");
  console.log(`VITE_CONTRACT_ADDRESS=${votingAddress}`);
  console.log(`VITE_DEMO_TARGET_ADDRESS=${demoTargetAddress}`);
  console.log(`VITE_CHAIN_ID=11155111`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
