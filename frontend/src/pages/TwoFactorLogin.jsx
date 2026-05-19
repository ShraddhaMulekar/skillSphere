import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { verify2FALogin } from "../api/authApi";
import { setCredentials } from "../store/authSlice";

export default function TwoFactorLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tempToken = sessionStorage.getItem("temp2FAToken");

  const mutation = useMutation({
    mutationFn: () => verify2FALogin({ tempToken, token: code }),
    onSuccess: (res) => {
      const { token, user } = res.data;
      sessionStorage.removeItem("temp2FAToken");
      dispatch(setCredentials({ token, user }));
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Verification failed");
    },
  });

  if (!tempToken) {
    return (
      <AuthLayout title="Two-Factor Auth" subtitle="Session expired">
        <Card>
          <p className="text-white/80 text-center mb-4">
            Please sign in again to continue.
          </p>
          <Link
            to="/login"
            className="block text-center text-cyan-300 hover:underline"
          >
            Go to Sign In
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Two-Factor Auth"
      subtitle="Enter the 6-digit code from your authenticator app"
    >
      <Card>
        <Alert type="error" message={error} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Input
            label="Authentication Code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            required
            maxLength={6}
          />
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={mutation.isPending || code.length !== 6}
          >
            {mutation.isPending ? "Verifying..." : "Verify & Sign In"}
          </Button>
        </form>
        <p className="text-center text-white/70 mt-6 text-sm">
          <Link to="/login" className="text-cyan-300 hover:underline font-medium">
            Cancel
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
