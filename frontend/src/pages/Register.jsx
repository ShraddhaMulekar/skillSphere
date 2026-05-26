import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { registerUser } from "../api/authApi";
import { setCredentials } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

const roleOptions = [
  { value: "client", label: "Client – I want to hire" },
  { value: "freelancer", label: "Freelancer – I want to work" },
];

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");

  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (data) => registerUser(data),
    onSuccess: (res) => {
      // Navigate to verification page (manual entry) passing email via location state
      navigate("/verify-email", { state: { email: res.data.user.email } });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Registration failed";
      setError(msg);
    },
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
    setVerificationUrl("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <AuthLayout
      title="Join SkillSphere"
      subtitle="Connect with hyperlocal talent"
    >
      <Card>
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        {success && (
          <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            <p className="font-semibold">Have your verification code?</p>
            <Link to="/verify-email" className="mt-1 block text-cyan-200 underline font-medium">
              Click here to enter your 6-digit verification code
            </Link>
          </div>
        )}
        {verificationUrl && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p className="font-semibold">Manual verification link</p>
            <a href={verificationUrl} className="mt-1 block break-all text-cyan-200 underline">
              {verificationUrl}
            </a>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
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
            placeholder="Min 6 characters"
            required
          />
          <Select
            label="I am a..."
            name="role"
            value={form.role}
            onChange={handleChange}
            options={roleOptions}
          />
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/50 text-sm">or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <GoogleSignInButton role={form.role} />

        <p className="text-center text-white/70 mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-300 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
