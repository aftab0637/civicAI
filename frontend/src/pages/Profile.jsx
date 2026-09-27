import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import axios from "axios";

export default function Profile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get("http://localhost:8000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData((prev) => ({
          ...prev,
          name: response.data.name,
          email: response.data.email,
        }));
      } catch (err) {
        console.error(err);
        setError("Failed to load profile details.");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!formData.name) {
      setError("Name cannot be empty.");
      return;
    }

    if (formData.new_password) {
      if (!formData.old_password) {
        setError("Old password is required to set a new password.");
        return;
      }
      if (formData.new_password !== formData.confirm_new_password) {
        setError("New passwords do not match.");
        return;
      }
      if (formData.new_password.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: formData.name,
      };
      if (formData.new_password) {
        payload.old_password = formData.old_password;
        payload.new_password = formData.new_password;
      }

      const response = await axios.put("http://localhost:8000/api/users/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update stored user object in localStorage
      localStorage.setItem("user", JSON.stringify(response.data));

      setSuccess("Profile updated successfully!");
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
        confirm_new_password: "",
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold text-xs">Back to Dashboard</span>
          </Link>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Account Profile
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 mt-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Citizen Settings</h2>
              <p className="text-xs text-slate-550">Update display username or change password.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs shadow-sm">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start space-x-2 text-emerald-700 text-xs shadow-sm">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address (Read Only)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-350">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <hr className="border-slate-100 my-6" />

            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-3">Change Password</h3>

            {/* Old Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  name="old_password"
                  value={formData.old_password}
                  onChange={handleChange}
                  placeholder="Enter old password"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  name="confirm_new_password"
                  value={formData.confirm_new_password}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-650 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 text-xs shadow-sm cursor-pointer"
            >
              {loading ? "Saving Changes..." : "Save Settings"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
