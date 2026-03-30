import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { DriverLayout } from "@/components/layout/DriverLayout";
import { TechnicianLayout } from "@/components/layout/TechnicianLayout";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminMissions from "@/pages/admin/Missions";
import AdminSites from "@/pages/admin/Sites";
import AdminDrivers from "@/pages/admin/Drivers";
import AdminGenerators from "@/pages/admin/Generators";
import AdminReports from "@/pages/admin/Reports";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminSettings from "@/pages/admin/Settings";
import AdminAdmins from "@/pages/admin/Admins";
import AdminTechnicians from "@/pages/admin/Technicians";

// Driver Pages
import DriverLogin from "@/pages/driver/DriverLogin";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import DriverMissionDetail from "@/pages/driver/DriverMissionDetail";
import DriverNotifications from "@/pages/driver/DriverNotifications";
import DriverSettings from "@/pages/driver/DriverSettings";

// Technician Pages
import TechnicianLogin from "@/pages/technician/TechnicianLogin";
import TechnicianDashboard from "@/pages/technician/TechnicianDashboard";
import TechnicianMissionDetail from "@/pages/technician/TechnicianMissionDetail";
import TechnicianNotifications from "@/pages/technician/TechnicianNotifications";
import TechnicianProfile from "@/pages/technician/TechnicianProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children, type }: { children: React.ReactNode, type: "admin" | "driver" | "technician" }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.type !== type) {
    const loginPath = type === "admin" ? "/login" : type === "driver" ? "/driver/login" : "/technician/login";
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

      {/* Technician Public */}
      <Route path="/technician/login" component={TechnicianLogin} />

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

      {/* Technician Protected */}
      <Route path="/technician/*">
        <AuthGuard type="technician">
          <TechnicianLayout>
            <Switch>
              <Route path="/technician/dashboard" component={TechnicianDashboard} />
              <Route path="/technician/mission/:id" component={TechnicianMissionDetail} />
              <Route path="/technician/notifications" component={TechnicianNotifications} />
              <Route path="/technician/profile" component={TechnicianProfile} />
              <Route path="/technician/*" component={TechnicianDashboard} />
            </Switch>
          </TechnicianLayout>
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
              <Route path="/generators" component={AdminGenerators} />
              <Route path="/reports" component={AdminReports} />
              <Route path="/notifications" component={AdminNotifications} />
              <Route path="/settings" component={AdminSettings} />
              <Route path="/admins" component={AdminAdmins} />
              <Route path="/technicians" component={AdminTechnicians} />
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
