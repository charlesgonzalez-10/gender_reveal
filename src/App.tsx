import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GameProvider } from "./state/GameContext";

const PublicGameRoute = lazy(() => import("./routes/PublicGameRoute"));
const SetupRoute = lazy(() => import("./routes/SetupRoute"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="/"
            element={
              <GameProvider>
                <PublicGameRoute />
              </GameProvider>
            }
          />
          <Route path="/setup" element={<SetupRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
