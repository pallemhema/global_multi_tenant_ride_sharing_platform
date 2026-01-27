import { useEffect, useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { userAuthApi } from '../../services/userAuthApi';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    fullname: '',
    date_of_birth: '',
    gender: '',
    preferred_language: '',
  });

  /* -------------------------------
     FETCH USER PROFILE
  -------------------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await userAuthApi.getUserProfile();
        setProfile(data);

        if (data) {
          // profile exists → edit/view mode
          setFormData({
            fullname: data.full_name || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            preferred_language: data.preferred_language || '',
          });
          setIsEditing(false);
        } else {
          // profile missing → create mode
          setIsEditing(true);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showForm = isEditing || !profile;

  /* -------------------------------
     HANDLERS
  -------------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        full_name: formData.fullname,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        preferred_language: formData.preferred_language || null,
      };

      if (profile) {
        // UPDATE
        await userAuthApi.editUserProfile(payload);
      } else {
        // CREATE
        await userAuthApi.createUserProfile(payload);
      }

      const data = await userAuthApi.getUserProfile();
      setProfile(data);
      setIsEditing(false);
      setSuccess('Profile saved successfully');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  /* -------------------------------
     RENDER
  -------------------------------- */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Profile</h1>

      {error && (
        <div className="bg-red-50 border p-3 rounded flex gap-2">
          <AlertCircle className="text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border p-3 rounded text-green-700">
          {success}
        </div>
      )}

      {showForm ? (
        /* CREATE / EDIT FORM */
        <form onSubmit={handleSave} className="bg-white border p-5 space-y-4">
          <input
            name="fullname"
            placeholder="Full Name"
            value={formData.fullname}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="preferred_language"
            placeholder="Preferred Language (en / hi / te)"
            value={formData.preferred_language}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <button
            type="submit"
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded"
          >
            <Save size={16} /> Save
          </button>
        </form>
      ) : (
        /* VIEW MODE */
        <div className="bg-white border p-5 grid grid-cols-2 gap-4">
          <p><strong>Full Name:</strong> {profile.full_name}</p>
          <p><strong>Gender:</strong> {profile.gender || '-'}</p>
          <p><strong>DOB:</strong> {profile.date_of_birth || '-'}</p>
          <p><strong>Language:</strong> {profile.preferred_language || '-'}</p>

          <button
            onClick={() => setIsEditing(true)}
            className="col-span-2 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}
