import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowRight, MessageSquare, ShieldCheck, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-55/10 text-indigo-600 border border-indigo-100 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              CivicAI
            </span>
          </div>
          
          {/* Navigation Links & CTA */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/login?role=CITIZEN"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link 
              to="/signup"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow transition-all duration-150 cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center py-20">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-950 leading-tight max-w-4xl">
          Empower and Improve Your City
        </h1>
        <p className="text-lg sm:text-2xl text-slate-600 mt-6 max-w-2xl leading-relaxed">
          Report civic issues instantly, classify incidents with AI model analytics, and connect directly with municipal departments.
        </p>

        {/* Quick Access Portals */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
          <Link
            to="/login?role=CITIZEN"
            className="flex items-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition duration-150 cursor-pointer"
          >
            <span>Citizen Portal</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          <Link
            to="/login?role=ADMIN"
            className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold rounded-xl text-base shadow-sm hover:shadow hover:-translate-y-0.5 transition duration-150 cursor-pointer"
          >
            Admin Dashboard Login
          </Link>
        </div>

        {/* Simple features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mt-20 border-t border-slate-200 pt-12">
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Locate Issues</h4>
              <p className="text-xs text-slate-500">Provide GPS coordinates dynamically</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">NLP Severity Analysis</h4>
              <p className="text-xs text-slate-500">Auto-prioritizes emergency filings</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Verified Dispatch</h4>
              <p className="text-xs text-slate-500">Direct integration with city admin board</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} CivicAI. All rights reserved.</span>
          <div className="flex space-x-4">
            <Link to="/login?role=CITIZEN" className="hover:text-slate-950 transition">Citizen</Link>
            <Link to="/login?role=ADMIN" className="hover:text-slate-955 transition">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
