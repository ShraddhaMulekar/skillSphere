import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Alert from "../ui/Alert";
import {
  setup2FA,
  enable2FA,
  disable2FA,
} from "../../api/authApi";
import { updateUser } from "../../store/authSlice";

export default function SecuritySettings() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isGoogleAccount = user?.authProvider === "google" || !!user?.googleId;

  const setupMutation = useMutation({
    mutationFn: setup2FA,
    onSuccess: (res) => {
      setOtpSent(true);
      setMessage(res.data.message || "A 6-digit code has been sent to your email.");
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Setup failed");
    },
  });

  const enableMutation = useMutation({
    mutationFn: () => enable2FA(code),
    onSuccess: () => {
      dispatch(updateUser({ twoFactorEnabled: true }));
      setOtpSent(false);
      setCode("");
      setMessage("Two-factor authentication is now enabled.");
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Enable failed");
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2FA(isGoogleAccount ? { token: code } : { password, token: code }),
    onSuccess: (res) => {
      if (res.data?.otpSent) {
        setOtpSent(true);
        setMessage(res.data.message || "A disable code was sent to your email.");
        setError("");
        return;
      }
      dispatch(updateUser({ twoFactorEnabled: false }));
      setPassword("");
      setCode("");
      setOtpSent(false);
      setMessage("Two-factor authentication disabled.");
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Disable failed");
    },
  });

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <h3 className="text-lg font-semibold text-white mb-1">Security</h3>
      <p className="text-slate-400 text-sm mb-4">
        Email verification, authenticator-based 2FA, and account protection
      </p>
      <Link to="/forgot-password" className="inline-block mb-4 text-cyan-300 text-sm hover:underline">
        Forgot password?
      </Link>

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          2FA status:{" "}
          <span className={user?.twoFactorEnabled ? "text-green-400" : "text-slate-500"}>
            {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>

        {!user?.twoFactorEnabled ? (
          <>
            {!otpSent && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? "Preparing..." : "Send 2FA code"}
              </Button>
            )}
            {otpSent && (
              <div className="space-y-4">
                <Input
                  label="6-digit code from email"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                />
                <p className="text-xs text-slate-400">
                  Check your email for the 6-digit code. It expires in 10 minutes.
                </p>
                <Button
                  type="button"
                  onClick={() => enableMutation.mutate()}
                  disabled={enableMutation.isPending || code.length !== 6}
                >
                  {enableMutation.isPending ? "Enabling..." : "Enable 2FA"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3 max-w-sm">
            {!isGoogleAccount && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your account password"
              />
            )}
            <Input
              label="6-digit email code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
            />
            <p className="text-xs text-slate-400">
              Click once to send a disable code to your email, then enter the code and click again.
            </p>
            <Button
              type="button"
              variant="danger"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending ? "Processing..." : "Disable 2FA"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
