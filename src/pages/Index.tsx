import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Settings, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "User Management",
      description: "Complete CRUD operations for user accounts with role-based access control."
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Manager login system with secure session management and authorization."
    },
    {
      icon: Settings,
      title: "Admin Dashboard",
      description: "Intuitive dashboard for managing users, monitoring activity, and system settings."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(262_83%_58%/0.1),transparent)]" />
      
      <div className="relative max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow mb-8">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              User Management
            </span>
            <br />
            <span className="text-foreground">System</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A comprehensive platform for managers to efficiently handle user accounts, 
            permissions, and administrative tasks with modern security standards.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/login")}
              className="bg-gradient-primary hover:shadow-glow transition-spring text-lg px-8 py-6"
            >
              Manager Login
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="text-lg px-8 py-6 transition-smooth hover:shadow-glow border-border/50"
            >
              View Dashboard
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-border/50 shadow-card hover:shadow-elegant transition-smooth">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Card */}
        <Card className="bg-gradient-card border-border/50 shadow-elegant max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>
              Frontend UI is ready. Connect Supabase to enable full functionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <span className="text-sm font-medium">Frontend Interface</span>
                <span className="text-success font-semibold">✔ Ready</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <span className="text-sm font-medium">Database Connection</span>
                <span className="text-warning font-semibold">⏳ Pending</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <span className="text-sm font-medium">Authentication System</span>
                <span className="text-warning font-semibold">⏳ Pending</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              Connect Supabase using the green button in the top right to activate all features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
