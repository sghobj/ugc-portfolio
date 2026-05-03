import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from '@/apollo/apolloClient'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import FeedbackPage from "./pages/Feedback";
import ImpressumPage from "./pages/Impressum";
import InstagramLogin from "./pages/InstagramLogin";
import { InstagramPanel } from "./pages/InstagramPanel";
import NotFound from "./pages/NotFound";
import { ApiClientOutlet } from "@/components/ApiClientOutlet";
import { env } from "@/config/env";

const queryClient = new QueryClient();

const App = () => (
    <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Routes>
                        <Route path="/admin/login" element={<InstagramLogin />} />
                        <Route path="/instagram-login" element={<Navigate to="/admin/login" replace />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/admin" element={<InstagramPanel />} />
                            <Route path="/instagram-panel" element={<Navigate to="/admin" replace />} />
                        </Route>
                        <Route path="/impressum" element={<ImpressumPage />} />
                        <Route element={<ApiClientOutlet />}>
                            <Route path="/" element={<Index />} />
                            <Route path={env.feedbackFormPath} element={<FeedbackPage />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    </ApolloProvider>
);

export default App;
