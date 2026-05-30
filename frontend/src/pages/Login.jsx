import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { loginUser } from "../api/authApi";
import { setCredentials } from "../store/authSlice";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visibleError =
    error ||
    (searchParams.get("error") === "google_auth_failed"
      ? "Google sign-in failed. Please try again."
      : searchParams.get("error") === "google_oauth_not_configured"
        ? "Google sign-in is not configured on this server yet."
      : "");

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (res) => {
      if (res.data.requires2FA) {
        sessionStorage.setItem("temp2FAToken", res.data.tempToken);
        navigate("/login/2fa");
        return;
      }
      const { token, user } = res.data;
      dispatch(setCredentials({ token, user }));
      navigate("/dashboard");
    },
    onError: (err) => {
      if (!err.response) {
        setError(
          "Cannot reach server. Start backend (npm start) and check VITE_API_URL matches its PORT.",
        );
        return;
      }
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Login failed",
      );
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your SkillSphere account">
      <Card>
        <Alert type="error" message={visibleError} />
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <div className="text-right -mt-2 mb-2">
            <Link
              to="/forgot-password"
              className="text-sm text-cyan-300 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/50 text-sm">or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-white/70 mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-pink-300 hover:underline font-medium">
            Register
          </Link>
        </p>
        <p className="text-center text-white/50 mt-3 text-xs">
          Admin? Run <code className="text-cyan-200">npm run seed:admin</code> in backend, then sign in here.
        </p>
      </Card>
    </AuthLayout>
  );
}
