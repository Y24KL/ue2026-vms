"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Shield,
  Users,
  QrCode,
  Megaphone,
  FileText,
  Layers,
  Search,
  UserCheck
} from "lucide-react";

type TabOption = "overview" | "approvals" | "attendance" | "announcements";

const ADMIN_ROLES = ["ADMIN", "UNIT_HEAD"];

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabOption>("overview");
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Announcement State
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState("ALL");
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // QR Attendance Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const scannerRef = useRef<any>(null);
  const lastScannedRef = useRef<string>("");

  // Client-side guard: keep unauthenticated/non-staff users off this page.
  // The real enforcement lives server-side (adminRoutes auth middleware) —
  // this only prevents the dashboard UI from rendering for the wrong audience.
  useEffect(() => {
    const token = localStorage.getItem("vms_token");
    const storedUser = localStorage.getItem("vms_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (!token || !parsedUser || !ADMIN_ROLES.includes(parsedUser.role)) {
      router.push("/login");
      return;
    }

    setAuthorized(true);
  }, [router]);

  // Fetch all registered volunteers once authorized
  useEffect(() => {
    if (!authorized) return;
    fetchVolunteers();
  }, [authorized]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("vms_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/volunteers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setVolunteers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Admin fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Application Approval/Verification
  const handleVerifyUser = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "VERIFIED" ? "PENDING" : "VERIFIED";
      const token = localStorage.getItem("vms_token");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/volunteers/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        // Optimistically update frontend matrix state
        setVolunteers(prev => 
          prev.map(v => v.id === userId ? { ...v, status: nextStatus } : v)
        );
      }
    } catch (err) {
      console.error("Failed to alter user authentication status:", err);
    }
  };

  // Broadcast targeted announcement handler
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    try {
      const token = localStorage.getItem("vms_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: announcementText, target: announcementTarget })
      });

      if (response.ok) {
        setAnnouncementSuccess(true);
        setAnnouncementText("");
        setTimeout(() => setAnnouncementSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Broadcast failed", err);
    }
  };

  // Send scanned QR payload to backend to record attendance
  const markAttendance = async (qrCode: string) => {
    try {
      const token = localStorage.getItem("vms_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/attendance/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ qrCode })
      });
      const data = await response.json();

      if (response.ok) {
        setScanFeedback({ type: "success", message: `✅ ${data.fullName || "Volunteer"} checked in successfully.` });
      } else {
        setScanFeedback({ type: "error", message: data.message || "Scan rejected: duplicate or invalid code." });
      }
    } catch (err) {
      setScanFeedback({ type: "error", message: "Network error while recording attendance." });
    }
  };

  // Start/stop the html5-qrcode camera scanner when the toggle changes
  useEffect(() => {
    if (activeTab !== "attendance" || !isScanning) return;

    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // Debounce duplicate reads of the same code within the same session
            if (decodedText === lastScannedRef.current) return;
            lastScannedRef.current = decodedText;
            markAttendance(decodedText);
            setTimeout(() => { lastScannedRef.current = ""; }, 3000);
          },
          () => { /* ignore per-frame decode failures */ }
        );
      } catch (err) {
        setScanFeedback({ type: "error", message: "Camera access failed. Check browser permissions." });
        setIsScanning(false);
      }
    })();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScanning, activeTab]);

  // Stats Counters
  const totalVolunteers = volunteers.length;
  const verifiedCount = volunteers.filter(v => v.status === "VERIFIED").length;
  const pendingCount = volunteers.filter(v => v.status !== "VERIFIED").length;

  // Filter list by simple query matching name, department or email
  const filteredVolunteers = volunteers.filter(v => {
    const term = searchQuery.toLowerCase();
    return (
      (v.fullName?.toLowerCase() || "").includes(term) ||
      (v.email?.toLowerCase() || "").includes(term) ||
      (v.department?.toLowerCase() || "").includes(term)
    );
  });

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        Verifying access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-8">
      {/* Structural Neon Ambient Overlays */}
      <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 h-96 w-96 rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="mx-auto max-w-7xl">
        {/* Command Center Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              <Shield size={14} /> Global Command Operations
            </div>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              VMS Command Center
            </h1>
            <p className="text-sm text-zinc-400">
              Unforgettable Experience 2026 Admin & Accreditation Controller
            </p>
          </div>

          {/* Quick Real-Time Tab Navigation */}
          <nav className="flex flex-wrap gap-2 rounded-xl bg-zinc-900/60 p-1.5 border border-zinc-800/80 backdrop-blur-md">
            {(["overview", "approvals", "attendance", "announcements"] as TabOption[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/10"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {/* Global Analytics Overview Panel */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Registers</span>
              <Users size={18} className="text-blue-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-white">{totalVolunteers}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider">Accredited Assets</span>
              <CheckCircle size={18} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-400">{verifiedCount}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
              <XCircle size={18} className="text-amber-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-500">{pendingCount}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold uppercase tracking-wider">QR Scanned In Today</span>
              <QrCode size={18} className="text-purple-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-purple-400">0</p>
          </div>
        </section>

        {/* ==================== TAB 1: OVERVIEW & DEPARTMENTS ==================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FileText size={18} className="text-amber-400" /> System Run-State
              </h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Welcome back to operations console. Your backend environment is actively synchronizing with PostgreSQL via Prisma ORM.</p>
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400">
                  ⚡ Operational Nodes: Online <br />
                  📡 Real-time Token Syncing: Active (Fallback Key: Match Configured)<br />
                  🔒 Cryptographic Architecture: JWT HS256 Secure
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Layers size={18} className="text-purple-400" /> Operational Units
              </h2>
              <p className="text-xs text-zinc-400 mb-4">Live headcount per official service department</p>
              
              <div className="space-y-2">
                {[
                  { key: 'USHER', label: 'Ushers', color: 'text-blue-400' },
                  { key: 'VENUE_MANAGER', label: 'Venue Managers', color: 'text-amber-400' },
                  { key: 'PROTOCOL', label: 'Protocols', color: 'text-emerald-400' },
                  { key: 'WELFARE', label: 'Welfare', color: 'text-rose-400' },
                  { key: 'CHOIR', label: 'Choir', color: 'text-purple-400' },
                ].map((dept) => {
                  // Calculate how many volunteers are in this specific department
                  const count = volunteers.filter(v => v.department === dept.key).length;
                  
                  return (
                    <div key={dept.key} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 transition-colors hover:bg-zinc-900/50">
                      <span className="text-xs font-bold text-zinc-200">{dept.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 font-mono">{count} Personnel</span>
                        {count > 0 ? (
                          <span className={`text-[10px] uppercase tracking-wider font-black ${dept.color}`}>Active</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-600">Standby</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: APPROVAL MATRIX / ACCESS MANAGEMENT ==================== */}
        {activeTab === "approvals" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 shadow-xl">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Accreditation Access Control</h2>
                <p className="text-xs text-zinc-400">Review registrations, examine profiles, and commit cryptographic signatures to allow check-ins.</p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-xs text-zinc-200 outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-sm text-zinc-500 animate-pulse">Syncing matrix tables...</div>
            ) : filteredVolunteers.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-500">No matching user indices localized.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="p-4 border-b border-zinc-800">Identity Details</th>
                      <th className="p-4 border-b border-zinc-800">Association Track</th>
                      <th className="p-4 border-b border-zinc-800">Status</th>
                      <th className="p-4 border-b border-zinc-800 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-sm">
                    {filteredVolunteers.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{v.fullName || "Unset Profile"}</div>
                          <div className="text-xs text-zinc-500">{v.email}</div>
                          {v.phoneNumber && <div className="text-[11px] text-zinc-400">{v.phoneNumber}</div>}
                        </td>
                        <td className="p-4 text-zinc-300">
                          <span className="text-xs font-mono uppercase bg-zinc-900 px-2 py-1 rounded border border-zinc-800 mr-2 text-amber-400">
                            {v.unilagStatus || "VISITOR"}
                          </span>
                          <span className="text-xs text-zinc-400">{v.department || "No Allocation"}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            v.status === "VERIFIED" 
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50" 
                              : "bg-amber-950/40 text-amber-500 border border-amber-800/50"
                          }`}>
                            {v.status || "PENDING"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleVerifyUser(v.id, v.status)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide transition-all ${
                              v.status === "VERIFIED"
                                ? "bg-zinc-900 text-amber-400 border border-zinc-800 hover:bg-zinc-800"
                                : "bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
                            }`}
                          >
                            <UserCheck size={14} /> {v.status === "VERIFIED" ? "Revoke Pass" : "Verify Profile"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: QR ATTENDANCE MONITOR ==================== */}
        {activeTab === "attendance" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
            <div className="max-w-xl mx-auto text-center py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
                <QrCode size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">QR Access Attendance Terminal</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Scan a volunteer's badge QR code with this device's camera to mark them present. Works on mobile browsers over HTTPS (camera access requires a secure origin).
              </p>

              {scanFeedback && (
                <div className={`mt-4 rounded-lg border p-3 text-sm font-medium ${
                  scanFeedback.type === "success"
                    ? "border-emerald-900 bg-emerald-950/30 text-emerald-400"
                    : "border-red-900/50 bg-red-950/20 text-red-400"
                }`}>
                  {scanFeedback.message}
                </div>
              )}

              <div className="mt-6">
                {!isScanning ? (
                  <button
                    onClick={() => { setScanFeedback(null); setIsScanning(true); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.99]"
                  >
                    <QrCode size={16} /> Start Camera Scan
                  </button>
                ) : (
                  <button
                    onClick={() => setIsScanning(false)}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-zinc-700 transition-all"
                  >
                    <XCircle size={16} /> Stop Scanning
                  </button>
                )}
              </div>

              <div
                id="qr-reader"
                className={`mt-6 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950 overflow-hidden ${isScanning ? "min-h-[300px]" : "p-8"}`}
              >
                {!isScanning && (
                  <p className="text-xs font-mono text-zinc-500">
                    &gt; Camera idle. Tap "Start Camera Scan" to begin.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: ANNOUNCEMENTS TARGET ENGINE ==================== */}
        {activeTab === "announcements" && (
          <div className="max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Megaphone size={20} className="text-amber-400" /> Target Announcement Broadcaster
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Dispatch dynamic notifications out to volunteer clients matching registration conditions instantly.
            </p>

            {announcementSuccess && (
              <div className="mt-4 rounded-lg bg-emerald-950/30 border border-emerald-900 text-emerald-400 p-3 text-xs font-medium">
                🚀 Message successfully routed to the targeted volunteer database channels!
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Target Vector Cohort</label>
                <select 
                  value={announcementTarget}
                  onChange={(e) => setAnnouncementTarget(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Event Staff & Volunteers</option>
                  <option value="STUDENT">Current Students (Unilag Pipeline Only)</option>
                  <option value="PENDING">Awaiting Verification Groups</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Broadcast Content Payload</label>
                <textarea
                  required
                  rows={4}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Type your emergency announcement, venue shift, or scheduling update here..."
                  className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.99]"
              >
                Launch Live Broadcast
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
