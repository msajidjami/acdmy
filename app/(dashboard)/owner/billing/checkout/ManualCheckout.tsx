'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Copy,
  CheckCheck,
  CreditCard,
  Building2,
  Smartphone,
  Check,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Upload,
  X,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  getPlan,
  getPlanPrice,
  formatUSD,
  formatPKR,
  type PlanId,
  type BillingCycle,
} from '@/app/lib/plans';

import {
  PAYMENT_DETAILS,
  type PaymentMethodKey,
} from '@/app/lib/paymentDetails';

interface Props {
  planId: PlanId;
  billingCycle: BillingCycle;
}

type Step = 'method' | 'details' | 'receipt' | 'done';

export default function ManualCheckout({ planId, billingCycle }: Props) {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethodKey>('payoneer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const [txnId, setTxnId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const plan = getPlan(planId);
  if (!plan) return null;

  const price = getPlanPrice(plan, billingCycle);
  const details = PAYMENT_DETAILS[method];
  const isPKR = method !== 'payoneer';
  const amountDisplay = isPKR ? formatPKR(price.pkr) : formatUSD(price.usd);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const handleInitPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscription/manual-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, billingCycle, paymentMethod: method }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setReference(data.reference);
      setSubscriptionId(data.subscriptionId);
      setStep('details');
      toast.success('Ready! Follow the instructions below.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async (file: File) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, or PDF allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/receipt', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Upload failed');
      }

      setReceiptUrl(data.url);
      toast.success('Receipt uploaded');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!txnId.trim()) {
      setError('Transaction ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscription/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId,
          paymentMethod: method,
          transactionId: txnId.trim(),
          receiptUrl,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      setStep('done');
      toast.success('Receipt submitted!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  /* ============ STEP 1 — Choose Method ============ */
  if (step === 'method') {
    const methods: Array<{
      key: PaymentMethodKey;
      name: string;
      desc: string;
      Icon: typeof CreditCard;
      color: string;
      badge?: string;
    }> = [
      {
        key: 'payoneer',
        name: 'Payoneer',
        desc: 'International customers. Card, wallet, or Payoneer-to-Payoneer transfer.',
        Icon: CreditCard,
        color: 'from-orange-500 to-red-600',
        badge: 'International',
      },
      {
        key: 'bank_transfer',
        name: 'Bank Transfer',
        desc: 'Direct bank transfer in PKR. Best for Pakistani customers.',
        Icon: Building2,
        color: 'from-emerald-500 to-teal-600',
        badge: 'Pakistan',
      },
      {
        key: 'jazzcash',
        name: 'JazzCash',
        desc: 'Pay instantly with your JazzCash mobile wallet.',
        Icon: Smartphone,
        color: 'from-rose-500 to-pink-600',
        badge: 'Pakistan',
      },
      {
        key: 'easypaisa',
        name: 'Easypaisa',
        desc: 'Pay instantly with your Easypaisa mobile wallet.',
        Icon: Smartphone,
        color: 'from-emerald-500 to-green-600',
        badge: 'Pakistan',
      },
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
            Amount to Pay
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {amountDisplay}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {plan.name} · {billingCycle}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Choose Payment Method
          </h3>

          <div className="space-y-2">
            {methods.map((m) => {
              const active = method === m.key;
              const Icon = m.Icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setMethod(m.key);
                    setError('');
                  }}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition ${
                    active
                      ? 'border-violet-500 bg-violet-50 shadow-md ring-2 ring-violet-100'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${m.color} text-white shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">
                        {m.name}
                      </p>
                      {m.badge && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            m.badge === 'International'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                  {active && (
                    <Check className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleInitPayment}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25 disabled:opacity-60 transition active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              Continue with {PAYMENT_DETAILS[method].name}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  /* ============ STEP 2 — Details ============ */
  if (step === 'details') {
    const fields: Array<{ label: string; value: string; key: string }> = [];

    if (method === 'payoneer' && 'email' in details) {
      fields.push(
        { label: 'Payoneer Email', value: details.email, key: 'email' },
        {
          label: 'Account Holder',
          value: details.accountHolder,
          key: 'name',
        }
      );
    } else if (method === 'bank_transfer' && 'bankName' in details) {
      fields.push(
        { label: 'Bank Name', value: details.bankName, key: 'bank' },
        {
          label: 'Account Title',
          value: details.accountTitle,
          key: 'title',
        },
        {
          label: 'Account Number',
          value: details.accountNumber,
          key: 'acc',
        },
        { label: 'IBAN', value: details.iban, key: 'iban' }
      );
    } else if (
      (method === 'jazzcash' || method === 'easypaisa') &&
      'number' in details
    ) {
      fields.push(
        { label: 'Wallet Number', value: details.number, key: 'num' },
        {
          label: 'Account Title',
          value: details.accountTitle,
          key: 'title',
        }
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-5">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg">
                Send your payment
              </h3>
              <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                Transfer the amount below, then submit your receipt in the
                next step.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Amount to Send
          </p>
          <p className="text-3xl font-bold text-slate-900">{amountDisplay}</p>
          <p className="text-xs text-slate-500 mt-1">
            {plan.name} · {billingCycle}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Send To
          </p>

          {fields.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {f.label}
                </p>
                <p className="text-sm font-bold text-slate-900 break-all mt-0.5">
                  {f.value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(f.value, f.key)}
                className="shrink-0 h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
              >
                {copied === f.key ? (
                  <CheckCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-600" />
                )}
              </button>
            </div>
          ))}

          <div className="rounded-xl bg-amber-50 border-2 border-amber-300 p-4 mt-2">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Important — Use this Reference
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold font-mono text-amber-900 break-all">
                {reference}
              </p>
              <button
                type="button"
                onClick={() => copyText(reference, 'ref')}
                className="shrink-0 h-9 w-9 rounded-lg bg-white border border-amber-300 flex items-center justify-center hover:bg-amber-50 transition"
              >
                {copied === 'ref' ? (
                  <CheckCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-amber-700" />
                )}
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-2 leading-relaxed">
              Include this reference in your payment note / memo.
            </p>
          </div>
        </div>

        {'instructions' in details && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              Instructions
            </p>
            <ol className="space-y-2.5 text-sm text-slate-700">
              {details.instructions.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          onClick={() => setStep('receipt')}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg transition"
        >
          I&apos;ve Paid — Submit Receipt
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  /* ============ STEP 3 — Receipt ============ */
  if (step === 'receipt') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-md">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Submit Payment Proof
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                We&apos;ll verify your payment within 24 hours.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Reference
              </p>
              <p className="text-sm font-bold font-mono text-slate-900 mt-0.5 break-all">
                {reference}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Transaction ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="e.g., TRX123456789"
                className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Receipt Screenshot
              </label>
              <div className="mt-2">
                {receiptUrl ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-emerald-900">
                        Receipt uploaded
                      </p>
                      <p className="text-xs text-emerald-700 truncate">
                        {receiptUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition">
                    {uploading ? (
                      <>
                        <Loader2 className="h-7 w-7 text-violet-600 animate-spin" />
                        <span className="text-xs text-slate-600 mt-2 font-medium">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                          <Upload className="h-6 w-6 text-slate-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          Click to upload receipt
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          JPG, PNG or PDF · Max 2MB
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadReceipt(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Any additional information..."
                className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep('details')}
            disabled={loading}
            className="flex-1 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmitProof}
            disabled={loading || !txnId.trim()}
            className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Receipt
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ============ STEP 4 — Done ============ */
  return (
    <div className="rounded-3xl bg-white border-2 border-emerald-300 p-6 sm:p-10 text-center">
      <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 relative">
        <Check className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-400 border-4 border-white animate-pulse" />
      </div>

      <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
        Receipt Submitted!
      </h2>

      <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
        Our team will verify your payment within{' '}
        <strong className="text-slate-800">24 hours</strong>. You&apos;ll
        receive an email once your academy is activated.
      </p>

      <div className="mt-6 rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 text-left max-w-md mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Your Reference
        </p>
        <p className="font-mono text-sm text-slate-900 mt-1 break-all">
          {reference}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-1 max-w-md mx-auto">
        <TimelineStep label="Submitted" status="done" />
        <TimelineLine />
        <TimelineStep label="In Review" status="active" />
        <TimelineLine />
        <TimelineStep label="Activated" status="pending" />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <Link
          href="/owner/billing"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Go to Billing
        </Link>
        <Link
          href="/owner/dashboard"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-bold text-slate-700 transition"
        >
          Dashboard
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>Secured · Support: support@quranandislamic.com</span>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  status,
}: {
  label: string;
  status: 'done' | 'active' | 'pending';
}) {
  const styles = {
    done: 'bg-emerald-500 text-white border-emerald-500',
    active: 'bg-amber-100 text-amber-700 border-amber-400 animate-pulse',
    pending: 'bg-white text-slate-400 border-slate-300',
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${styles[status]}`}
      >
        {status === 'active' ? (
          <Clock className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          status === 'active' ? 'text-amber-700' : 'text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function TimelineLine() {
  return (
    <div className="flex-1 h-0.5 bg-slate-200 mb-5 min-w-[30px] max-w-[60px]" />
  );
}