import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProposalsPage } from "@/pages/ProposalsPage";
import { ProposalDetailPage } from "@/pages/ProposalDetailPage";
import { CreateProposalPage } from "@/pages/CreateProposalPage";
import { DemoTargetPage } from "@/pages/DemoTargetPage";
import { useWallet } from "@/hooks/useWallet";

export default function App() {
  const {
    wallet,
    metamaskInstalled,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork,
    shortened,
  } = useWallet();

  const handleConnect = async () => {
    if (!metamaskInstalled) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    try {
      await connect();
      toast.success("Wallet connected!");
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e.message?.includes("rejected")) {
        toast.error("Connection rejected.");
      } else {
        toast.error(e.message ?? "Failed to connect wallet.");
      }
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      toast.success("Switched to Sepolia!");
    } catch {
      toast.error("Failed to switch network. Try manually in MetaMask.");
    }
  };

  const navbarProps = {
    wallet,
    metamaskInstalled,
    isCorrectNetwork,
    onConnect: handleConnect,
    onDisconnect: disconnect,
    onSwitchNetwork: handleSwitchNetwork,
    shortened,
  };

  const dashboardProps = {
    wallet,
    isCorrectNetwork,
    onConnect: handleConnect,
    onSwitchNetwork: handleSwitchNetwork,
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#1e293b" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
        }}
      />

      <Routes>
        {/* Landing — no navbar */}
        <Route
          path="/"
          element={
            <LandingPage
              onConnect={handleConnect}
              connected={wallet.connected}
            />
          }
        />

        {/* App routes — with navbar */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen">
              <Navbar {...navbarProps} />
              <main>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage {...dashboardProps} />} />
                  <Route path="/proposals" element={<ProposalsPage />} />
                  <Route
                    path="/proposals/:id"
                    element={
                      <ProposalDetailPage
                        wallet={wallet}
                        isCorrectNetwork={isCorrectNetwork}
                      />
                    }
                  />
                  <Route
                    path="/create"
                    element={
                      <CreateProposalPage
                        wallet={wallet}
                        isCorrectNetwork={isCorrectNetwork}
                        onConnect={handleConnect}
                      />
                    }
                  />
                  <Route path="/demo" element={<DemoTargetPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </>
  );
}
