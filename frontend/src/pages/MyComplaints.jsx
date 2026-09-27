import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:8000/api/complaints/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch complaints list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [navigate]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-50 border-red-200 text-red-700";
      case "HIGH":
        return "bg-rose-50 border-rose-200 text-rose-700";
      case "MEDIUM":
        return "bg-slate-100 border-slate-200 text-slate-700";
      default:
        return "bg-slate-50 border-slate-100 text-slate-400";
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
            My Complaints
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Submitted Complaints</h2>
          <button
            onClick={fetchComplaints}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-700 text-xs font-semibold shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-xs font-semibold">Fetching complaints list...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <p className="text-rose-650 text-sm mb-4">{error}</p>
            <button
              onClick={fetchComplaints}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No complaints reported</h3>
            <p className="text-xs text-slate-500 mb-6">You haven't submitted any civic issue reports yet.</p>
            <Link
              to="/report"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg font-semibold text-xs shadow-sm transition"
            >
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-350 transition duration-200 shadow-sm"
              >
                <div className="p-6 flex flex-col md:flex-row md:space-x-6">
                  {/* Photo Section */}
                  {complaint.image_path && (
                    <div className="w-full md:w-48 h-48 md:h-auto shrink-0 mb-4 md:mb-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={`http://localhost:8000/${complaint.image_path}`}
                        alt="Issue report"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Details Section */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Row: ID & Status */}
                      <div className="flex items-center justify-between mb-2">
                        <Link to={`/complaints/${complaint.id}`} className="text-xs font-bold text-indigo-650 hover:underline">
                          ID: #{complaint.id} (View Status Timeline)
                        </Link>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {complaint.status}
                        </span>
                      </div>

                      {/* ML Predictions Row */}
                      {(complaint.category || complaint.severity) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {complaint.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                              AI Class: {complaint.category}
                            </span>
                          )}
                          {complaint.severity && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadgeColor(complaint.severity)}`}>
                              AI Severity: {complaint.severity}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-slate-800 text-sm leading-relaxed mb-4">
                        {complaint.description}
                      </p>

                      {/* Admin Remarks Section */}
                      {(complaint.assigned_to || complaint.admin_notes) && (
                        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 shadow-inner">
                          {complaint.assigned_to && (
                            <div className="text-slate-700 flex items-center space-x-1">
                              <span className="font-semibold text-slate-550">Assigned To:</span>
                              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-medium">
                                {complaint.assigned_to}
                              </span>
                            </div>
                          )}
                          {complaint.admin_notes && (
                            <p className="text-slate-700 leading-relaxed">
                              <span className="font-semibold text-slate-550">Resolution Update:</span> {complaint.admin_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400 font-medium">
                      <span>Submitted: {formatDate(complaint.created_at)}</span>
                      
                      {complaint.latitude && complaint.longitude ? (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {complaint.latitude}, {complaint.longitude}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-350 italic">No GPS coordinates</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
