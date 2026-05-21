import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { forgotPassword } from "../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const mutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (res) => {
      setMessage(res.data.message || "Check your email for a reset link.");
      setError("");
      setResetUrl(res.data.resetUrl || "");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Request failed");
      setResetUrl("");
    },
  });

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="We'll email you a reset link"
    >
      <Card>
        <Alert type="error" message={error} />
        <Alert type="success" message={message} />
        {resetUrl && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p className="font-semibold">Manual reset link</p>
            <a href={resetUrl} className="mt-1 block break-all text-cyan-200 underline">
              {resetUrl}
            </a>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <p className="text-center text-white/70 mt-6 text-sm">
          <Link to="/login" className="text-cyan-300 hover:underline font-medium">
            Back to Sign In
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
