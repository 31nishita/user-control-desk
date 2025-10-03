import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Users, Settings, Shield } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const [stats, setStats] = useState([
    { title: "Total Users", value: "0", icon: Users, color: "text-primary" },
    { title: "Active Users", value: "0", icon: Shield, color: "text-success" },
    { title: "Admin Access", value: "Active", icon: Settings, color: "text-warning" },
  ]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Ask server if Supabase is configured
        const statusResp = await fetch("/api/supabase/status");
        const status = await statusResp.json().catch(() => ({ configured: false }));
        setSupabaseConfigured(Boolean(status?.configured));
        if (!status?.configured) {
          try {
            const cached = localStorage.getItem('user_stats');
            if (cached) {
              const { total, active } = JSON.parse(cached);
              if (!mounted) return;
              setStats([
                { title: "Total Users", value: String(total ?? 0), icon: Users, color: "text-primary" },
                { title: "Active Users", value: String(active ?? 0), icon: Shield, color: "text-success" },
                { title: "Admin Access", value: "Demo Mode", icon: Settings, color: "text-warning" },
              ]);
              return;
            }
          } catch {}
          if (!mounted) return;
          setStats([
            { title: "Total Users", value: "0", icon: Users, color: "text-primary" },
            { title: "Active Users", value: "0", icon: Shield, color: "text-success" },
            { title: "Admin Access", value: "Demo Mode", icon: Settings, color: "text-warning" },
          ]);
          return;
        }

        // Get stats from server (service role)
        const statsResp = await fetch("/api/supabase/stats");
        const statsJson = await statsResp.json().catch(() => null);
        if (!mounted) return;
        if (!statsResp.ok || !statsJson) {
          setStats([
            { title: "Total Users", value: "0", icon: Users, color: "text-primary" },
            { title: "Active Users", value: "0", icon: Shield, color: "text-success" },
            { title: "Admin Access", value: "Active", icon: Settings, color: "text-warning" },
          ]);
          return;
        }
        setStats([
          { title: "Total Users", value: String(statsJson.totalUsers ?? 0), icon: Users, color: "text-primary" },
          { title: "Active Users", value: String(statsJson.activeSessions ?? 0), icon: Shield, color: "text-success" },
          { title: "Admin Access", value: "Active", icon: Settings, color: "text-warning" },
        ]);
      } catch {
        if (!mounted) return;
        setStats([
          { title: "Total Users", value: "0", icon: Users, color: "text-primary" },
          { title: "Active Users", value: "0", icon: Shield, color: "text-success" },
          { title: "Admin Access", value: "Demo Mode", icon: Settings, color: "text-warning" },
        ]);
      }
    };
    load();
    const onUsersChanged = (e: any) => {
      if (!mounted) return;
      const detail = e?.detail || {};
      setStats([
        { title: "Total Users", value: String(detail.total ?? 0), icon: Users, color: "text-primary" },
        { title: "Active Users", value: String(detail.active ?? 0), icon: Shield, color: "text-success" },
        { title: "Admin Access", value: "Active", icon: Settings, color: "text-warning" },
      ]);
    };
    window.addEventListener("users:changed", onUsersChanged as EventListener);
    const id = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("users:changed", onUsersChanged as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-gradient-card border-b border-border/50 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Manager Dashboard</h1>
                <p className="text-sm text-muted-foreground">User Management Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user?.email?.substring(0, 2).toUpperCase() || "MG"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">Manager Access</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="transition-smooth hover:shadow-glow"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card border-border/50 shadow-card hover:shadow-elegant transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-primary/10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className={`transition-smooth ${
                activeTab === "users" 
                  ? "bg-gradient-primary shadow-glow" 
                  : "hover:bg-muted/50"
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              User Management
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className={`transition-smooth ${
                activeTab === "settings" 
                  ? "bg-gradient-primary shadow-glow" 
                  : "hover:bg-muted/50"
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "users" && <UserManagement />}
        
        {activeTab === "settings" && (
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>System Settings</span>
              </CardTitle>
              <CardDescription>
                Manage system-wide configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-6">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Settings panel will be available after Supabase integration</p>
                </div>

                <div className="border border-border/50 rounded-lg p-4 bg-background/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Migrate from SQLite to Supabase</p>
                      <p className="text-sm text-muted-foreground">Moves existing local users into Supabase (creates auth users + profiles)</p>
                    </div>
                    <Button
                      disabled={!supabaseConfigured || migrating}
                      onClick={async () => {
                        try {
                          setMigrating(true);
                          const resp = await fetch('/api/supabase/migrate', { method: 'POST' });
                          const json = await resp.json().catch(() => ({}));
                          if (!resp.ok) {
                            throw new Error(json?.error || `Migration failed (${resp.status})`);
                          }
                          toast({
                            title: 'Migration Complete',
                            description: `Migrated ${json?.migrated ?? 0} of ${json?.total ?? 0} users`,
                          });
                        } catch (e: any) {
                          toast({ title: 'Migration Error', description: String(e?.message || e), variant: 'destructive' });
                        } finally {
                          setMigrating(false);
                        }
                      }}
                      className="bg-gradient-primary hover:shadow-glow transition-smooth"
                    >
                      {migrating ? 'Migrating…' : supabaseConfigured ? 'Migrate Now' : 'Configure Server First'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;