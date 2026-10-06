import { Link } from "react-router-dom";

interface LandingPageProps {
  onConnect: () => void;
  connected: boolean;
}

const steps = [
  {
    icon: "📋",
    title: "Create Proposal",
    desc: "Members submit a proposal with a target contract and calldata.",
  },
  {
    icon: "🗳",
    title: "On-Chain Voting",
    desc: "Members vote YES or NO. Votes are recorded directly on the EVM.",
  },
  {
    icon: "⚡",
    title: "10 YES Votes",
    desc: "The governance threshold is reached. Execution is triggered automatically.",
  },
  {
    icon: "✅",
    title: "Auto-Execution",
    desc: "The target contract is called with the encoded calldata. State changes on-chain.",
  },
];

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "On-Chain Voting",
    desc: "Every vote is a real blockchain transaction. Transparent and immutable.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Full Transparency",
    desc: "All proposals, votes, and executions are publicly verifiable on Sepolia.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Automatic Execution",
    desc: "Proposals auto-execute when 10 YES votes are reached — no manual trigger needed.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "EVM-Powered",
    desc: "Built on Solidity with encoded calldata — interact with any contract on-chain.",
  },
];

export function LandingPage({ onConnect, connected }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[600px] h-[600px] rounded-full
            bg-gradient-radial from-brand-600/20 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Deployed on Sepolia Testnet
          </div>

          {/* Heading */}
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight mb-6">
            <span className="gradient-text">GOVERN</span>
            <span className="text-white">X</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-400 font-light mb-4">
            Decentralized decisions.{" "}
            <span className="text-brand-300 font-medium">Executed on-chain.</span>
          </p>
          <p className="max-w-2xl mx-auto text-slate-500 text-base leading-relaxed mb-12">
            A transparent governance platform where members create proposals, vote on the
            blockchain, and automatically execute approved decisions — all powered by Solidity
            and the EVM.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-primary px-8 py-3 text-base">
              Launch Governance
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            {!connected && (
              <button onClick={onConnect} className="btn-secondary px-8 py-3 text-base">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Flow steps */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-center section-label mb-12">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="glass-card p-6 h-full">
                <div className="text-3xl mb-4">{step.icon}</div>
                <div className="section-label mb-1">{`0${i + 1}`}</div>
                <h3 className="font-semibold text-slate-200 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10
                  w-4 h-4 items-center justify-center text-slate-600">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-center section-label mb-3">Features</p>
        <h2 className="text-center text-3xl font-bold text-white mb-12">
          Governance built for the EVM
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card p-6 flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/15
                border border-brand-500/20 flex items-center justify-center text-brand-400">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="glass-card gradient-border p-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to govern?
          </h2>
          <p className="text-slate-400 mb-8">
            Connect your MetaMask wallet to Sepolia and start participating in
            decentralized governance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="btn-primary px-8 py-3 text-base">
              Open Dashboard
            </Link>
            <Link to="/proposals" className="btn-secondary px-8 py-3 text-base">
              View Proposals
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            GovernX — Alchemy University EVM Chain Certification Project
          </p>
          <p className="text-xs text-slate-700 font-mono">
            Sepolia · Chain ID 11155111
          </p>
        </div>
      </footer>
    </div>
  );
}
