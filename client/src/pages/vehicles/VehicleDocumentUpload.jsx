import { useState } from 'react';
import { Eye, Trash2, Edit2, Upload } from 'lucide-react';
import { useVehicles } from '../../context/VehicleContext';
import Button from '../../components/common/Button';

export default function VehicleDocumentUpload({
  vehicleId,
  documentType,
  existingDoc,
  onRefresh,
}) {
  const {
    uploadVehicleDocument,
    updateVehicleDocument,
    deleteVehicleDocument,
  } = useVehicles();

  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  
const status = existingDoc?.verification_status;
const isApproved = status === "approved";
const isPending = status === "pending";
const isRejected = status === "rejected";


  /* ---------------- UPLOAD / UPDATE ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;


    setLoading(true);
    try {
      if (existingDoc) {
        // ✏️ UPDATE
        await updateVehicleDocument(
  vehicleId,
  existingDoc.document_id,
  { file }
);
      } else {
        // 🆕 UPLOAD
        await uploadVehicleDocument(vehicleId, {
          document_type: documentType,
          file,
        });
      }

      setEditing(false);
      setFile(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- APPROVED: VIEW ONLY ---------------- */
  if (existingDoc && isApproved) {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          window.open(existingDoc.document_url, '_blank')
        }
      >
        <Eye size={14} /> View
      </Button>
    );
  }

  /* ---------------- UPLOADED (NOT APPROVED) ---------------- */
if (existingDoc && isPending && !editing) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            window.open(existingDoc.document_url, '_blank')
          }
        >
          <Eye size={14} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
        >
          <Edit2 size={14} />
        </Button>

        <Button
          size="sm"
          variant="danger"
          onClick={async () => {
            setLoading(true);
            try {
             await deleteVehicleDocument(
  vehicleId,
  existingDoc.document_id
);

              onRefresh();
            } finally {
              setLoading(false);
            }
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    );
  }

  /* ---------------- UPLOAD / EDIT FORM ---------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <input
  type="file"
  required
  accept="image/*,.pdf"
  onChange={(e) =>
    setFile(e.target.files?.[0] || null)
  }
  className="text-sm"
/>


      <Button
        type="submit"
        size="sm"
        disabled={loading}
      >
        <Upload size={14} />
        {existingDoc ? 'ReUpload' : 'Upload'}
      </Button>

     
    </form>
  );
}
