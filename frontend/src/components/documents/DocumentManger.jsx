import { useEffect, useState } from "react";
import UploadDocumentModal from "./UploadDocumentModal";

const DocumentManager = ({
  title,
  entityId,
  fetchDocumentTypes,
  fetchDocuments,
  uploadDocument,
  updateDocument,
}) => {
  const [docTypes, setDocTypes] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadFor, setUploadFor] = useState(null);

  const loadData = async () => {
    if (!entityId) return;

    const [typesRes, docsRes] = await Promise.all([
      fetchDocumentTypes(),
      fetchDocuments(entityId),
    ]);

    setDocTypes(typesRes.data);
    setUploadedDocs(docsRes.data);
  };

  useEffect(() => {
    loadData();
  }, [entityId]);

  const uploadedMap = Object.fromEntries(
    uploadedDocs.map((d) => [d.document_type, d])
  );

  const existingDoc = uploadFor
    ? uploadedMap[uploadFor.document_code]
    : null;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <div className="space-y-4">
        {docTypes.map((doc) => {
          const uploaded = uploadedMap[doc.document_code];

          return (
            <div
              key={doc.document_code}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">
                  {doc.document_code}
                  {doc.is_mandatory && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {uploaded && (
                  <a
                    href={uploaded.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    View
                  </a>
                )}

                {uploaded?.verification_status === "pending" && (
                  <>
                    <span className="text-amber-600 text-sm">
                      Under Review
                    </span>
                    <button
                      onClick={() => setUploadFor(doc)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Re-upload
                    </button>
                  </>
                )}

                {!uploaded && (
                  <button
                    onClick={() => setUploadFor(doc)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Upload
                  </button>
                )}

                {uploaded?.verification_status === "approved" && (
                  <span className="text-emerald-600 text-sm">
                    Approved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {uploadFor && (
        <UploadDocumentModal
          entityId={entityId}
          documentType={uploadFor}
          existingDoc={existingDoc}
          uploadDocument={uploadDocument}
          updateDocument={updateDocument}
          onClose={() => setUploadFor(null)}
          onSuccess={() => {
            setUploadFor(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default DocumentManager;
