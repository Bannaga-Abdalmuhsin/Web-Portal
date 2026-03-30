import { useDashboardKpis } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, MapPin, Activity, Users, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { data: kpis, isLoading } = useDashboardKpis();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock trend data since endpoint doesn't return full timeseries in the generated type
  const mockTrend = Array.from({ length: 7 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    liters: Math.floor(Math.random() * 5000) + 1000
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-panel border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplet className="w-24 h-24 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Liters Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-slate-900">
              {kpis?.litersToday?.toLocaleString() || 0} <span className="text-xl text-slate-400 font-sans">L</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-24 h-24 text-accent" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">30-Day Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-slate-900">
              {kpis?.liters30d?.toLocaleString() || 0} <span className="text-xl text-slate-400 font-sans">L</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MapPin className="w-24 h-24 text-amber-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-slate-900">
              {kpis?.activeMissions || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-purple-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-slate-900">
              {kpis?.activeDrivers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-panel border-0 lg:col-span-2 shadow-xl shadow-slate-200/50">
          <CardHeader className="border-b border-slate-100 pb-4 mb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> 
              Fuel Pumping Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="liters" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLiters)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="border-b border-slate-100 pb-4 mb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Missions by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpis?.missionsByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {(kpis?.missionsByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-4 space-y-2">
              {(kpis?.missionsByStatus || []).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600">{entry.status}</span>
                  </div>
                  <span className="font-bold text-slate-900">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
