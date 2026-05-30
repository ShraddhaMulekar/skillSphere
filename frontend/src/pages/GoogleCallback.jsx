import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { getMe } from "../api/authApi";
import Loader from "../components/ui/Loader";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;

    localStorage.setItem("token", token);

    getMe()
      .then((res) => {
        dispatch(setCredentials({ token, user: res.data.user }));
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        setError("Could not load your account. Try signing in again.");
      })
      .finally(() => {
        setResolved(true);
      });
  }, [token, dispatch, navigate]);

  const visibleError = error || (!token ? "Google sign-in failed. No token received." : "");

  if (visibleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 text-center">
        <p className="text-red-300 mb-4">{visibleError}</p>
        <a href="/login" className="text-cyan-300 underline">
          Back to Sign In
        </a>
      </div>
    );
  }

  return token && !resolved && !error ? <Loader text="Completing Google sign-in..." /> : null;
}
