import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        
        const { count: activeSessions } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        if (!mounted) return;
        setStats([
          { title: "Total Users", value: String(totalUsers ?? 0), icon: Users, color: "text-primary" },
          { title: "Active Users", value: String(activeSessions ?? 0), icon: Shield, color: "text-success" },
          { title: "Admin Access", value: "Active", icon: Settings, color: "text-warning" },
        ]);
      } catch (error) {
        if (!mounted) return;
        setStats((s) => s.map((it, idx) => ({ ...it, value: idx === 2 ? "Active" : "0" })));
      }
    };
    load();
    // Listen to user changes from UserManagement to update stats instantly
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
    const id = setInterval(load, 30000); // Check every 30 seconds
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("users:changed", onUsersChanged as EventListener);
    };
  }, []);

  const validatePasswordStrength = (password: string) => {
    const lengthOk = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return lengthOk && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast({ title: "Not authenticated", description: "Please login again.", variant: "destructive" });
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing fields", description: "Fill out all password fields.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    if (!validatePasswordStrength(newPassword)) {
      toast({
        title: "Weak password",
        description: "Use 8+ chars with upper, lower, number, and special.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingPassword(true);

      // Verify current password by re-authenticating
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        toast({ title: "Current password incorrect", description: "Please try again.", variant: "destructive" });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Password updated", description: "Your password has been changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
                <span>Account Settings</span>
              </CardTitle>
              <CardDescription>
                Update your password and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use 8+ characters, including upper, lower, number, and special.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isUpdatingPassword} className="bg-gradient-primary">
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;