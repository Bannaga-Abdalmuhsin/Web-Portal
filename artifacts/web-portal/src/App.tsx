import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { DriverLayout } from "@/components/layout/DriverLayout";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminMissions from "@/pages/admin/Missions";
import AdminSites from "@/pages/admin/Sites";
import AdminDrivers from "@/pages/admin/Drivers";
import AdminReports from "@/pages/admin/Reports";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminSettings from "@/pages/admin/Settings";
import AdminAdmins from "@/pages/admin/Admins";

// Driver Pages
import DriverLogin from "@/pages/driver/DriverLogin";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import DriverMissionDetail from "@/pages/driver/DriverMissionDetail";
import DriverNotifications from "@/pages/driver/DriverNotifications";
import DriverSettings from "@/pages/driver/DriverSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children, type }: { children: React.ReactNode, type: "admin" | "driver" }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.type !== type) {
    const loginPath = type === "admin" ? "/login" : "/driver/login";
    setTimeout(() => setLocation(loginPath), 0);
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Admin Public */}
      <Route path="/login" component={AdminLogin} />

      {/* Driver Public */}
      <Route path="/driver/login" component={DriverLogin} />

      {/* Driver Protected */}
      <Route path="/driver/*">
        <AuthGuard type="driver">
          <DriverLayout>
            <Switch>
              <Route path="/driver/dashboard" component={DriverDashboard} />
              <Route path="/driver/mission/:id" component={DriverMissionDetail} />
              <Route path="/driver/notifications" component={DriverNotifications} />
              <Route path="/driver/settings" component={DriverSettings} />
              <Route path="/driver/*" component={DriverDashboard} />
            </Switch>
          </DriverLayout>
        </AuthGuard>
      </Route>

      {/* Admin Protected */}
      <Route path="*">
        <AuthGuard type="admin">
          <AdminLayout>
            <Switch>
              <Route path="/" component={AdminDashboard} />
              <Route path="/missions" component={AdminMissions} />
              <Route path="/sites" component={AdminSites} />
              <Route path="/drivers" component={AdminDrivers} />
              <Route path="/reports" component={AdminReports} />
              <Route path="/notifications" component={AdminNotifications} />
              <Route path="/settings" component={AdminSettings} />
              <Route path="/admins" component={AdminAdmins} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
