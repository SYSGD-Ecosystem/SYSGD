import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { Header } from "./components/header.tsx";
import { Footer } from "./components/footer.tsx";
import { AnimatedBackground } from "./components/animated-background.tsx";
import APIPage from "./app/api/page.tsx";
import PhilosophyPage from "./app/philosophy/page.tsx";
import UpdatesPage from "./app/updates/page.tsx";
import RoadmapPage from "./app/roadmap/page.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnimatedBackground />
    <div className="min-h-screen">
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/api" element={<APIPage />} />
            <Route path="/philosophy" element={<PhilosophyPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  </StrictMode>,
);
