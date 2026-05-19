import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { resetPassword } from "../api/authApi";
import { setCredentials } from "../store/authSlice";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => resetPassword(token, password),
    onSuccess: (res) => {
      const { token: jwt, user } = res.data;
      dispatch(setCredentials({ token: jwt, user }));
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Reset failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    mutation.mutate();
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Choose a new password">
      <Card>
        <Alert type="error" message={error} />
        <form onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            required
          />
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Updating..." : "Reset Password"}
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
