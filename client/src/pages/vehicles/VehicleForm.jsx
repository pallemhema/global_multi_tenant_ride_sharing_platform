import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lookupsAPI } from '../../services/lookups';
import { useVehicles } from '../../context/VehicleContext';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

export default function VehicleForm() {
  const { vehicleId } = useParams();
  const isEdit = Boolean(vehicleId);
  const navigate = useNavigate();

  const { vehicles, createVehicle, updateVehicle } =
    useVehicles();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    license_plate: '',
    category_code: '',
    model: '',
    manufacture_year: new Date().getFullYear(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setCategories(
        await lookupsAPI.getVehicleCategories()
      );

      if (isEdit) {
        const v = vehicles.find(
          (x) => x.vehicle_id === Number(vehicleId)
        );
        if (v) {
          setForm({
            license_plate: v.license_plate,
            category_code: v.category_code,
            model: v.model || '',
            manufacture_year: v.manufacture_year || '',
          });
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateVehicle(vehicleId, form);
      navigate('..');
    } else {
      const v = await createVehicle(form);
      navigate(`../${v.vehicle_id}/documents`);
    }
  };

  if (loading) return <Loader />;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto space-y-4 bg-white p-6 border rounded-lg"
    >
      <h1 className="text-2xl font-bold">
        {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      </h1>

      <input
        required
        placeholder="License Plate"
        value={form.license_plate}
        onChange={(e) =>
          setForm({
            ...form,
            license_plate: e.target.value,
          })
        }
        className="w-full border rounded px-3 py-2"
      />

      <select
        required
        value={form.category_code}
        onChange={(e) =>
          setForm({
            ...form,
            category_code: e.target.value,
          })
        }
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select category</option>
        {categories.map((c) => (
          <option
            key={c.category_code}
            value={c.category_code}
          >
            {c.category_name}
          </option>
        ))}
      </select>

      <input
        placeholder="Model"
        value={form.model}
        onChange={(e) =>
          setForm({ ...form, model: e.target.value })
        }
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        value={form.manufacture_year}
        onChange={(e) =>
          setForm({
            ...form,
            manufacture_year: e.target.value,
          })
        }
        className="w-full border rounded px-3 py-2"
      />

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
