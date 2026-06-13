import React, { useEffect, useState } from "react";

type KycAsset = {
  id: string;
  kind: string;
  url: string;
  file_name: string;
  status: string;
};

type KycSubmission = {
  company_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  dot_number: string;
  mc_number: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
};

export default function KycDocsModal({
  userId,
  token,
  onClose,
}: {
  userId: string;
  token: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${userId}/kyc`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.detail || "Failed to load KYC");
        }

        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, token]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-2xl font-bold">
            KYC — {data?.submission?.company_name || ""}
          </h2>

          <button
            className="text-white bg-red-600 px-4 py-2 rounded-xl"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {loading && <div className="text-white">Loading...</div>}

        {error && <div className="text-red-400">{error}</div>}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8 text-white">
              <div>
                <div className="font-bold mb-2">Company</div>
                <div>{data.submission.company_name}</div>
                <div>DOT: {data.submission.dot_number}</div>
                <div>MC: {data.submission.mc_number}</div>
                <div>
                  {data.submission.address1}, {data.submission.city},{" "}
                  {data.submission.state} {data.submission.zip}
                </div>
              </div>

              <div>
                <div className="font-bold mb-2">Owner</div>
                <div>{data.submission.owner_name}</div>
                <div>{data.submission.owner_email}</div>
                <div>{data.submission.owner_phone}</div>
              </div>
            </div>

            <div className="text-white font-bold mb-4">Documents</div>

            <div className="space-y-4">
              {data.assets.map((doc: KycAsset) => (
                <div
                  key={doc.id}
                  className="flex justify-between items-center bg-slate-800 p-4 rounded-xl"
                >
                  <div>
                    <div className="font-bold">{doc.kind}</div>
                    <div className="text-sm text-gray-400">
                      {doc.file_name}
                    </div>
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    className="bg-blue-600 px-4 py-2 rounded-lg text-white"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
