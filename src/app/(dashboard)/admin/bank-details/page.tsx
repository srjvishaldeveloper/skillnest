"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { saveAdminBankDetail, getAdminBankDetail } from "@/lib/payoutActions";

const AdminBankDetailsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const detail = await getAdminBankDetail();
      if (detail) {
        setUpiId(detail.upiId || "");
        setBankName(detail.bankName || "");
        setAccountNumber(detail.accountNumber || "");
        setIfsc(detail.ifsc || "");
        setAccountHolderName(detail.accountHolderName || "");
      }
      setInitialLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const r = await saveAdminBankDetail({ upiId, bankName, accountNumber, ifsc, accountHolderName });
    setLoading(false);
    if (r.success) {
      toast.success("Bank details saved!");
      router.refresh();
    } else {
      toast.error("Something went wrong");
    }
  };

  if (initialLoading) return <div className="m-4 mt-0 flex-1 rounded-md bg-white p-6">Loading...</div>;

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6">
      <h1 className="text-lg font-semibold">Bank / UPI Details</h1>
      <p className="text-sm text-gray-500">Students will see these details when making a manual payment.</p>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500">UPI ID</label>
            <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. admin@paytm" className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Account Holder Name</label>
            <input type="text" value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder="e.g. John Doe" className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Bank Name</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. State Bank of India" className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Account Number</label>
            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">IFSC Code</label>
            <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="e.g. SBIN0001234" className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full mt-1" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={loading} className="rounded-md bg-skillBlue px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Saving..." : "Save Details"}
        </button>
      </div>
    </div>
  );
};

export default AdminBankDetailsPage;
