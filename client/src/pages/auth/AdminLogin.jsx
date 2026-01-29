import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { authAPI } from "../../services/adminAuthApi";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await authAPI.login(email, password);
      const { access_token } = res.data;

      const ok = login(access_token);
      if (!ok) {
        setError("Invalid token received");
        setSubmitting(false);
        return;
      }

      // 🔀 Redirect by role (from JWT)
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      console.log("payload: ", payload);
      // Use replace: true to prevent going back to login
      if (payload.role === "app-admin") {
        console.log("app-admin dashboard");
        navigate("/dashboard", { replace: true });
      } else if (payload.role === "tenant-admin") {
        console.log("tenant-admin dashboard");
        navigate("/tenant-admin/dashboard", { replace: true });
      } else {
        setError("Unauthorized role");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Invalid email or password";
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  if (submitting) return <Loader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
            <p className="font-semibold">Login Failed</p>
            <p>{error}</p>
            <p className="text-xs mt-2 text-red-500">
              Make sure you have admin access. Contact your system administrator
              if you don't have an admin account.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
