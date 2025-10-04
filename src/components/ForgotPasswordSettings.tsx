import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Send, CheckCircle } from "lucide-react";

const ForgotPasswordSettings = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  const { toast } = useToast();
  const { resetPassword, user } = useAuth();

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailToUse = email || user?.email || "";
    
    if (!emailToUse) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await resetPassword(emailToUse);

    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: `Reset instructions have been sent to ${emailToUse}`,
      });
      setIsEmailSent(true);
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    setIsEmailSent(false);
    setEmail("");
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Password Reset Email</span>
        </CardTitle>
        <CardDescription>
          Send password reset instructions to an email address
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEmailSent ? (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={user?.email || "Enter email address"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-smooth focus:ring-primary/20 focus:shadow-glow"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your current account email ({user?.email})
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow transition-spring font-semibold"
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? "Sending Reset Email..." : "Send Password Reset Email"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Email Sent Successfully</h4>
              <p className="text-sm text-muted-foreground">
                Password reset instructions have been sent to:
              </p>
              <p className="font-medium text-foreground">
                {email || user?.email}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="transition-smooth hover:shadow-glow"
            >
              Send to Different Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordSettings;