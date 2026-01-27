import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import Loader from '../../components/common/Loader';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Plus, FileWarning } from 'lucide-react';

export default function Vehicles() {
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle } = useVehicles();

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <Button onClick={() => navigate('add')}>
          <Plus size={16} /> Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-slate-600">No vehicles yet</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.vehicle_id}
              className="border rounded-lg p-4 space-y-2 "
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">
                  {v.license_plate}
                </h3>

                <StatusBadge
                  status={v.status}
                  type="approval"
                  className="bg-green-300"
                />
              </div>

              <p className="text-sm text-slate-600">
                {v.model || '—'} • {v.category_code}
              </p>

              {v.status === 'inactive' && (
                <div className="flex gap-1 text-amber-600 text-sm">
                  <FileWarning size={14} />
                  Documents required
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    navigate(`${v.vehicle_id}/documents`)
                  }
                >
                  Documents
                </Button>
{v.status == 'inactive' && (
  <div>
     <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(`${v.vehicle_id}/edit`)
                  }
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    deleteVehicle(v.vehicle_id)
                  }
                >
                  Delete
                </Button>
    </div>
)}
               
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
