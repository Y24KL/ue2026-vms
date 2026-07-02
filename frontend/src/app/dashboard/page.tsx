"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, Calendar, LogOut, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const token = localStorage.getItem("vms_token");
    const storedUser = localStorage.getItem("vms_user");

    if (!token) {
      router.push("/login");
      return; // Stop execution
    } 

    const parsedUser = JSON.parse(storedUser || "{}");
    
    // 🚨 THE GUARD: If they haven't set their full name or department yet, kick them to setup
    if (!parsedUser.fullName || !parsedUser.department) {
      router.push("/profile-setup");
      return;
    }

    setUser(parsedUser);

    // ... your existing countdown logic ...

    // 2. Real-time Countdown Logic (Target: July 10, 2026 @ 4:00 PM GMT+1)
    // 4:00 PM GMT+1 is equivalent to 15:00:00 UTC
    const targetDate = new Date("2026-07-10T15:00:00Z").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-badge") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `UE2026_GatePass_${user?.email || 'volunteer'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">Loading Security Protocols...</div>;

  // Formatting for zero-padding (e.g., 09 instead of 9)
  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, Volunteer</h1>
            <p className="text-zinc-400">{user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          
          {/* Profile Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4 border border-green-500/20">
              <User size={24} />
            </div>
            <h3 className="font-bold text-white">Accreditation Status</h3>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-950/50 px-3 py-1 text-xs font-bold tracking-widest text-green-400 border border-green-900/50">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              VERIFIED
            </span>
          </div>

          {/* Event Card (Real-time) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-white">Event Countdown</h3>
            <div className="mt-3 flex items-center gap-2 text-2xl font-black text-amber-400">
              <div className="flex flex-col items-center"><span className="text-white">{pad(timeLeft.days)}</span><span className="text-[10px] uppercase tracking-wider text-zinc-500">Days</span></div>
              <span className="text-zinc-700 pb-4">:</span>
              <div className="flex flex-col items-center"><span className="text-white">{pad(timeLeft.hours)}</span><span className="text-[10px] uppercase tracking-wider text-zinc-500">Hrs</span></div>
              <span className="text-zinc-700 pb-4">:</span>
              <div className="flex flex-col items-center"><span className="text-white">{pad(timeLeft.minutes)}</span><span className="text-[10px] uppercase tracking-wider text-zinc-500">Min</span></div>
              <span className="text-zinc-700 pb-4">:</span>
              <div className="flex flex-col items-center"><span className="text-amber-500">{pad(timeLeft.seconds)}</span><span className="text-[10px] uppercase tracking-wider text-zinc-500">Sec</span></div>
            </div>
          </div>

          {/* Access Pass Card (QR Download) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 mb-4 border border-purple-500/20">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-white">Digital Pass</h3>
            <button 
              onClick={handleDownloadQR}
              className="mt-3 flex items-center gap-2 rounded-lg bg-purple-600/20 px-4 py-2 text-xs font-bold text-purple-400 transition-all hover:bg-purple-600/30 active:scale-95"
            >
              <Download size={14} /> Download QR Code 
            </button>
            
            {/* Hidden Canvas to generate the QR Code Image */}
            <div className="hidden">
              <QRCodeCanvas
                id="qr-badge"
                value={JSON.stringify({ 
                  id: user.id || "SYS-001",
                  email: user.email, 
                  event: "UE Unilag 2026", 
                  status: "VERIFIED" 
                })}
                size={512}
                bgColor={"#09090b"} // zinc-950
                fgColor={"#d97706"} // amber-600 to match the gold aesthetic
                level={"H"}
                includeMargin={true}
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}