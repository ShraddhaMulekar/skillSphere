import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Alert from "../ui/Alert";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  resendVerification,
} from "../../api/authApi";
import { updateUser } from "../../store/authSlice";

export default function SecuritySettings() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [qrCode, setQrCode] = useState("");
  const [manualEntry, setManualEntry] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const setupMutation = useMutation({
    mutationFn: setup2FA,
    onSuccess: (res) => {
      setQrCode(res.data.qrCode);
      setManualEntry(res.data.manualEntry);
      setMessage("Scan the QR code with Google Authenticator or similar app.");
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
      setQrCode("");
      setCode("");
      setMessage("Two-factor authentication is now enabled.");
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Enable failed");
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2FA({ password, token: code }),
    onSuccess: () => {
      dispatch(updateUser({ twoFactorEnabled: false }));
      setPassword("");
      setCode("");
      setMessage("Two-factor authentication disabled.");
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Disable failed");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (res) => {
      setMessage(res.data.message);
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to send email");
    },
  });

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <h3 className="text-lg font-semibold text-white mb-1">Security</h3>
      <p className="text-slate-400 text-sm mb-4">
        Email verification, 2FA, and account protection
      </p>

      <Alert type="success" message={message} />
      <Alert type="error" message={error} />

      {!user?.isVerified && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-amber-200 text-sm mb-3">
            Your email is not verified. Some features require verification.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
          >
            {resendMutation.isPending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          2FA status:{" "}
          <span className={user?.twoFactorEnabled ? "text-green-400" : "text-slate-500"}>
            {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>

        {!user?.twoFactorEnabled ? (
          <>
            {!qrCode && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? "Preparing..." : "Set up 2FA"}
              </Button>
            )}
            {qrCode && (
              <div className="space-y-4">
                <img
                  src={qrCode}
                  alt="2FA QR code"
                  className="mx-auto w-48 h-48 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-slate-400 break-all text-center">
                  Manual key: {manualEntry}
                </p>
                <Input
                  label="6-digit code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                />
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
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your account password"
            />
            <Input
              label="Current 2FA code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
            />
            <Button
              type="button"
              variant="danger"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
