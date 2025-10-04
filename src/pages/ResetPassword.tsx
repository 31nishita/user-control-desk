import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase sets a recovery session after following the email link
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setTokenError("Invalid or expired reset link");
      }
    };
    verifySession();
  }, []);

  const validatePassword = () => {
    if (newPassword.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePassword();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
        return;
      }
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(262_83%_58%/0.1),transparent)]" />
        
        <Card className="w-full max-w-md relative backdrop-blur-sm bg-gradient-card border-border/50 shadow-elegant">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-red-600">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                The password reset link is invalid or missing
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
              <AlertDescription>
                {tokenError}. Please request a new password reset link.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full"
              >
                Request New Reset Link
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(262_83%_58%/0.1),transparent)]" />
        
        <Card className="w-full max-w-md relative backdrop-blur-sm bg-gradient-card border-border/50 shadow-elegant">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-glow">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-green-600">
                Password Updated
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your password has been successfully reset
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>
                  You can now sign in with your new password.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-primary hover:shadow-glow transition-spring font-semibold"
              >
                Continue to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(262_83%_58%/0.1),transparent)]" />
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-gradient-card border-border/50 shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Set New Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a strong password for your account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10 transition-smooth focus:ring-primary/20 focus:shadow-glow"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-sm text-red-500">Password must be at least 6 characters</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 transition-smooth focus:ring-primary/20 focus:shadow-glow"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={newPassword.length >= 6 ? "text-green-600" : ""}>
                  At least 6 characters long
                </li>
                <li className={newPassword === confirmPassword && confirmPassword ? "text-green-600" : ""}>
                  Passwords must match
                </li>
              </ul>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow transition-spring font-semibold"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;