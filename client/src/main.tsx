import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./pages/App.tsx";
import Login from "./pages/Login.tsx";
import DevPreview from "./pages/DevPreview.tsx";
import "./styles/tailwind.css"
import Launcher from "./pages/Launcher.tsx";
import Print from "./pages/Print.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<App/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/print" element={<Print/>}/>
      <Route path="/launcher" element={<Launcher/>}/>
      <Route path="/dev" element={<DevPreview/>}/>
    </Routes>
    </BrowserRouter>
  </StrictMode>
);
