'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  Check,
  X,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Proof {
  _id: string;
  planName: string;
  billingCycle: string;
  amountUSD: number;
  amountPKR: number;
  paymentMethod: string;
  transactionId: string;
  receiptUrl: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  ownerId?: { name?: string; email?: string };
  academyId?: { name?: string; slug?: string };
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminPaymentProofsPage() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-proofs?status=${filter}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setProofs(data.proofs || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProofs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/payment-proofs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          adminNotes: notesById[id] || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(data.message || 'Done');
      await fetchProofs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Payment Proofs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve manual payments
          </p>
        </div>
        <button
          onClick={fetchProofs}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition ${
              filter === f
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="h-10 w-10 text-violet-600 animate-spin mx-auto" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">No {filter} proofs</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proofs.map((p) => (
            <div
              key={p._id}
              className={`rounded-2xl bg-white border-2 overflow-hidden ${
                p.status === 'pending'
                  ? 'border-amber-300'
                  : p.status === 'approved'
                  ? 'border-emerald-300'
                  : 'border-rose-300'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">
                        {p.planName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold uppercase tracking-wider text-slate-600">
                        {p.billingCycle}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          p.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : p.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {p.ownerId?.name || 'Unknown'} · {p.ownerId?.email}
                    </p>
                    <p className="text-xs text-slate-400">
                      Academy: {p.academyId?.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {p.amountUSD > 0 ? `$${p.amountUSD.toFixed(2)}` : `₨${p.amountPKR}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Payment Method
                    </p>
                    <p className="text-sm font-bold text-slate-900 capitalize mt-0.5">
                      {p.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Transaction ID
                    </p>
                    <p className="text-sm font-bold font-mono text-slate-900 mt-0.5 break-all">
                      {p.transactionId}
                    </p>
                  </div>
                </div>

                {p.receiptUrl && (
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 mb-3"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Receipt
                  </a>
                )}

                {p.notes && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 mt-3">
                    <p className="text-xs text-blue-800">
                      <strong>User notes:</strong> {p.notes}
                    </p>
                  </div>
                )}

                {p.status === 'pending' && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={notesById[p._id] || ''}
                      onChange={(e) =>
                        setNotesById((prev) => ({
                          ...prev,
                          [p._id]: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Admin notes (optional)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(p._id, 'approve')}
                        disabled={actionLoading === p._id}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
                      >
                        {actionLoading === p._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(p._id, 'reject')}
                        disabled={actionLoading === p._id}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 disabled:opacity-60"
                      >
                        {actionLoading === p._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </div>
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