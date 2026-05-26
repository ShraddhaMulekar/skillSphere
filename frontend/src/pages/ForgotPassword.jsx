// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { forgotPassword, resetPassword } from "../api/authApi";

export default function ForgotPassword() {
  const { token: rawToken } = useParams();
  const token = rawToken ? decodeURIComponent(rawToken) : "";
  const [email, setEmail] = useState("");
  const [directToken, setDirectToken] = useState("");
  const navigate = useNavigate()
  // Mutation to obtain a reset token without sending email link
  const getTokenMutation = useMutation({
    mutationFn: (emailVal) => forgotPassword(emailVal || email),
    onSuccess: (res) => {
      if (res.data.resetToken) {
        setDirectToken(res.data.resetToken);
        setShowResetForm(true);
        setError("");
      } else {
        setError("Unable to obtain reset token");
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to get reset token");
    },
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  // If token is present in URL, automatically show reset form
  useEffect(() => {
    if (token) setShowResetForm(true);
  }, [token]);

  // Send reset‑link flow
  const sendLinkMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (res) => {
      setMessage(res.data.message || "Check your email for a reset link.");
      setError("");
      // If a reset token is returned, navigate to the reset password route
      if (res.data.resetToken) {
        navigate(`/reset-password/${encodeURIComponent(res.data.resetToken)}`);
        return; // navigation will handle reset form
      }
      // If verificationCode is provided (legacy), set it
      if (res.data.verificationCode) {
        setVerificationCode(res.data.verificationCode);
        setShowResetForm(true);
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Request failed");
      setMessage("");
    },
  });

  const [hideAll, setHideAll] = useState(false);

  // Reset password flow using URL token
  const resetPasswordMutation = useMutation({
    mutationFn: () => resetPassword(directToken || token, newPass),
    onSuccess: (res) => {
      setMessage("Password reset successful. You can now log in.");
      setError("");
      setEmail("");
      setNewPass("");
      setConfirmPass("");
      setHideAll(false);
      alert("Password reset successful! Please log in with your new password.");
      navigate("/login");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Reset failed";
      setError(msg);
      if (msg.includes("Invalid or expired reset token")) {
        setHideAll(true);
        setShowResetForm(false);
        setVerificationCode(""); // clear stale token
      }
    },
  });

  // Handlers
  const handleSendLink = (e) => {
    e.preventDefault();
    sendLinkMutation.mutate();
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setError("Passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    resetPasswordMutation.mutate();
  };

  // Reset UI after invalid/expired token
  const resetInvalidToken = () => {
    setHideAll(false);
    setShowResetForm(false);
    setVerificationCode("");
    setError("");
    setMessage("");
    setEmail("");
  };
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a reset code."
    >
      <Card>
        <Alert type="error" message={error} />
        <Alert type="success" message={message} />

        {!hideAll && (
          <>
            {/* Send Reset Link form */}
            <form onSubmit={handleSendLink} className="mb-6">
              <Input
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={sendLinkMutation.isPending}
              >
                {sendLinkMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <Button
              type="button"
              className="text-cyan-300 underline mt-2"
              onClick={() => {
                // If we already have a token (e.g., from URL), just show the form
                if (token) {
                  setShowResetForm(true);
                } else {
                  // Otherwise fetch a token via forgotPassword API
                  getTokenMutation.mutate();
                }
              }}
            >
              Reset Password
            </Button>
          </>
        )}
        {hideAll && (
          <div className="text-center mt-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button
              type="button"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={resetInvalidToken}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Reset Password form */}
        {showResetForm && !hideAll && (
          <form onSubmit={handleResetPassword} className="mt-4">
            <Input
              label="Enter New Password"
              type="password"
              name="newPass"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
            <Input
              label="Re-enter New Password"
              type="password"
              name="confirmPass"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Repeat password"
              required
            />
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending
                ? "Setting new password..."
                : "Set New Password"}
            </Button>
          </form>
        )}

        <p className="text-center text-white/70 mt-6 text-sm">
          <Link
            to="/login"
            className="text-cyan-300 hover:underline font-medium"
          >
            Back to Sign In
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
