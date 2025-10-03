import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Key, 
  Clock, 
  Shield, 
  Eye, 
  EyeOff,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Copy
} from "lucide-react";

interface ResetToken {
  token: string;
  email: string;
  expires_at: string;
  created_at: string;
  used?: boolean;
}

const PasswordManagement = () => {
  const [resetTokens, setResetTokens] = useState<ResetToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const fetchResetTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-tokens');
      const data = await response.json();
      setResetTokens(data.tokens || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reset tokens",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const generateResetToken = async () => {
    if (!selectedEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Reset Token Generated",
          description: `Reset token created for ${selectedEmail}`,
        });
        setSelectedEmail("");
        fetchResetTokens();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate reset token",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate reset token",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const resetUserPassword = async () => {
    if (!selectedEmail || !newPassword) {
      toast({
        title: "Error",
        description: "Please enter both email and new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First generate reset token
      const resetResponse = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail })
      });

      const resetResult = await resetResponse.json();

      if (!resetResponse.ok || !resetResult.resetToken) {
        throw new Error(resetResult.error || "Failed to generate reset token");
      }

      // Then use token to reset password
      const passwordResponse = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: resetResult.resetToken,
          newPassword: newPassword
        })
      });

      const passwordResult = await passwordResponse.json();

      if (passwordResponse.ok) {
        toast({
          title: "Password Reset Successful",
          description: `Password updated for ${selectedEmail}`,
        });
        setSelectedEmail("");
        setNewPassword("");
        fetchResetTokens();
      } else {
        throw new Error(passwordResult.error || "Failed to reset password");
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Token copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchResetTokens();
    const interval = setInterval(fetchResetTokens, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Password Management</span>
          </CardTitle>
          <CardDescription>
            Manage user password resets and view reset activity
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Password Reset Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Reset Token */}
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Generate Reset Token</span>
            </CardTitle>
            <CardDescription>
              Create a password reset token for a user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">User Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="user@example.com"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={generateResetToken}
              disabled={loading || !selectedEmail}
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              {loading ? "Generating..." : "Generate Reset Token"}
            </Button>
          </CardContent>
        </Card>

        {/* Direct Password Reset */}
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <RefreshCw className="w-5 h-5" />
              <span>Direct Password Reset</span>
            </CardTitle>
            <CardDescription>
              Directly reset a user's password (admin only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direct-email">User Email</Label>
              <Input
                id="direct-email"
                type="email"
                placeholder="user@example.com"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-sm text-red-500">Password must be at least 6 characters</p>
              )}
            </div>
            <Button
              onClick={resetUserPassword}
              disabled={loading || !selectedEmail || !newPassword || newPassword.length < 6}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Reset Tokens */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Active Reset Tokens</span>
            </CardTitle>
            <CardDescription>
              Currently active password reset tokens
            </CardDescription>
          </div>
          <Button
            onClick={fetchResetTokens}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {resetTokens.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                No active reset tokens found. All tokens may have expired or been used.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {resetTokens.map((token, index) => (
                <div
                  key={index}
                  className="border border-border/50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{token.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isTokenExpired(token.expires_at) ? (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Expired</span>
                        </Badge>
                      ) : (
                        <Badge variant="default" className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Active</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created:</p>
                      <p className="font-mono">{formatDate(token.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires:</p>
                      <p className="font-mono">{formatDate(token.expires_at)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">Reset Token:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                        {token.token}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(token.token)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reset URL: http://localhost:8080/reset-password?token={token.token}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordManagement;