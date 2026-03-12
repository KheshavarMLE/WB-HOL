import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SessionSelector from "./pages/SessionSelector";
import SAPPortal from "./pages/SAPPortal";
import WorkBenchPDP from "./pages/WorkBenchPDP";
import WebViewSystem from "./pages/WebViewSystem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/session/:sessionId" element={<SessionSelector />} />
          <Route path="/session/:sessionId/sap" element={<SAPPortal />} />
          <Route path="/session/:sessionId/workbench" element={<WorkBenchPDP />} />
          <Route path="/session/:sessionId/webview" element={<WebViewSystem />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
