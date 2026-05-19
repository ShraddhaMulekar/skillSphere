import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import AuthLayout from "../components/layout/AuthLayout";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";
import Button from "../components/ui/Button";
import { verifyEmail } from "../api/authApi";

export default function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => verifyEmail(token),
    onSuccess: (res) => {
      setMessage(res.data.message || "Email verified successfully!");
    },
    onError: (err) => {
      setMessage(err.response?.data?.message || "Verification failed");
    },
  });

  useEffect(() => {
    if (token) mutation.mutate();
  }, [token]);

  return (
    <AuthLayout title="Email Verification" subtitle="Confirming your account">
      <Card className="text-center">
        {mutation.isPending && <Loader text="Verifying your email..." />}
        {!mutation.isPending && (
          <>
            <p
              className={`text-base sm:text-lg mb-4 sm:mb-6 px-1 break-words ${mutation.isSuccess ? "text-green-300" : "text-red-300"}`}
            >
              {message}
            </p>
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
