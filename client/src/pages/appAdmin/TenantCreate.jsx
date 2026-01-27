import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { appAdminAPI } from '../../services/appAdminApi';
import apiClient from '../../services/appAdminApi';

export default function TenantCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Tenant, Step 2: Admin
  const [createdTenantId, setCreatedTenantId] = useState(null);

  const [tenantData, setTenantData] = useState({
    tenant_name: '',
    legal_name: '',
    business_email: '',
    city: '',
    country: '',
    business_registration_number: '',
  });

  const [adminData, setAdminData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });

  const handleTenantChange = (e) => {
    const { name, value } = e.target;
    setTenantData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setError('');

    // Debug log
    console.log('Form Data:', tenantData);

    // Validate required fields
    if (!tenantData.tenant_name || !tenantData.business_email) {
      setError('Business Name and Email are required');
      console.log('Validation failed - tenant_name:', tenantData.tenant_name, 'business_email:', tenantData.business_email);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tenant_name: tenantData.tenant_name,
        legal_name: tenantData.legal_name,
        business_email: tenantData.business_email,
        city: tenantData.city,
        country: tenantData.country,
        business_registration_number: tenantData.business_registration_number,
      };
      console.log('Sending payload:', payload);
      
      const response = await apiClient.post('/app-admin/tenants', payload);
      setCreatedTenantId(response.data.id || response.data.tenant_id);
      setStep(2); // Move to admin creation
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tenant');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');

    if (adminData.password !== adminData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(`/app-admin/tenants/${createdTenantId}/admins`, {
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        email: adminData.email,
        phone: adminData.phone,
        password: adminData.password,
      });
      alert('Tenant and admin created successfully!');
      navigate('/dashboard/tenants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tenant admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">
            {step === 1 ? 'Create New Tenant' : 'Create Tenant Admin'}
          </h1>
          <p className="text-slate-600 mt-2">
            {step === 1
              ? 'Register a new business tenant to the platform'
              : `Create admin account for the tenant (${tenantData.tenant_name})`}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
            step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
            step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            2
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Tenant Creation */}
          {step === 1 && (
            <form onSubmit={handleCreateTenant} className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="tenant_name"
                  value={tenantData.tenant_name}
                  onChange={handleTenantChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter business name"
                />
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Email *
                </label>
                <input
                  type="email"
                  name="business_email"
                  value={tenantData.business_email}
                  onChange={handleTenantChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter business email"
                />
              </div>

              {/* Legal Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Legal Name
                </label>
                <input
                  type="text"
                  name="legal_name"
                  value={tenantData.legal_name}
                  onChange={handleTenantChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter legal name (optional)"
                />
              </div>

              {/* City and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={tenantData.city}
                    onChange={handleTenantChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={tenantData.country}
                    onChange={handleTenantChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter country"
                  />
                </div>
              </div>

              {/* Business Registration Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Registration Number *
                </label>
                <input
                  type="text"
                  name="business_registration_number"
                  value={tenantData.business_registration_number}
                  onChange={handleTenantChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Next: Create Admin'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Admin Creation */}
          {step === 2 && (
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={adminData.first_name}
                  onChange={handleAdminChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={adminData.last_name}
                  onChange={handleAdminChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={adminData.email}
                  onChange={handleAdminChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={adminData.phone}
                  onChange={handleAdminChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={adminData.password}
                  onChange={handleAdminChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={adminData.confirm_password}
                  onChange={handleAdminChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
