import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Document from "@/pages/document";
import { ResizableProvider } from "@/components/ui/resizable";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { PlanningFormProvider } from "@/hooks/use-planning-form";
import PlanningForm from "@/components/planning-form/PlanningForm";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/document/category/reviews/daily" component={dynamic(() => import('./pages/document/category/reviews/daily'))} />
      <ProtectedRoute path="/document/category/reviews/weekly" component={dynamic(() => import('./pages/document/category/reviews/weekly'))} />
      <ProtectedRoute path="/document/category/reviews/monthly" component={dynamic(() => import('./pages/document/category/reviews/monthly'))} />
      <ProtectedRoute path="/document/category/reviews/yearly" component={dynamic(() => import('./pages/document/category/reviews/yearly'))} />
      <ProtectedRoute path="/document/category/reviews/experiential" component={dynamic(() => import('./pages/document/category/reviews/experiential'))} />
      
      {/* Actionables Category Routes */}
      <ProtectedRoute path="/document/category/actionables/projects" component={dynamic(() => import('./pages/document/category/actionables/projects'))} />
      <ProtectedRoute path="/document/category/actionables/references" component={dynamic(() => import('./pages/document/category/actionables/references'))} />
      
      {/* Non-Actionables Category Routes */}
      <ProtectedRoute path="/document/category/non_actionables/filing" component={dynamic(() => import('./pages/document/category/non_actionables/filing'))} />
      <ProtectedRoute path="/document/category/non_actionables/someday" component={dynamic(() => import('./pages/document/category/non_actionables/someday'))} />
      <ProtectedRoute path="/document/category/non_actionables/waiting" component={dynamic(() => import('./pages/document/category/non_actionables/waiting'))} />
      
      {/* Other Category Routes */}
      <ProtectedRoute path="/document/category/prioritization" component={dynamic(() => import('./pages/document/category/prioritization'))} />
      <ProtectedRoute path="/document/category/learning_dashboard" component={dynamic(() => import('./pages/document/category/learning_dashboard'))} />
      <ProtectedRoute path="/document/category/strategy_toolbox" component={dynamic(() => import('./pages/document/category/strategy_toolbox'))} />
      
      {/* Default Category Route - Should come last */}
      <ProtectedRoute path="/document/category/:category" component={dynamic(() => import('./pages/category'))} />
      <ProtectedRoute path="/document/:id" component={Document} />
      <ProtectedRoute path="/next-actions" component={dynamic(() => import('./pages/next-actions'))} />
      <ProtectedRoute path="/sessions" component={dynamic(() => import('./pages/session-page'))} />
      <ProtectedRoute path="/sessions/:id" component={dynamic(() => import('./pages/session-detail'))} />
      <ProtectedRoute path="/reviews/form/daily" component={dynamic(() => import('./pages/reviews/form/daily'))} />
      <ProtectedRoute path="/reviews/form/daily/edit/:id" component={dynamic(() => import('./pages/reviews/form/daily'))} />
      <ProtectedRoute path="/reviews/form/experiential" component={dynamic(() => import('./pages/reviews/form/experiential'))} />
      <ProtectedRoute path="/reviews/form/experiential/edit/:id" component={dynamic(() => import('./pages/reviews/form/experiential'))} />
      <ProtectedRoute path="/reviews/form/session/:id" component={dynamic(() => import('./pages/reviews/form/session'))} />
      <ProtectedRoute path="/reviews/form/session/:sessionId/edit/:reviewId" component={dynamic(() => import('./pages/reviews/form/session'))} />
      <Route path="/auth" component={dynamic(() => import('./pages/auth-page'))} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Dynamic import function for code splitting
function dynamic(importFunc: () => Promise<any>) {
  const LazyComponent = () => {
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    
    useEffect(() => {
      importFunc().then((mod) => {
        setComponent(() => mod.default);
      });
    }, []);

    if (!Component) {
      return <div className="flex items-center justify-center h-full w-full">Loading...</div>;
    }

    return <Component />;
  };

  return LazyComponent;
}

// Import the ReviewProvider
import { ReviewProvider } from "@/hooks/use-review";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ReviewProvider>
          <PlanningFormProvider>
            <TooltipProvider>
              <ResizableProvider>
                <div className="h-screen flex overflow-hidden">
                  <Toaster />
                  <Router />
                  {/* Global PlanningForm accessible from any page */}
                  <PlanningForm />
                </div>
              </ResizableProvider>
            </TooltipProvider>
          </PlanningFormProvider>
        </ReviewProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
