import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import AuthLayout from "../components/layout/AuthLayout";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import { verifyEmail, verifyEmailWithCode } from "../api/authApi";

export default function VerifyEmail() {
  const { token } = useParams();
  const authUser = useSelector((state) => state.auth.user);
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Prefill email from logged-in user if available
  useEffect(() => {
    if (authUser?.email) {
      setEmail(authUser.email);
    }
  }, [authUser]);

  // Token Auto-Verification Mutation (GET)
  const tokenMutation = useMutation({
    mutationFn: () => verifyEmail(token),
    onSuccess: (res) => {
      setMessage(res.data.message || "Email verified successfully!");
      setError("");
      navigate("/dashboard"); // go to dashboard after verification
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Verification failed");
      setMessage("");
    },
  });

  // Code Manual Verification Mutation (POST)
  const codeMutation = useMutation({
    mutationFn: (data) => verifyEmailWithCode(data),
    onSuccess: (res) => {
      setMessage(res.data.message || "Email verified successfully!");
      setError("");
      setCode("");
      navigate("/dashboard"); // go to dashboard after manual verification
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Verification failed");
      setMessage("");
    },
  });

  useEffect(() => {
    if (token) {
      tokenMutation.mutate();
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !code) {
      setError("Email and verification code are required");
      return;
    }
    codeMutation.mutate({ email, code });
  };

  return (
    <AuthLayout title="Email Verification" subtitle={token ? "Confirming your account" : "Enter verification details"}>
      <Card>
        {token ? (
          // Link verification view
          <div className="text-center">
            {tokenMutation.isPending && <Loader text="Verifying your email..." />}
            {!tokenMutation.isPending && (
              <>
                <p
                  className={`text-base sm:text-lg mb-4 sm:mb-6 px-1 break-words ${
                    tokenMutation.isSuccess ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {message || error}
                </p>
                <Link to="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          // Code verification view
          <div>
            <Alert type="error" message={error} />
            <Alert type="success" message={message} />
            
            {!codeMutation.isSuccess && (
              <form onSubmit={handleSubmit} className="space-y-4">

                
                <Input
                  label="6-Digit Verification Code"
                  type="text"
                  name="code"
                  value={code}
                  onChange={(e) => {
                    // Only allow numeric input up to 6 digits
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 6) {
                      setCode(val);
                      setError("");
                      setMessage("");
                    }
                  }}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                
                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={codeMutation.isPending}
                >
                  {codeMutation.isPending ? "Verifying..." : "Verify Account"}
                </Button>
              </form>
            )}

            {codeMutation.isSuccess && (
              <div className="text-center mt-4">
                <Link to="/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}
