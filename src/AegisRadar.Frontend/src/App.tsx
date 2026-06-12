import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Posture from "./pages/Posture";
import Team from "./pages/Team";
import SettingsPage from "./pages/Settings";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import Payment from "./pages/Payment";
import { SignalRProvider } from "./components/SignalRProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner theme="dark" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/demo" element={<Demo />} />
            
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <SignalRProvider>
                        <DashboardLayout />
                    </SignalRProvider>
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="profile" element={<Profile />} />
                <Route path="posture" element={<Posture />} />
                <Route path="team" element={<Team />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="payment" element={<Payment />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
