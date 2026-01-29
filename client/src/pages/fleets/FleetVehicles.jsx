import { useState } from "react";
import { Truck, Plus, Trash2, AlertCircle } from "lucide-react";
import { useFleetOwner } from "../../context/FleetOwnerContext";

export default function FleetVehicles() {
  const { fleetOwner, vehicles, addVehicle, deleteVehicle, loading } =
    useFleetOwner();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    license_plate: "",
    category_code: "",
    model: "",
    manufacture_year: new Date().getFullYear(),
  });
  const [categories] = useState([
    { code: "sedan", label: "Sedan" },
    { code: "hatchback", label: "Hatchback" },
    { code: "suv", label: "SUV" },
    { code: "auto", label: "Auto" },
  ]);

  const handleAddVehicle = async () => {
    if (!formData.license_plate || !formData.category_code || !formData.model) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await addVehicle(formData);
      setFormData({
        license_plate: "",
        category_code: "",
        model: "",
        manufacture_year: new Date().getFullYear(),
      });
      setShowAddForm(false);
      alert("Vehicle added successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  if (!fleetOwner?.is_active) {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <AlertCircle className="text-yellow-600 inline mr-2" />
          <p className="text-yellow-800">
            Please wait for admin approval before adding vehicles.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Add Vehicle Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add Vehicle
          </button>
        </div>

        {/* Add Vehicle Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Add New Vehicle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License Plate *
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) =>
                    setFormData({ ...formData, license_plate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="MH-01-AB-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_code}
                  onChange={(e) =>
                    setFormData({ ...formData, category_code: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Maruti Swift"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manufacture Year *
                </label>
                <input
                  type="number"
                  value={formData.manufacture_year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      manufacture_year: parseInt(e.target.value),
                    })
                  }
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddVehicle}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Add Vehicle
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Vehicles List */}
        <div className="bg-white rounded-lg shadow p-6">
          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No vehicles added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className="border rounded-lg p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Truck className="text-purple-600" size={24} />
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        vehicle.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {vehicle.status?.toUpperCase() || "INACTIVE"}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900">
                    {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicle.license_plate}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-semibold">Year:</span>{" "}
                      {vehicle.manufacture_year}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Category:</span>{" "}
                      {vehicle.category_code}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteVehicle(vehicle.vehicle_id)}
                    className="mt-4 w-full flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
