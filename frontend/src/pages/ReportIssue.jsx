import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";
import axios from "axios";

export default function ReportIssue() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }
      setImage(file);
      setError("");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setError("");
      },
      (err) => {
        console.error("Location retrieval failed", err);
        setError("Failed to fetch location. Please enter manually if needed.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description) {
      setError("Please describe the civic issue.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }
    if (latitude) {
      formData.append("latitude", latitude);
    }
    if (longitude) {
      formData.append("longitude", longitude);
    }

    try {
      await axios.post("http://localhost:8000/api/complaints", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Complaint submitted and analyzed by CivicAI successfully!");
      setDescription("");
      setImage(null);
      setImagePreview("");
      setLatitude("");
      setLongitude("");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "An error occurred while submitting the issue. Please try again."
      );
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
            Report Issue
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-extrabold mb-1.5 text-slate-900 tracking-tight">Report Civic Issue</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Upload a photo and describe the problem. CivicAI will automatically classify the category and prioritize it for local departments.
          </p>

          {/* Alert Banners */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-emerald-700 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Description input */}
            <div>
              <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">
                Issue Description *
              </label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError("");
                }}
                placeholder="Describe the issue (e.g. cracked asphalt road with split lanes, garbage overflow next to block 4)..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm resize-none"
                required
              ></textarea>
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">
                Upload Issue Photo (Optional)
              </label>
              
              <div className="relative border border-dashed border-slate-200 hover:border-slate-350 rounded-lg transition duration-150 bg-slate-50/50 p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {imagePreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-44 rounded-lg object-cover border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setImagePreview("");
                      }}
                      className="mt-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 text-slate-400">
                    <Upload className="h-7 w-7 text-indigo-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Click or drag photo here to upload</p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG, WEBP (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location coordinates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-555 uppercase tracking-wider">
                  Location GPS Coordinates (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="flex items-center space-x-1 text-xs font-semibold text-indigo-650 hover:text-indigo-700 transition cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Autofill GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (e.g. 18.4900)"
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (e.g. 73.8180)"
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg active:scale-98 transition transform duration-150 shadow-sm focus:outline-none cursor-pointer text-sm"
            >
              {loading ? "Submitting Report..." : "Submit Complaint"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
