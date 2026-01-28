import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lookupsAPI } from '../../services/lookups';
import { useVehicles } from '../../context/VehicleContext';
import VehicleDocumentUpload from './VehicleDocumentUpload';
import StatusBadge from '../../components/common/StatusBadge';

export default function VehicleDocuments() {
  const { vehicleId } = useParams();
  const {
    getVehicleDocuments,
    deleteVehicleDocument,
  } = useVehicles();

  const [types, setTypes] = useState([]);
  const [docs, setDocs] = useState([]);

  const refresh = async () => {
    setDocs(await getVehicleDocuments(vehicleId));
  };

  useEffect(() => {
    const load = async () => {
      setTypes(await lookupsAPI.getVehicleDocumentTypes());
      await refresh();
    };
    load();
  }, [vehicleId]);

  const findDoc = (code) =>
    docs.find((d) => d.document_type === code);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        Vehicle Documents
      </h1>

      {types.map((t) => {
        const doc = findDoc(t.document_code);

        return (
          <div
            key={t.document_code}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">
                {t.description}
                {t.is_mandatory && (
                  <span className="text-red-500">*</span>
                )}
              </h3>

              {doc ? (
                <StatusBadge
                  status={doc.verification_status}
                  type="approval"
                />
              ) : (
                <p className="text-sm text-amber-600">
                  Not uploaded
                </p>
              )}
            </div>

            <VehicleDocumentUpload
              vehicleId={vehicleId}
              documentType={t.document_code}
              existingDoc={doc}
              onRefresh={refresh}
              onDelete={() =>
                deleteVehicleDocument(doc.document_id)
              }
            />
          </div>
        );
      })}
    </div>
  );
}
