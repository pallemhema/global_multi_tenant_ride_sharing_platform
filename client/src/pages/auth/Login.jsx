import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { authAPI } from '../../services/adminAuthApi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await authAPI.login(email, password);
      const { access_token } = res.data;

      const ok = login(access_token);
      if (!ok) {
        setError('Invalid token received');
        return;
      }

      // 🔀 Redirect by role (from JWT)
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      if (payload.role === 'app-admin') {
        navigate('/dashboard');
      } else if (payload.role === 'tenant-admin') {
        navigate('/tenant-admin/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Invalid email or password'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <Loader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
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
