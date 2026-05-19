import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data) => registerUser(data),
    onSuccess: (res) => {
      const { token, user } = res.data;
      if (!token || !user) {
        setError("Invalid response from server");
        return;
      }
      dispatch(setCredentials({ token, user }));
      setSuccess(
        res.data.message || "Account created! Check your email to verify.",
      );
      setTimeout(() => navigate("/dashboard"), 1500);
    },
    onError: (err) => {
      if (!err.response) {
        setError(
          "Cannot reach server. Start backend (npm start) and check VITE_API_URL matches its PORT.",
        );
        return;
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed";
      setError(msg);
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
    <AuthLayout
      title="Join SkillSphere"
      subtitle="Connect with hyperlocal talent"
    >
      <Card>
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>
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
