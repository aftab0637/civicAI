import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Clock, MapPin, AlertCircle, Calendar, Layers, 
  ShieldAlert, FileText, CheckCircle2, Star, Send, MessageSquare 
} from "lucide-react";
import axios from "axios";

export default function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Rating state
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState("");

  const navigate = useNavigate();

  const fetchDetails = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://localhost:8000/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaint(response.data);
      if (response.data.rating) {
        setSelectedRating(response.data.rating);
      }
      if (response.data.feedback) {
        setFeedbackText(response.data.feedback);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load complaint details. It may not exist or you lack permission.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, navigate]);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setIsSubmittingRating(true);
    setRatingSuccess("");
    try {
      const response = await axios.post(
        `http://localhost:8000/api/complaints/${id}/rate`,
        { rating: selectedRating, feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaint(response.data);
      setRatingSuccess("Thank you! Your feedback & rating have been registered.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to submit rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
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
        return "bg-red-550 text-white font-bold";
      case "HIGH":
        return "bg-rose-50 border-rose-200 text-rose-700 font-semibold";
      case "MEDIUM":
        return "bg-slate-100 border-slate-200 text-slate-700 font-semibold";
      default:
        return "bg-slate-50 border-slate-100 text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-xs font-semibold">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 px-4">
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center max-w-md shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-650 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Retrieval Failed</h3>
          <p className="text-rose-650 text-xs mb-6">{error}</p>
          <Link
            to={JSON.parse(localStorage.getItem("user") || "{}").role === "ADMIN" ? "/admin" : "/dashboard"}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg text-xs font-semibold"
          >
            {JSON.parse(localStorage.getItem("user") || "{}").role === "ADMIN" ? "Back to Admin Dashboard" : "Back to Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={isAdmin ? "/admin" : "/complaints"} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold text-xs">
              {isAdmin ? "Back to Admin Dashboard" : "Back to My Complaints"}
            </span>
          </Link>
          <span className="text-sm font-bold text-slate-500">
            Ticket #{complaint.id}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-8 grid md:grid-cols-3 gap-6">
        
        {/* Left Side: Images & Description */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-4">
              Complaint Details
            </h1>
            
            {complaint.image_path ? (
              <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-5 max-h-96">
                <img
                  src={`http://localhost:8000/${complaint.image_path}`}
                  alt="Incident capture"
                  className="w-full h-full object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-150 p-8 text-center text-slate-400 mb-5 text-xs">
                No photo was submitted with this complaint.
              </div>
            )}
            
            <h3 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-slate-800 text-sm leading-relaxed mb-6 whitespace-pre-line">
              {complaint.description}
            </p>

            {/* MANUAL ADDRESS & LOCATION SECTION */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex items-start space-x-2.5 text-xs text-slate-700">
                <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Location / Manual Address:</span>
                  {complaint.address ? (
                    <p className="text-slate-800 font-medium bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                      {complaint.address}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">No manual address entered.</p>
                  )}
                </div>
              </div>

              {complaint.latitude && complaint.longitude && (
                <div className="pl-6 text-[11px] text-slate-500 font-medium">
                  GPS Coordinates: <strong>{complaint.latitude}, {complaint.longitude}</strong>
                  <a
                    href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-indigo-650 hover:underline font-bold"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Citizen Rating & Feedback Card */}
          {complaint.status === "RESOLVED" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2 flex items-center space-x-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Citizen Resolution Feedback & Rating</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Since this complaint has been marked resolved, please rate the resolution quality provided by the city administration.
              </p>

              {ratingSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{ratingSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Rating Score (1 - 5 Stars)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition transform hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= (hoverRating || selectedRating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-slate-700">
                      {selectedRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Feedback Comments
                  </label>
                  <textarea
                    rows="3"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide details on whether the repair was completed satisfactorily..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmittingRating ? "Saving..." : "Submit Rating & Feedback"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Timeline Status History */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Ticket Status Lifecycle</h3>
            
            <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
              {/* Resolved Step */}
              <div className={`relative ${complaint.status === "RESOLVED" ? "opacity-100" : "opacity-40"}`}>
                <div className={`absolute -left-9 top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white ${complaint.status === "RESOLVED" ? "border-emerald-500 text-emerald-500" : "border-slate-300 text-slate-350"}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Resolved</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">The issue has been corrected and the ticket closed.</p>
                  {complaint.status === "RESOLVED" && complaint.admin_notes && (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-150 rounded text-[11px] text-slate-700">
                      <strong>Department Remarks:</strong> {complaint.admin_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* In Progress Step */}
              <div className={`relative ${complaint.status === "IN_PROGRESS" || complaint.status === "RESOLVED" ? "opacity-100" : "opacity-40"}`}>
                <div className={`absolute -left-9 top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white ${complaint.status === "IN_PROGRESS" || complaint.status === "RESOLVED" ? "border-amber-500 text-amber-550" : "border-slate-300 text-slate-350"}`}>
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">In Progress</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ticket has been assigned to a department and work is active.</p>
                  {complaint.assigned_to && (
                    <p className="text-[11px] mt-1 text-slate-700">
                      <strong>Assigned Department:</strong> {complaint.assigned_to}
                    </p>
                  )}
                </div>
              </div>

              {/* Submitted Step */}
              <div className="relative">
                <div className="absolute -left-9 top-0 h-6 w-6 rounded-full border-2 border-indigo-500 text-indigo-600 bg-white flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Submitted</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Complaint received and queued for review.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Filed: {formatDate(complaint.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Metadata / Department info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Metadata</h3>
            
            {/* Status */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </div>

            {/* Rating if existing */}
            {complaint.rating && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Citizen Rating</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= complaint.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1">{complaint.rating}/5</span>
                </div>
              </div>
            )}

            {/* AI Predictions */}
            {complaint.category && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Layers className="h-3 w-3 text-indigo-500" />
                  <span>AI Category Class</span>
                </span>
                <span className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-xs font-semibold text-indigo-700">
                  {complaint.category}
                </span>
              </div>
            )}

            {complaint.severity && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <ShieldAlert className="h-3 w-3 text-indigo-500" />
                  <span>AI Severity Priority</span>
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadgeColor(complaint.severity)}`}>
                  {complaint.severity}
                </span>
              </div>
            )}

            {/* Date */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Submitted Date</span>
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {formatDate(complaint.created_at)}
              </span>
            </div>

            {complaint.updated_at && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>Last Update</span>
                </span>
                <span className="text-xs text-slate-700 font-medium">
                  {formatDate(complaint.updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
