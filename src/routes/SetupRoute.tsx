import { useState } from "react";
import { isAdminSessionVerified, markAdminSessionVerified } from "../providers/adminAuth";
import PinGate from "../components/Setup/PinGate";
import SetupDashboard from "../components/Setup/SetupDashboard";
import "../styles/setup.css";

export default function SetupRoute() {
  const [verified, setVerified] = useState(() => isAdminSessionVerified());

  return (
    <div className="grp-setup-page">
      <div className="grp-setup-container">
        <h1 className="grp-setup-title">Private Reveal Setup</h1>
        <p className="grp-setup-tagline">This page is only for the trusted person setting up the reveal.</p>
        {verified ? (
          <SetupDashboard />
        ) : (
          <PinGate
            description="This screen controls the private gender reveal result. Only the trusted person handling the reveal should continue."
            onVerified={() => {
              markAdminSessionVerified();
              setVerified(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
