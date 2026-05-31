import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { registerUser } from "../api/authApi";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

const roleOptions = [
  { value: "client", label: "Client – I want to hire" },
  { value: "freelancer", label: "Freelancer – I want to work" },
  { value: "admin", label: "Admin – I want to manage" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INVALID_EMAIL_MESSAGE = "email id not found or valid";
const DUMMY_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.in",
  "dummy.com",
  "dummy.in",
  "fake.com",
  "fake.in",
  "localhost",
  "gmail.co",
  "gamil.com",
  "gmial.com",
  "yaho.com",
  "hotmial.com",
  "outlok.com",
]);
const DUMMY_LOCAL_PARTS = new Set([
  "test",
  "dummy",
  "fake",
  "admin",
  "user",
  "abc",
  "abcd",
  "asdf",
  "qwerty",
  "demo",
  "sample",
]);

const getDummyEmailError = (email = "") => {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return INVALID_EMAIL_MESSAGE;
  if (!EMAIL_REGEX.test(normalized)) return INVALID_EMAIL_MESSAGE;

  const [localPart, domain] = normalized.split("@");
  if (DUMMY_DOMAINS.has(domain) || DUMMY_LOCAL_PARTS.has(localPart) || /^test\d*$/.test(localPart) || /^dummy\d*$/.test(localPart)) {
    return INVALID_EMAIL_MESSAGE;
  }

  return "";
};

export default function Register() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: location.state?.role || "freelancer",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const visibleError =
    error ||
    (searchParams.get("error") === "google_auth_failed"
      ? "Google sign-in failed. Please try again."
      : searchParams.get("error") === "google_oauth_not_configured"
        ? "Google sign-in is not configured on this server yet."
        : "");

  const mutation = useMutation({
    mutationFn: (data) => registerUser(data),
    onSuccess: (res) => {
      setError("");
      setSuccess(res.data.message || "Registration successful. Please verify your email.");
      setEmailWarning(
        !res.data.emailSent && res.data.emailErrorMessage
          ? `Verification email could not be sent: ${res.data.emailErrorMessage}`
          : "",
      );
      setVerificationUrl(res.data.verificationUrl || "");
      localStorage.setItem("lastRegisteredEmail", res.data.user.email);
      setForm((current) => ({ ...current, password: "" }));
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Registration failed";
      setError(msg);
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
    setEmailWarning("");
    setVerificationUrl("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailError = getDummyEmailError(form.email);
    if (emailError) {
      setError(emailError);
      setSuccess("");
      setVerificationUrl("");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <AuthLayout
      title="Join SkillSphere"
      subtitle="Connect with hyperlocal talent"
    >
      <Card>
        <Alert type="error" message={visibleError} />
        <Alert type="success" message={success} />
        <Alert type="info" message={emailWarning} />
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
            maxLength={8}
            placeholder="Up to 8 chars, 1 letter, 1 number, 1 special"
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

        {success && (
          <div className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
            <p className="font-semibold">Registration completed</p>
            <p className="mt-1">{success}</p>
            {verificationUrl && (
              <a href={verificationUrl} className="mt-2 block break-all text-cyan-200 underline font-medium">
                Open verification link
              </a>
            )}
            <Link to="/verify-email" state={{ email: form.email }} className="mt-2 inline-block text-cyan-200 underline font-medium">
              Enter verification code
            </Link>
          </div>
        )}

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
