import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import ColleeLogo from "@/components/ColleeLogo";
import { useSignIn, useSignUp } from "@clerk/clerk-react";

interface AuthScreenProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onLogoClick?: () => void;
}

export function AuthScreen({ onLogin, onSignup, onLogoClick }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Email verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!signIn || !signInLoaded) return;
        const result = await signIn.create({
          identifier: email,
          password,
        });
        if (result.status === "complete") {
          await signIn.setActive({ session: result.createdSessionId });
        }
      } else {
        if (!signUp || !signUpLoaded) return;
        
        // Create the sign-up
        await signUp.create({
          emailAddress: email,
          password,
          firstName: name,
        });
        
        // Send email verification code
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        
        // Show verification UI
        setPendingVerification(true);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!signUp || !signUpLoaded) return;

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await signUp.setActive({ session: result.createdSessionId });
        // Reset states
        setPendingVerification(false);
        setVerificationCode("");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    try {
      if (!signUp || !signUpLoaded) return;
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setError(""); // Clear any previous errors
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Failed to resend code");
    }
  };

  const handleBackToSignUp = () => {
    setPendingVerification(false);
    setVerificationCode("");
    setError("");
  };

  const handleGoogleAuth = async () => {
    setError("");
    try {
      if (isLogin) {
        if (!signIn || !signInLoaded) return;
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        if (!signUp || !signUpLoaded) return;
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Google auth failed");
    }
  };

  // Verification Screen UI
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        {/* Blurred gradient orbs for depth */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/[0.06] blur-[100px] pointer-events-none" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative"
        >
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center gap-4"
            >
              <ColleeLogo size="lg" showText onClick={onLogoClick} />
            </motion.div>
            <p className="text-body text-foreground-muted mt-2">
              Check your email for a verification code
            </p>
          </div>

          {/* Verification Card */}
          <motion.div
            layout
            className="bg-card rounded-2xl shadow-soft-md p-8 border border-card-border relative overflow-hidden transition-shadow duration-300 hover:shadow-soft-lg"
          >
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-heading-sm text-foreground mb-2">Verify your email</h2>
              <p className="text-body-sm text-foreground-muted">
                We sent a verification code to<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-body-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground-muted text-body-sm">
                  Verification code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="pl-10 h-12 bg-muted border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background focus:shadow-sm transition-all text-center text-lg tracking-widest"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="collee-accent"
                size="lg"
                className="w-full h-12"
                disabled={isLoading || verificationCode.length < 6}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-body-sm text-foreground-muted">
                Didn't receive a code?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-secondary hover:text-secondary-hover transition-colors font-medium"
                >
                  Resend code
                </button>
              </p>
              <button
                type="button"
                onClick={handleBackToSignUp}
                className="flex items-center justify-center gap-2 text-body-sm text-foreground-muted hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign up
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Blurred gradient orbs for depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/[0.06] blur-[100px] pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <ColleeLogo size="lg" showText showTagline onClick={onLogoClick} />
          </motion.div>
          <p className="text-body text-foreground-muted mt-2">
            {isLogin
              ? "Welcome back! Let's continue your story."
              : "Start discovering what makes you unique."}
          </p>
        </div>

        {/* Auth Card with top gradient border */}
        <motion.div
          layout
          className="bg-card rounded-2xl shadow-soft-md p-8 border border-card-border relative overflow-hidden transition-shadow duration-300 hover:shadow-soft-lg"
        >
          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40" />

          {/* Toggle Tabs with sliding pill */}
          <div className="flex bg-muted rounded-xl p-1 mb-8 relative">
            {/* Sliding pill indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-card shadow-sm"
              layoutId="auth-tab-pill"
              style={{ width: 'calc(50% - 4px)' }}
              animate={{ left: isLogin ? 4 : 'calc(50% + 0px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 text-body-sm font-medium rounded-lg transition-colors duration-200 relative z-10 ${
                isLogin ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 text-body-sm font-medium rounded-lg transition-colors duration-200 relative z-10 ${
                !isLogin ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-body-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pb-1">
                    <Label htmlFor="name" className="text-foreground-muted text-body-sm">
                      Your name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="What should we call you?"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 bg-muted border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background focus:shadow-sm transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground-muted text-body-sm">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background focus:shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground-muted text-body-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-muted border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background focus:shadow-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-body-sm text-secondary hover:text-secondary-hover transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="collee-accent"
              size="lg"
              className="w-full h-12 mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-caption text-foreground-subtle">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login - Google with brand colors */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 bg-card hover:bg-muted border-border"
            onClick={handleGoogleAuth}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-caption text-foreground-subtle mt-8">
          By continuing, you agree to our{" "}
          <button className="text-secondary hover:text-secondary-hover transition-colors">
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="text-secondary hover:text-secondary-hover transition-colors">
            Privacy Policy
          </button>
        </p>
      </motion.div>
    </div>
  );
}
