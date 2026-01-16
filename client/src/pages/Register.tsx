import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { GraduationCap, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Program } from "@shared/schema";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "used" | "no_token">("loading");
  const [inviteData, setInviteData] = useState<{ email?: string; role?: string } | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [programId, setProgramId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);

    if (!tokenParam) {
      setStatus("no_token");
      return;
    }

    fetch("/api/invitations/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenParam }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInviteData({ email: data.email, role: data.role });
          setEmail(data.email || "");
          setStatus("valid");
        } else if (data.message === "Invitation already used") {
          setStatus("used");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, []);

  const handleGoogleLogin = () => {
    if (token) {
      window.location.href = `/api/login?invite_token=${token}`;
    } else {
      window.location.href = "/api/login";
    }
  };
  
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          inviteToken: token || undefined,
          programId: programId || undefined,
        }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast({
          title: "Registration Failed",
          description: data.message || "Unable to create account",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Account Created",
        description: "Welcome! Your account has been created successfully.",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleEmailRegister} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            data-testid="input-firstname"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            data-testid="input-lastname"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "valid" && !!inviteData?.email}
          data-testid="input-email"
        />
        {status === "valid" && inviteData?.email && (
          <p className="text-xs text-muted-foreground">Email is set from your invitation</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="programId">Program</Label>
        <Select value={programId} onValueChange={setProgramId}>
          <SelectTrigger id="programId" data-testid="select-program">
            <SelectValue placeholder="Select your program" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id.toString()}>
                {program.code} - {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
            data-testid="button-toggle-password"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          data-testid="input-confirm-password"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
        data-testid="button-register"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">PO Assessment System</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying invitation...</p>
            </div>
          )}

          {status === "valid" && inviteData && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Valid Invitation</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    You have been invited as <span className="font-semibold capitalize">{inviteData.role?.replace("_", " ")}</span>
                  </p>
                </div>
              </div>

              {renderForm()}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button onClick={handleGoogleLogin} variant="outline" className="w-full" size="lg" data-testid="button-google-register">
                <SiGoogle className="w-4 h-4 mr-2" />
                Sign up with Google
              </Button>
            </div>
          )}
          
          {status === "no_token" && (
            <div className="space-y-6">
              {renderForm()}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button onClick={handleGoogleLogin} variant="outline" className="w-full" size="lg" data-testid="button-google-register">
                <SiGoogle className="w-4 h-4 mr-2" />
                Sign up with Google
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:underline" data-testid="link-login">
                  Sign in
                </a>
              </p>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Invalid Invitation</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
                  </p>
                </div>
              </div>

              <Button onClick={() => setLocation("/login")} variant="outline" className="w-full" data-testid="button-go-login">
                Go to Login
              </Button>
            </div>
          )}

          {status === "used" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Invitation Already Used</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This invitation has already been used. If you already have an account, you can sign in below.
                  </p>
                </div>
              </div>

              <Button onClick={() => setLocation("/login")} className="w-full" data-testid="button-login-existing">
                Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
