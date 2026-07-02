"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Bus, Phone, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0514] text-zinc-50 selection:bg-amber-500/30">
      
      {/* 3D Parallax Background Effects */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute -top-[20%] left-[10%] h-[600px] w-[600px] rounded-full bg-purple-900/20 blur-[150px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-amber-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-900/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between py-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <img
              src="/blw-logo.png"
              alt="BLW Campus Ministry"
              className="h-10 w-10 object-contain"
            />
            <span className="font-bold tracking-widest text-zinc-100"></span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-6"
          >
            <Link href="/login" className="text-sm font-semibold tracking-wide text-zinc-300 transition-colors hover:text-white">
              LOGIN
            </Link>
            <Link href="/register" className="rounded-full border border-amber-500/50 bg-amber-500/10 px-6 py-2 text-sm font-semibold tracking-wide text-amber-400 backdrop-blur-md transition-all hover:bg-amber-500 hover:text-[#0a0514]">
              REGISTER
            </Link>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <main className="mt-16 flex flex-col items-center justify-center text-center sm:mt-24">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
            Calling all Volunteers
            </span>
          </motion.div>

          {/* Cinematic 3D Text */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 text-5xl font-black uppercase tracking-tighter sm:text-7xl lg:text-8xl"
          >
            <span className="block text-zinc-100 drop-shadow-2xl">Unforgettable</span>
            <span className="block bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-700 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              Experience
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-2xl text-lg font-medium text-zinc-400 sm:text-xl"
          >
            Join the operational force behind the Unforgettable Experience Unilag 2026. Register now to secure your accreditation, department assignment, and access pass.
          </motion.p>

          {/* Call to Action Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link href="/register" className="group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 px-8 py-4 text-sm font-bold tracking-widest text-[#0a0514] shadow-[0_0_40px_rgba(251,191,36,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(251,191,36,0.6)]">
              <ShieldCheck className="h-5 w-5" />
              JOIN THE VOLUNTEER TEAM
              <div className="absolute inset-0 rounded-xl border-2 border-white/20 transition-all group-hover:border-white/40" />
            </Link>
          </motion.div>

        </main>

        {/* Event Logistics Glassmorphism Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-24 grid grid-cols-1 gap-4 pb-20 sm:grid-cols-3"
        >
          {/* Date & Time */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 text-center backdrop-blur-md">
            <Calendar className="mb-4 h-8 w-8 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Friday 10th July 2026</h3>
            <p className="mt-1 text-xs text-zinc-500">4:00PM GMT +1</p>
          </div>

          {/* Location */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 text-center backdrop-blur-md">
            <MapPin className="mb-4 h-8 w-8 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Unilag Sport Center</h3>
            <p className="mt-1 text-xs text-zinc-500">(Mainbowl Field)</p>
          </div>

          {/* Transport & Contact */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 text-center backdrop-blur-md">
            <Bus className="mb-2 h-6 w-6 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">Free Transportation Buses</h3>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <Phone className="h-3 w-3" />
              <span>+234 08081985717</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}