import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { useState } from "react";
import {
  CONTRACT_ADDRESS,
  EXPLORER_URL,
  CHAIN_NAME,
  SEPOLIA_CHAIN_ID,
} from "@/config/chain";
import { shortenAddress } from "@/services/wallet";
import type { WalletState } from "@/types";

interface NavbarProps {
  wallet: WalletState;
  metamaskInstalled: boolean;
  isCorrectNetwork: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
  shortened: string;
}

export function Navbar({
  wallet,
  metamaskInstalled,
  isCorrectNetwork,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  shortened,
}: NavbarProps) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/proposals", label: "Proposals" },
    { to: "/create", label: "Create" },
    { to: "/demo", label: "Demo Target" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight gradient-text">
              GOVERN<span className="text-white">X</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  pathname === to || pathname.startsWith(to + "/")
                    ? "bg-brand-500/15 text-brand-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Network warning */}
            {wallet.connected && !isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium
                  hover:bg-amber-500/25 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Wrong Network — Switch
              </button>
            )}

            {/* Wallet button */}
            {wallet.connected ? (
              <div className="flex items-center gap-2">
                {/* Member badge */}
                {wallet.isMember !== null && (
                  <span
                    className={clsx(
                      "hidden sm:inline-flex badge",
                      wallet.isMember
                        ? "badge-member"
                        : "badge-non-member"
                    )}
                  >
                    {wallet.isMember ? "✓ Member" : "✗ Non-Member"}
                  </span>
                )}

                {/* Address */}
                <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl
                  bg-surface-800 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                  <span className="text-sm font-mono text-slate-300">{shortened}</span>
                  <button
                    onClick={onDisconnect}
                    title="Disconnect wallet"
                    className="text-slate-500 hover:text-slate-300 transition-colors ml-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={!metamaskInstalled}
                className="btn-primary text-sm"
              >
                {metamaskInstalled ? "Connect Wallet" : "Install MetaMask"}
              </button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden btn-ghost p-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-surface-950/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === to
                    ? "bg-brand-500/15 text-brand-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
            {wallet.connected && !isCorrectNetwork && (
              <button
                onClick={() => { onSwitchNetwork(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-amber-400 hover:bg-white/5"
              >
                ⚠ Switch to {CHAIN_NAME}
              </button>
            )}
            {CONTRACT_ADDRESS && (
              <div className="px-3 py-2.5">
                <p className="text-xs text-slate-500">Contract</p>
                <a
                  href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 font-mono hover:underline"
                >
                  {shortenAddress(CONTRACT_ADDRESS)}
                </a>
              </div>
            )}
            <div className="px-3 py-1 text-xs text-slate-600">
              Chain ID: {SEPOLIA_CHAIN_ID}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
