"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  Home,
  Info,
  LogOut,
  QrCode,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { MenuRecord } from "@/lib/menu-types";

type Transaction = {
  id: string;
  date: string;
  invoiceNo: string;
  planName: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
};

type BillingPanelProps = {
  initialBusinessName: string;
  initialMenus: MenuRecord[];
  activePlan: "free" | "monthly" | "yearly";
  endedAt: string | null;
  transactions: Transaction[];
};

type PlanType = "free" | "monthly" | "yearly";

export default function BillingPanel({
  initialBusinessName,
  initialMenus,
  activePlan,
  endedAt,
  transactions,
}: BillingPanelProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(activePlan);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisData, setQrisData] = useState<{
    qr_url: string;
    qr_content: string;
    history_id: string;
    order_id: string;
    amount: number;
  } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const totalMenusCount = initialMenus.length;

  // Plan Details Map
  const plans = {
    free: {
      name: "Free Plan",
      price: "Rp0",
      period: "month",
      pdfLimit: 1,
      scanLimit: 1000,
      scansUsed: 420,
    },
    monthly: {
      name: "Monthly Plan",
      price: "Rp9.000,00",
      period: "month",
      pdfLimit: 5,
      scanLimit: "Unlimited",
      scansUsed: 1240,
    },
    yearly: {
      name: "Yearly Plan",
      price: "Rp99.000,00",
      period: "year",
      pdfLimit: 5,
      scanLimit: "Unlimited",
      scansUsed: 1240,
    },
  };

  const activePlanDetails = plans[activePlan];
  const currentPlanDetails = plans[selectedPlan];

  const handlePlanCheckout = async (plan: PlanType) => {
    if (plan === activePlan) return;
    if (plan === "free") {
      setNotice("Please contact support to cancel or downgrade your active plan.");
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch("/api/qrisly/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate QRIS payment");
      }

      const data = await res.json();
      setQrisData(data);
      setShowQrisModal(true);
    } catch (err: any) {
      console.error(err);
      setNotice(err.message || "An error occurred during payment processing.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!qrisData) return;
    setCheckingPayment(true);
    try {
      const res = await fetch(`/api/qrisly/status?id=${qrisData.history_id}&order_id=${qrisData.order_id}`);
      if (!res.ok) throw new Error("Failed to verify status");
      
      const data = await res.json();
      if (data.success) {
        setNotice("Payment successful! Reloading page...");
        setShowQrisModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert("Payment not detected yet. Please ensure you have scanned and completed the payment.");
      }
    } catch (err) {
      console.error("Status check failed:", err);
      alert("Failed to verify payment. Please try again.");
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleDownloadInvoice = (invoiceNo: string) => {
    alert(`Downloading invoice ${invoiceNo} as PDF (Simulated).`);
  };

  return (
    <>
      {/* Sub content page */}
      <div className="px-4 py-6 md:px-8 md:py-8">
            {notice ? (
              <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-[#cfe1cf] bg-[#eef6ed] px-4 py-3 text-sm font-medium text-[var(--green-dark)] shadow-sm transition-all duration-300">
                <CheckCircle2 size={18} className="shrink-0 text-[var(--green)]" />
                <span>{notice}</span>
              </div>
            ) : null}

            {/* Layout divided into Main Section & Usage Sidebar */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              {/* Left Column: Plans & History */}
              <div className="space-y-6 min-w-0">
                {/* Pricing List */}
                {activePlan === "free" ? (
                  <div className="rounded-[1.75rem] border border-[#e4dbce] bg-white p-6 shadow-[var(--shadow-card)]">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold tracking-tight">Select Subscription Plan</h2>
                      <p className="text-sm text-[#666a61]">
                        Choose the plan that suits your publishing frequency and scan volumes.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Free Card */}
                      <div
                        className="relative flex flex-col justify-between rounded-2xl border p-5 border-[var(--green)] bg-[var(--green-soft)]/20 shadow-sm"
                      >
                        <span className="absolute right-4 top-4 rounded-full bg-[var(--green)] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                          Active Plan
                        </span>
                        <div>
                          <h3 className="font-semibold text-[var(--charcoal)]">Free</h3>
                          <div className="mt-3 flex items-baseline">
                            <span className="text-2xl font-bold tracking-tight">Rp0</span>
                            <span className="ml-1 text-xs text-[#666a61]">/ month</span>
                          </div>
                          <ul className="mt-5 space-y-2 text-xs text-[#5f6673]">
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>1x PDF upload</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>QR Menu</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>1000x QR Scan</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>Owner dashboard</span>
                            </li>
                          </ul>
                        </div>
                        <button
                          onClick={() => handlePlanCheckout("free")}
                          disabled={true}
                          className="mt-6 w-full rounded-xl py-2.5 text-xs font-semibold bg-[var(--green)] text-white cursor-default"
                        >
                          Current Plan
                        </button>
                      </div>

                      {/* Monthly Card */}
                      <div
                        className="relative flex flex-col justify-between rounded-2xl border p-5 border-[#e4dbce] bg-[#fffdf8] hover:border-[#cbd5e1]"
                      >
                        <div>
                          <h3 className="font-semibold text-[var(--charcoal)]">Monthly</h3>
                          <div className="mt-3 flex items-baseline">
                            <span className="text-2xl font-bold tracking-tight">Rp9.000,00</span>
                            <span className="ml-1 text-xs text-[#666a61]">/ month</span>
                          </div>
                          <ul className="mt-5 space-y-2 text-xs text-[#5f6673]">
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>5x PDF upload</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>Unlimited QR Scan</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>Custom QR</span>
                            </li>
                          </ul>
                        </div>
                        <button
                          onClick={() => handlePlanCheckout("monthly")}
                          disabled={loading}
                          className="mt-6 w-full rounded-xl py-2.5 text-xs font-semibold border border-[#d9d0c2] bg-white text-[#4d5149] hover:bg-[#fbf7ef] disabled:opacity-50"
                        >
                          {loading ? "Loading..." : "Choose Monthly"}
                        </button>
                      </div>

                      {/* Yearly Card - Best Value */}
                      <div
                        className="relative flex flex-col justify-between rounded-2xl border-2 p-5 border-[#ded5c7] bg-[#fffdf8] hover:border-[#cbd5e1]"
                      >
                        <span className="absolute -top-2.5 right-4 rounded-full bg-[var(--green)] px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                          Best Value
                        </span>
                        <div>
                          <h3 className="font-semibold text-[var(--charcoal)]">Yearly</h3>
                          <div className="mt-3 flex items-baseline">
                            <span className="text-2xl font-bold tracking-tight">Rp99.000,00</span>
                            <span className="ml-1 text-xs text-[#666a61]">/ year</span>
                          </div>
                          <ul className="mt-5 space-y-2 text-xs text-[#5f6673]">
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>5x PDF upload</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>Unlimited QR Scan</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check size={14} className="text-[var(--green)] shrink-0" />
                              <span>Custom QR</span>
                            </li>
                          </ul>
                        </div>
                        <button
                          onClick={() => handlePlanCheckout("yearly")}
                          disabled={loading}
                          className="mt-6 w-full rounded-xl py-2.5 text-xs font-semibold border border-[#d9d0c2] bg-white text-[#4d5149] hover:bg-[#fbf7ef] disabled:opacity-50"
                        >
                          {loading ? "Loading..." : "Choose Yearly"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-[#cfe1cf] bg-white p-6 shadow-[var(--shadow-card)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--green-soft)] text-[var(--green)]">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-[var(--green-dark)]">
                          Your Active Subscription Plan
                        </h2>
                        <p className="text-sm text-[#555950] mt-1.5">
                          You are currently subscribed to the <b>{activePlan === "monthly" ? "Monthly Plan" : "Yearly Plan"}</b>. Thank you for supporting us!
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-[#eef6ed] border border-[#cfe1cf] px-4 py-2 text-xs font-semibold text-[var(--green-dark)]">
                            <span>Status: Active</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]"></span>
                          </div>
                          {endedAt && (
                            <div className="inline-flex items-center gap-2 rounded-xl bg-[#fbf7ef] border border-[#d9d0c2] px-4 py-2 text-xs font-semibold text-[#555950]">
                              <span>Expired Date: {endedAt}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#777a72] mt-4 leading-relaxed">
                          Self-service upgrades or downgrades are currently disabled. Please contact support if you need to make changes to your plan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}



                {/* History Table */}
                <div className="rounded-[1.75rem] border border-[#e4dbce] bg-[#fffdf8] shadow-[var(--shadow-card)] overflow-hidden">
                  <div className="border-b border-[#e4dbce] p-6">
                    <h2 className="text-xl font-semibold tracking-tight">Transaction History</h2>
                    <p className="text-sm text-[#666a61]">
                      Review recent payments and download invoices for accounting.
                    </p>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center bg-white">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf7ef] text-[#666a61] mb-3">
                        <FileText size={20} />
                      </div>
                      <p className="font-semibold text-sm">No transaction invoices</p>
                      <p className="text-xs text-[#777a72] mt-1 max-w-xs">
                        Free plans do not generate monthly billing statements. Upgrade to a paid plan to see invoice records.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop View (Table) */}
                      <div className="hidden md:block overflow-x-auto bg-white">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#e4dbce] bg-[#fbf7ef]/50 text-xs font-semibold uppercase tracking-wider text-[#777a72]">
                              <th className="px-6 py-4">Billing Date</th>
                              <th className="px-6 py-4">Invoice No</th>
                              <th className="px-6 py-4">Plan Name</th>
                              <th className="px-6 py-4">Paid Amount</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ece4d8] text-[#4d5149]">
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="transition hover:bg-[#fbf7ef]/50">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">{tx.date}</td>
                                <td className="whitespace-nowrap px-6 py-4 text-[#777a72]">{tx.invoiceNo}</td>
                                <td className="whitespace-nowrap px-6 py-4 font-medium">{tx.planName}</td>
                                <td className="whitespace-nowrap px-6 py-4 font-semibold text-[var(--charcoal)]">{tx.amount}</td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe1cf] bg-[#eef6ed] px-2.5 py-0.5 text-xs font-medium text-[var(--green-dark)]">
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      tx.status === "Paid" ? "bg-[var(--green)]" : "bg-yellow-500"
                                    }`}></span>
                                    {tx.status}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                  <button
                                    onClick={() => handleDownloadInvoice(tx.invoiceNo)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9d0c2] bg-white text-[#4d5149] transition hover:-translate-y-0.5 hover:bg-[#fbf7ef] hover:shadow-xs"
                                    title="Download Invoice"
                                  >
                                    <Download size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile View (Horizontal Slide/Carousel of Cards) */}
                      <div className="md:hidden flex gap-4 overflow-x-auto pb-6 pt-2 px-4 snap-x snap-mandatory bg-white scroll-smooth">
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="min-w-[260px] sm:min-w-[300px] snap-center rounded-2xl border border-[#e4dbce] bg-[#fffdf8] p-5 shadow-xs space-y-4 flex flex-col justify-between"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="text-[10px] font-bold text-[#777a72] uppercase tracking-wider">{tx.date}</p>
                                <h4 className="font-bold text-sm text-[var(--charcoal)] mt-1">{tx.planName}</h4>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe1cf] bg-[#eef6ed] px-2.5 py-0.5 text-xs font-medium text-[var(--green-dark)] shrink-0">
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  tx.status === "Paid" ? "bg-[var(--green)]" : "bg-yellow-500"
                                }`}></span>
                                {tx.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#ece4d8] text-xs">
                              <div>
                                <p className="text-[9px] text-[#777a72] uppercase font-bold tracking-wider">Invoice No</p>
                                <p className="font-semibold text-[var(--charcoal)] truncate">{tx.invoiceNo}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-[#777a72] uppercase font-bold tracking-wider">Amount</p>
                                <p className="font-bold text-[var(--charcoal)]">{tx.amount}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownloadInvoice(tx.invoiceNo)}
                              className="mt-2 flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-[#d9d0c2] bg-white text-xs font-semibold text-[#4d5149] transition hover:bg-[#fbf7ef] active:scale-95"
                            >
                              <Download size={14} />
                              Download Invoice
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Sidebar: Plan Usage Panel */}
              <aside className="space-y-5">
                {/* Current Quota Card */}
                <div className="rounded-[1.75rem] border border-[#e4dbce] bg-[#fffdf8] p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-[var(--green)]" size={18} />
                    <h3 className="font-semibold text-sm tracking-tight uppercase text-[#666a61]">Usage Analysis</h3>
                  </div>

                  <div className="mt-4 p-4 rounded-2xl bg-white border border-[#e4dbce]">
                    <div className="text-xs text-[#777a72] font-medium uppercase tracking-wider">Currently Using</div>
                    <div className="text-xl font-bold mt-1 text-[var(--charcoal)]">{activePlanDetails.name}</div>
                    <div className="mt-1 text-xs text-[#666a61]">
                      {activePlan === "free" ? "Base features limit active." : "Pro features unlocked."}
                    </div>
                  </div>

                  {/* Quota Metrics */}
                  <div className="mt-5 space-y-4">
                    {/* Quota 1: PDF Uploaded */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-[#666a61]">PDF Uploads</span>
                        <span className="text-[var(--charcoal)]">
                          {totalMenusCount} <span className="text-[#888c83]">/ {activePlanDetails.pdfLimit}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#f1ebe1] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--green)] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (totalMenusCount / activePlanDetails.pdfLimit) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      {totalMenusCount >= activePlanDetails.pdfLimit && (
                        <p className="mt-1 text-[10px] text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={10} /> Limit reached. Upgrade for more files.
                        </p>
                      )}
                    </div>

                    {/* Quota 3: QR Scans */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-[#666a61]">QR Code Scans</span>
                        <span className="text-[var(--charcoal)]">
                          {activePlanDetails.scansUsed}{" "}
                          <span className="text-[#888c83]">
                            / {typeof activePlanDetails.scanLimit === "number" ? activePlanDetails.scanLimit : "∞"}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#f1ebe1] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--green)] rounded-full transition-all duration-500"
                          style={{
                            width:
                              typeof activePlanDetails.scanLimit === "number"
                                ? `${Math.min(
                                    (activePlanDetails.scansUsed / activePlanDetails.scanLimit) * 100,
                                    100
                                  )}%`
                                : "24%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Period Card */}
                {/* <div className="rounded-[1.75rem] border border-[#e4dbce] bg-[#fffdf8] p-5 shadow-sm">
                  <h3 className="font-semibold text-sm tracking-tight uppercase text-[#666a61]">Billing Period</h3>
                  <div className="mt-4 p-4 rounded-2xl bg-white border border-[#e4dbce] text-xs leading-5 text-[#666a61]">
                    {activePlan === "free" ? (
                      "You are currently on the Free Tier. Upgrades are active immediately."
                    ) : (
                      <p>
                        Expired date:<br />
                        <span className="font-semibold text-[var(--charcoal)]">{endedAt}</span><br />
                        via QRISly gateway.
                      </p>
                    )}
                  </div>
                </div> */}

                {/* Billing Summary notice */}
                <div className="rounded-[1.75rem] border border-[#e4dbce] bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-start gap-2.5 text-xs text-[#5f6673] leading-5">
                    <Info size={16} className="text-[var(--green)] shrink-0 mt-0.5" />
                    <p>
                      Payments are processed securely via QRISly. Once purchased, plans are non-refundable.
                    </p>
                  </div>
                </div>

                {/* Quick Link box */}
                <div className="rounded-[1.75rem] border border-[#e4dbce] bg-[#fffdf8] p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-[var(--charcoal)]">Quick Navigation</h3>
                  <div className="mt-4 space-y-2">
                    <Link
                      href="/dashboard"
                      className="flex min-h-11 items-center gap-2 rounded-2xl border border-[#d9d0c2] bg-white px-4 text-sm font-semibold transition hover:bg-[#fbf7ef]"
                    >
                      <FileCheck2 size={16} />
                      Back to Overview
                    </Link>
                    <Link
                      href="/qr"
                      className="flex min-h-11 items-center gap-2 rounded-2xl border border-[#d9d0c2] bg-white px-4 text-sm font-semibold transition hover:bg-[#fbf7ef]"
                    >
                      <QrCode size={16} />
                      Open QR print studio
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* QRIS Payment Modal */}
          {showQrisModal && qrisData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="relative w-full max-w-md overflow-hidden rounded-[2.25rem] border border-[#e4dbce] bg-[#fffdf8] p-6 shadow-2xl transition-all duration-300">
                {/* Modal Header */}
                <div className="text-center mt-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-soft)] text-[var(--green)] mb-3">
                    <QrCode size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--charcoal)] tracking-tight">QRIS Payment</h3>
                  <p className="text-xs text-[#666a61] mt-1.5 px-4">
                    Scan the QR code below using GoPay, OVO, ShopeePay, Dana, or your Mobile Banking application to pay.
                  </p>
                </div>

                {/* QR Code */}
                <div className="mx-auto my-6 flex flex-col items-center justify-center p-4 rounded-3xl bg-white border border-[#e4dbce] max-w-[240px] shadow-xs animate-scale-up">
                  <img
                    src={qrisData.qr_url}
                    alt="QRIS Code"
                    className="w-full aspect-square object-contain rounded-xl"
                  />
                  <div className="mt-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Dynamic QRIS
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-2xl border border-[#e4dbce] bg-white p-4 space-y-2.5 text-xs text-[#555950]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#777a72]">Plan Selected:</span>
                    <span className="font-semibold text-[var(--charcoal)]">
                      {selectedPlan === "monthly" ? "Monthly Plan" : "Yearly Plan"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#777a72]">Amount:</span>
                    <span className="font-bold text-[var(--green-dark)] text-sm">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(qrisData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#ece4d8] pt-2.5">
                    <span className="text-[#777a72]">Invoice No:</span>
                    <span className="font-mono text-[10px] text-[#4d5149]">{qrisData.order_id}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2.5">
                  <button
                    onClick={handleCheckPayment}
                    disabled={checkingPayment}
                    className="w-full flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--green)] text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--green-dark)] shadow-[0_12px_24px_rgba(66,107,79,0.18)] disabled:opacity-50 cursor-pointer"
                  >
                    {checkingPayment ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying...
                      </span>
                    ) : (
                      "I Have Paid (Saya Sudah Bayar)"
                    )}
                  </button>
                  <button
                    onClick={() => setShowQrisModal(false)}
                    disabled={checkingPayment}
                    className="w-full flex min-h-12 items-center justify-center rounded-2xl border border-[#d9d0c2] bg-white text-sm font-semibold text-[#4d5149] transition hover:bg-[#fbf7ef] disabled:opacity-50 cursor-pointer"
                  >
                    Cancel / Pay Later
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
  );
}
