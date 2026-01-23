import { useState } from "react";

const UploadDocumentModal = ({
  entityId,
  documentType,
  existingDoc,
  uploadDocument,
  updateDocument,
  onClose,
  onSuccess,
}) => {
  const [documentNumber, setDocumentNumber] = useState(
    existingDoc?.document_number || ""
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isReplace = Boolean(existingDoc);

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a document file");
      return;
    }

    const formData = new FormData();
    formData.append("document_type", documentType.document_code);
    if (documentNumber) {
      formData.append("document_number", documentNumber);
    }
    formData.append("file", file);

    try {
      setLoading(true);

      if (isReplace) {
        await updateDocument(entityId, existingDoc.document_id, formData);
      } else {
        await uploadDocument(entityId, formData);
      }

      onSuccess();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">
          {isReplace ? "Replace" : "Upload"}{" "}
          {documentType.document_code}
        </h2>

        {error && (
          <div className="text-sm text-red-600 mb-3">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Document number (optional)"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm mb-6"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Uploading…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
