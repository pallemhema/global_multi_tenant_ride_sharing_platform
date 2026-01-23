export const REQUIRED_TENANT_DOCS = [
  "company_registration",
  "gst_certificate",
  "bank_account",
];

export const isTenantVerified = (documents) => {
  if (!documents || documents.length === 0) return false;

  return REQUIRED_TENANT_DOCS.every((type) =>
    documents.some(
      (doc) =>
        doc.document_type === type &&
        doc.verification_status === "approved"
    )
  );
};
