import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, MapPin, User, LogOut, ChevronRight, Clock, ShieldAlert } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Fetch User Info
        const userRes = await axios.get("http://localhost:8000/api/users/me", config);
        setUser(userRes.data);
        localStorage.setItem("user", JSON.stringify(userRes.data));

        // Fetch Complaints to populate stats
        const complaintsRes = await axios.get("http://localhost:8000/api/complaints/my", config);
        const complaints = complaintsRes.data;
        const pending = complaints.filter(c => c.status === "PENDING").length;

        setStats({
          total: complaints.length,
          pending: pending,
        });

      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError("Session expired or database error. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 px-4">
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center max-w-sm">
          <p className="text-rose-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header / Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Link to="/" className="p-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </Link>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CivicAI Portal
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {user?.role === "ADMIN" && (
              <Link
                to="/admin"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin Panel</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100 transition text-xs font-semibold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Welcome Banner */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.name || "Citizen"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empower your community. Report civic anomalies and track updates in real-time.
          </p>
        </div>

        {/* Dynamic Metric Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Filed</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{stats.total}</h3>
            </div>
            <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</h3>
            </div>
            <div className="h-9 w-9 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Report an Issue card */}
          <Link
            to="/report"
            className="group p-6 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500/30 rounded-xl transition duration-150 flex flex-col justify-between h-40 shadow-sm"
          >
            <div>
              <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-bold mt-4 text-slate-900 group-hover:text-indigo-600 transition">
                Report an Issue
              </h3>
              <p className="text-xs text-slate-550 mt-1">
                Upload images and report damage, trash or public hazards.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-indigo-650 mt-3 group-hover:translate-x-1 transition-transform">
              <span>Start Report</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </div>
          </Link>

          {/* View complaints card */}
          <Link
            to="/complaints"
            className="group p-6 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500/30 rounded-xl transition duration-150 flex flex-col justify-between h-40 shadow-sm"
          >
            <div>
              <div className="h-9 w-9 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-bold mt-4 text-slate-900 group-hover:text-emerald-600 transition">
                My Complaints
              </h3>
              <p className="text-xs text-slate-550 mt-1">
                Track status updates and history of your submitted files.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-650 mt-3 group-hover:translate-x-1 transition-transform">
              <span>View Submissions</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </div>
          </Link>
        </div>

        {/* Profile Section Box */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-4.5 w-4.5 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Citizen Profile</h3>
            </div>
            <Link to="/profile" className="text-xs font-bold text-indigo-650 hover:text-indigo-700 transition">
              Edit Settings
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-400 block font-semibold uppercase tracking-wider mb-1">User Name</span>
              <span className="text-slate-800 font-semibold">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase tracking-wider mb-1">User Email</span>
              <span className="text-slate-800 font-semibold truncate block">{user?.email}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
