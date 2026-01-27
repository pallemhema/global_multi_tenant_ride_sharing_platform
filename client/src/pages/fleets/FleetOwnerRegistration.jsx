import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import { driverApi } from '../../services/driverApi';

export default function FleetOwnerRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState('tenant-selection');
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    bankAccountName: '',
    bankAccountNumber: '',
    ifscCode: '',
    numberOfVehicles: '',
    gstin: '',
  });

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      try {
        const tenantsList = await driverApi.getActiveTenants();
        setTenants(tenantsList);
      } catch (error) {
        alert('Failed to load tenants: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const handleSelectTenant = (tenantId) => {
    setSelectedTenant(tenantId);
    setStep('form');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Fleet Owner Registration:', { selectedTenant, ...formData });
      setTimeout(() => {
        setLoading(false);
        alert('Fleet owner registration submitted! Waiting for admin approval.');
        navigate('/rider/dashboard');
      }, 1500);
    } catch (error) {
      setLoading(false);
      alert('Registration failed. Please try again.');
    }
  };

  if (step === 'tenant-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/rider/dashboard')} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-semibold">
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register as Fleet Owner</h1>
            <p className="text-gray-600 mb-8">Step 1 of 2: Select the tenant you want to operate your fleet under</p>
            {loading ? <div className="flex justify-center py-12"><Loader className="animate-spin" size={40} /></div> : (
              <div className="space-y-4">
                {tenants.length === 0 ? <p className="text-center text-gray-500 py-8">No active tenants available</p> : tenants.map(tenant => (
                  <button key={tenant.tenant_id} onClick={() => handleSelectTenant(tenant.tenant_id)} disabled={loading} className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50">
                    <h3 className="font-bold text-lg text-gray-900">{tenant.tenant_name}</h3>
                    <p className="text-gray-600 text-sm">{tenant.legal_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setStep('tenant-selection')} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-semibold">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register as Fleet Owner</h1>
          <p className="text-gray-600 mb-8">Step 2 of 2: Complete the form to register your fleet</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500">Company Information</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="ABC Transport" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Registration Number *</label><input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="CIN-XXXX" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="info@company.com" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="+91 9876543210" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN *</label><input type="text" name="gstin" value={formData.gstin} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="29AABCT1234A1Z5" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Vehicles *</label><input type="number" name="numberOfVehicles" value={formData.numberOfVehicles} onChange={handleChange} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="10" /></div></div></div>
            <div className="mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500">Address</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Street *</label><input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Street Address" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Bangalore" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">State *</label><input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Karnataka" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label><input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="560001" /></div></div></div>
            <div className="mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500">Owner</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label><input type="text" name="ownerFirstName" value={formData.ownerFirstName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="John" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label><input type="text" name="ownerLastName" value={formData.ownerLastName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Doe" /></div><div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label><input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="owner@email.com" /></div></div></div>
            <div className="mb-8"><h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500">Bank</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Account Name *</label><input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="ABC Transport" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Account Number *</label><input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="1234567890" /></div><div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">IFSC *</label><input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="SBIN0001234" /></div></div></div>
            <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg"><p className="text-gray-900 font-semibold">Tenant ID: <span className="text-purple-600">{selectedTenant}</span></p></div>
            <div className="flex gap-4"><button type="button" onClick={() => navigate('/rider/dashboard')} className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 disabled:bg-gray-400 flex items-center justify-center gap-2">{loading ? (<><Loader size={20} className="animate-spin" /> Submitting</>) : 'Submit'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
