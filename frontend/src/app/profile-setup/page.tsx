"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfileSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [unilagStatus, setUnilagStatus] = useState("STUDENT"); // STUDENT, ALUMNI, VISITOR
  const [department, setDepartment] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle image selection preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🛠️ THE FIX: Reconstructed the complete handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Properly construct the form data
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phoneNumber", phoneNumber);
      formData.append("unilagStatus", unilagStatus);
      formData.append("department", department);
      if (imageFile) {
        formData.append("passportPhoto", imageFile);
      }

      // 2. Check for both token names just in case the login page used the old one
      const token = localStorage.getItem("vms_token") || localStorage.getItem("token");

      if (!token || token === "undefined" || token === "null") {
        setError("Security token missing. Please log in again.");
        setLoading(false);
        return; // Stop the function before it crashes the backend!
      }

      // 3. Send the request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/profile/setup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}` // Now we guarantee this is a real token
        },
        body: formData,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }
  
      // 4. Update the browser memory so the Dashboard lets you in
      const currentUserData = localStorage.getItem("vms_user");
      if (currentUserData) {
        const parsedUser = JSON.parse(currentUserData);
        parsedUser.status = "VERIFIED";
        parsedUser.fullName = fullName;     // Dashboard checks for this!
        parsedUser.department = department; // Dashboard checks for this too!
        
        localStorage.setItem("vms_user", JSON.stringify(parsedUser));
      }
      
      if (data.token) {
        localStorage.setItem("vms_token", data.token); 
      }
  
      // 5. Route smoothly into the dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      {/* Background ambient gold glows */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center">
          <span className="text-xs font-bold tracking-[0.25em] text-amber-400 uppercase">
            Accreditation Portal
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            Volunteer Profile Setup
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Provide your details to generate your digital gate access pass for Unilag 2026.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          
          {/* Interactive Passport Photo Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Passport Photo (White Background Preferred)
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 transition-all hover:border-amber-400/60"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={imagePreview} 
                  alt="Passport preview" 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-2xl text-zinc-500 group-hover:text-amber-400 transition-colors">📷</span>
                  <p className="mt-1 text-xs text-zinc-500 group-hover:text-zinc-400">Upload Photo</p>
                </div>
              )}
              
              {/* Overlay hover effect */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Change Image</p>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden" 
            />
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Full Name (As it should appear on badge)
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Phone Number (WhatsApp Preferred)
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234..."
                className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Unilag Association Status
              </label>
              <select
                value={unilagStatus}
                onChange={(e) => setUnilagStatus(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                <option value="STUDENT">Current Student</option>
                <option value="ALUMNI">Alumni</option>
                <option value="VISITOR">External Partner / Visitor</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Preferred Service Unit
              </label>
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                <option value="" disabled selected>Select an operational unit...</option>
                <option value="USHER">Ushers</option>
                <option value="VENUE_MANAGER">Venue Managers (Operations & Coordination)</option>
                <option value="PROTOCOL">Protocols</option>
                <option value="WELFARE">Welfare</option>
                <option value="CHOIR">Choir</option>
              </select>
            </div>

          </div>

          {/* Golden Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3.5 text-sm font-bold text-zinc-950 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Saving Credentials..." : "Complete Setup & Generate Pass"}
          </button>
        </form>

      </div>
    </div>
  );
}