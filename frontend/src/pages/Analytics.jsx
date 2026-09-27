import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, BarChart3, AlertTriangle, Lightbulb, 
  Map as MapIcon, RefreshCw, Sparkles, TrendingUp
} from "lucide-react";
import axios from "axios";

// Import Recharts components
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, LineChart, Line, CartesianGrid, PieChart, Pie, Cell 
} from "recharts";

// Import Leaflet components dynamically to handle SSR or React 19 safety
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to auto-pan the map to center coordinates
function MapCenterController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Function to generate premium glowing div icons based on ticket metadata
const createMarkerIcon = (status, severity) => {
  let color = "#3b82f6"; // Blue (default)
  if (status === "RESOLVED") {
    color = "#10b981"; // Emerald
  } else if (status === "IN_PROGRESS") {
    color = "#f59e0b"; // Amber
  } else if (severity === "CRITICAL") {
    color = "#ef4444"; // Red
  } else if (severity === "HIGH") {
    color = "#ec4899"; // Pink
  }

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="
      background-color: ${color}; 
      width: 14px; 
      height: 14px; 
      border-radius: 50%; 
      border: 2px solid #ffffff; 
      box-shadow: 0 0 10px ${color}, 0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export default function Analytics() {
  const [complaints, setComplaints] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [forecast, setForecast] = useState({ historical: [], forecast: [] });
  const [riskData, setRiskData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showRiskOverlay, setShowRiskOverlay] = useState(false);
  const [mapCenter, setMapCenter] = useState([12.971598, 77.594562]); // Default center
  
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    const headers = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // 1. Fetch complaints
      const complaintsRes = await axios.get("http://localhost:8000/api/complaints", headers);
      setComplaints(complaintsRes.data);
      
      // Auto-pan map to center of coordinate density if available
      const mappedComplaints = complaintsRes.data.filter(c => c.latitude && c.longitude);
      if (mappedComplaints.length > 0) {
        const avgLat = mappedComplaints.reduce((sum, c) => sum + c.latitude, 0) / mappedComplaints.length;
        const avgLng = mappedComplaints.reduce((sum, c) => sum + c.longitude, 0) / mappedComplaints.length;
        setMapCenter([avgLat, avgLng]);
      }

      // 2. Fetch ML Hotspots
      const hotspotsRes = await axios.get("http://localhost:8000/api/predictions/hotspots", headers);
      setHotspots(hotspotsRes.data);

      // 3. Fetch Forecast Volume
      const forecastRes = await axios.get("http://localhost:8000/api/predictions/forecast", headers);
      setForecast(forecastRes.data);

      // 4. Fetch Disaster Risk Indices
      const riskRes = await axios.get("http://localhost:8000/api/predictions/disaster-risk", headers);
      setRiskData(riskRes.data);

      // 5. Fetch AI Recommendations
      const recommendationsRes = await axios.get("http://localhost:8000/api/predictions/recommendations", headers);
      setRecommendations(recommendationsRes.data);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to load analytic services. Confirm you have Admin clearance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Aggregate Category Chart Data
  const getCategoryChartData = () => {
    const counts = {};
    complaints.forEach((c) => {
      const cat = c.category || "General / Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key.replace(" Management & Sanitation", "").replace(" & Infrastructure", "").replace(" & Lighting", "").replace(" Safety & Hazards", ""),
      value: counts[key]
    }));
  };

  // Aggregate Status Chart Data
  const getStatusChartData = () => {
    const counts = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    complaints.forEach((c) => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return [
      { name: "Pending", value: counts.PENDING, color: "#ef4444" },
      { name: "In Progress", value: counts.IN_PROGRESS, color: "#f59e0b" },
      { name: "Resolved", value: counts.RESOLVED, color: "#10b981" }
    ];
  };

  // Combine Forecast and Historical values for rendering
  const getForecastChartData = () => {
    const data = [];
    forecast.historical.forEach((h) => {
      data.push({
        period: h.date,
        historical: h.count,
        forecast: null
      });
    });
    // Link forecast line nicely to last historical point
    if (forecast.historical.length > 0 && forecast.forecast.length > 0) {
      const lastHist = forecast.historical[forecast.historical.length - 1];
      data.push({
        period: lastHist.date,
        historical: lastHist.count,
        forecast: lastHist.count
      });
    }
    forecast.forecast.forEach((f) => {
      data.push({
        period: f.date,
        historical: null,
        forecast: f.count
      });
    });
    return data;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 border-red-200 text-red-700";
      case "HIGH":
        return "bg-rose-50 border-rose-200 text-rose-700";
      case "MEDIUM":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-xs font-semibold">Generating smart predictions & mapping coordinates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center max-w-md shadow-sm">
          <AlertTriangle className="h-10 w-10 text-rose-650 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Access Restrained</h3>
          <p className="text-rose-650 text-xs mb-6">{error}</p>
          <Link
            to="/admin"
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            Back to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-650" />
                <span className="text-lg font-bold text-slate-900 tracking-tight">Predictive Analytics</span>
              </div>
              <p className="text-xs text-slate-500">AI Forecasting, GIS Mapping & Resource Dispatch Recommendations</p>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-150 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recalculate Models</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Row 1: Map Widget */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <MapIcon className="h-4 w-4 text-indigo-650" />
                <span>Smart GIS Complaint Heatmap</span>
              </h3>
              
              {/* Map overlays controllers */}
              <div className="flex items-center space-x-3 text-xs">
                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHotspots}
                    onChange={(e) => setShowHotspots(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="font-semibold text-slate-650">Accident Hotspots (DBSCAN)</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showRiskOverlay}
                    onChange={(e) => setShowRiskOverlay(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="font-semibold text-slate-650">Disaster Risk Overlay</span>
                </label>
              </div>
            </div>
            
            {/* Map Frame */}
            <div className="flex-1 rounded-lg overflow-hidden border border-slate-200 relative z-10">
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Auto center component */}
                <MapCenterController center={mapCenter} />

                {/* Plot normal complaints */}
                {complaints.filter(c => c.latitude && c.longitude).map(c => (
                  <Marker 
                    key={c.id} 
                    position={[c.latitude, c.longitude]}
                    icon={createMarkerIcon(c.status, c.severity)}
                  >
                    <Popup>
                      <div className="text-xs font-sans space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">#Ticket {c.id}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase">{c.status}</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{c.description.substring(0, 75)}...</p>
                        <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>Class: {c.category || "General"}</span>
                          <Link to={`/complaints/${c.id}`} className="text-indigo-600 hover:underline font-bold">Open Details</Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Draw Accident Hotspots Overlay */}
                {showHotspots && hotspots.map((h, i) => (
                  <Circle
                    key={`hotspot-${i}`}
                    center={[h.center.lat, h.center.lng]}
                    radius={h.count * 150} // Radius scales with incident count
                    pathOptions={{ 
                      color: h.severity === "CRITICAL" ? "#ef4444" : "#ec4899", 
                      fillColor: h.severity === "CRITICAL" ? "#ef4444" : "#ec4899", 
                      fillOpacity: 0.15 
                    }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold text-red-600 flex items-center space-x-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>AI ACCIDENT HOTSPOT ({h.severity})</span>
                        </p>
                        <p className="text-slate-700 mt-1">Found {h.count} public safety complaints grouped within 500 meters.</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

                {/* Draw Disaster Risk Overlay */}
                {showRiskOverlay && riskData.map((r, i) => (
                  <Circle
                    key={`risk-${i}`}
                    center={[r.lat, r.lng]}
                    radius={200}
                    pathOptions={{
                      color: r.risk_score > 0.7 ? "#ef4444" : "#f59e0b",
                      fillColor: r.risk_score > 0.7 ? "#ef4444" : "#f59e0b",
                      fillOpacity: r.risk_score * 0.4
                    }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 uppercase">Risk Index: {(r.risk_score * 100).toFixed(0)}%</p>
                        <p className="text-slate-650 mt-0.5">Type: {r.category}</p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Triggered by: {r.description}</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* AI Decision Recommendations side panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-[520px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-1.5">
                <Lightbulb className="h-4.5 w-4.5 text-indigo-650" />
                <span>AI Dispatch Recommendations</span>
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">Action recommendations generated by predictive heuristics</p>
              
              <div className="space-y-3.5 overflow-y-auto max-h-[360px] pr-1.5">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 shadow-sm hover:shadow transition">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{rec.title}</h4>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">{rec.description}</p>
                    <div className="text-[9px] text-slate-400 font-semibold border-t border-slate-200 pt-1.5 mt-1.5 flex items-center justify-between">
                      <span>Dept: {rec.department.replace(" Management & Sanitation", "").replace(" & Infrastructure", "")}</span>
                      <span className="text-indigo-600 font-bold">Priority dispatch</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 text-[10px] text-slate-400 font-medium justify-center">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span>Decisions backed by linear time forecasting models</span>
            </div>
          </div>
        </section>

        {/* Row 2: Analytics & Charts */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Chart 1: Volume Forecasting */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm md:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-5">
              <TrendingUp className="h-4 w-4 text-indigo-650" />
              <span>Volume Trend & 4-Week ML Projection</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getForecastChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    name="Historical Volume" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    name="AI Forecasted Volume" 
                    stroke="#ec4899" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5" 
                    dot={{ r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-5">
              <BarChart3 className="h-4 w-4 text-indigo-650" />
              <span>Departmental Complaint Load</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCategoryChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="value" name="Active Tickets" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {getCategoryChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#64748b"][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
