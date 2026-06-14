"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { proposalsApi } from "@/lib/api";
import { Cloud, Thermometer, Wind, Droplets, Search } from "lucide-react";

const LAND_TYPES = [
  { value: "degraded_forest", label: "Forêt dégradée" },
  { value: "savanna",         label: "Savane" },
  { value: "agricultural",    label: "Terrain agricole abandonné" },
  { value: "bare_land",       label: "Terrain nu" },
  { value: "riparian",        label: "Zone riparienne" },
  { value: "other",           label: "Autre" },
];

export default function NewProposalPage() {
  const router = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cities,    setCities]    = useState<any[]>([]);
  const [weather,   setWeather]   = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [photos,   setPhotos]   = useState<File[]>([]);
  const [ownerDoc, setOwnerDoc] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", land_type: "bare_land",
    surface_hectares: "", latitude: "", longitude: "",
    address_city: "", address_country: "",
  });

  const searchCities = async (q: string) => {
    if (q.length < 2) { setCities([]); return; }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=fr&format=json`
      );
      const data = await res.json();
      setCities(data.results || []);
    } catch {}
  };

  const selectCity = async (city: any) => {
    setCitySearch(`${city.name}, ${city.country}`);
    setCities([]);
    setForm((p) => ({
      ...p,
      latitude:        city.latitude.toFixed(6),
      longitude:       city.longitude.toFixed(6),
      address_city:    city.name,
      address_country: city.country,
    }));
    // Charger la météo
    setWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weathercode&timezone=auto`
      );
      const data = await res.json();
      setWeather(data.current);
    } catch {} finally { setWeatherLoading(false); }
  };

  const getWeatherDesc = (code: number) => {
    if (code === 0) return { label: "Ciel dégagé", icon: "☀️" };
    if (code <= 3)  return { label: "Nuageux", icon: "⛅" };
    if (code <= 67) return { label: "Pluie", icon: "🌧️" };
    if (code <= 77) return { label: "Neige", icon: "❄️" };
    return { label: "Orageux", icon: "⛈️" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.latitude) { setError("Veuillez sélectionner une ville."); return; }
    if (photos.length < 2) {
      setError("Veuillez ajouter au minimum 2 photos du terrain.");
      return;
    }
    if (!ownerDoc) {
      setError("Veuillez joindre un document prouvant votre propriété.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      photos.forEach((p) => data.append("photos", p));
      if (ownerDoc) data.append("ownership_doc", ownerDoc);
      await proposalsApi.create(data);
      router.push("/dashboard/volontaire");
    } catch (e: any) {
      const msg = e.response?.data;
      setError(typeof msg === "object" ? Object.values(msg).flat().join(" ") : "Erreur lors de la soumission.");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Soumettre un terrain</h1>
          <p className="text-gray-500 text-sm">Proposez votre terrain pour un projet de reforestation</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du terrain *</label>
            <input name="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required placeholder="Ex: Terrain Douala Nord"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea name="description" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required rows={4} placeholder="Décrivez votre terrain : état actuel, végétation, accès..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de terrain *</label>
              <select name="land_type" value={form.land_type}
                onChange={(e) => setForm((p) => ({ ...p, land_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {LAND_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surface (hectares) *</label>
              <input name="surface_hectares" value={form.surface_hectares} type="number" step="0.1" min="0.5" required
                onChange={(e) => setForm((p) => ({ ...p, surface_hectares: e.target.value }))}
                placeholder="Ex: 5.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Sélection ville */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville / Localisation *</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={citySearch}
                onChange={(e) => { setCitySearch(e.target.value); searchCities(e.target.value); }}
                placeholder="Tapez le nom de la ville..."
                className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {cities.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {cities.map((city, i) => (
                    <button key={i} type="button" onClick={() => selectCity(city)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition flex items-center justify-between">
                      <span className="font-medium">{city.name}</span>
                      <span className="text-gray-400 text-xs">{city.admin1 ? `${city.admin1}, ` : ""}{city.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Sélectionnez la ville la plus proche de votre terrain</p>
          </div>

          {/* Météo en temps réel */}
          {weatherLoading && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-600 animate-pulse">
              Chargement des données météo...
            </div>
          )}
          {weather && !weatherLoading && (
            <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cloud size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Météo actuelle — {form.address_city}</span>
                <span className="text-lg">{getWeatherDesc(weather.weathercode).icon}</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-2 text-center">
                  <Thermometer size={14} className="mx-auto text-orange-500 mb-1" />
                  <div className="text-sm font-bold text-gray-800">{weather.temperature_2m}°C</div>
                  <div className="text-xs text-gray-400">Température</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <Droplets size={14} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-bold text-gray-800">{weather.relative_humidity_2m}%</div>
                  <div className="text-xs text-gray-400">Humidité</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <Wind size={14} className="mx-auto text-gray-500 mb-1" />
                  <div className="text-sm font-bold text-gray-800">{weather.wind_speed_10m} km/h</div>
                  <div className="text-xs text-gray-400">Vent</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <Cloud size={14} className="mx-auto text-sky-500 mb-1" />
                  <div className="text-sm font-bold text-gray-800">{weather.precipitation} mm</div>
                  <div className="text-xs text-gray-400">Précip.</div>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                {getWeatherDesc(weather.weathercode).label} · Ces données aident à évaluer le potentiel de reforestation
              </p>
            </div>
          )}

          
	  {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

	  {/* Photos du terrain - minimum 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos du terrain * <span className="text-gray-400 font-normal">(minimum 2)</span>
            </label>
            <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-3 cursor-pointer hover:border-green-400 transition">
              <input
                type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setPhotos(files);
                }}
              />
              <span className="text-2xl">📷</span>
              <span className="text-sm text-gray-500">
                {photos.length > 0 ? `${photos.length} photo(s) sélectionnée(s)` : "Cliquez pour ajouter des photos"}
              </span>
            </label>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(p)} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    <span className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded px-1">{i+1}</span>
                  </div>
                ))}
              </div>
            )}
            {photos.length === 1 && (
              <p className="text-orange-500 text-xs mt-1">⚠️ Minimum 2 photos requises</p>
            )}
          </div>

          {/* Document de propriété */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document de propriété * <span className="text-gray-400 font-normal">(titre foncier, acte de vente, certificat coutumier...)</span>
            </label>
            <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-3 cursor-pointer hover:border-green-400 transition">
              <input
                type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => setOwnerDoc(e.target.files?.[0] || null)}
              />
              <span className="text-2xl">📄</span>
              <span className="text-sm text-gray-500">
                {ownerDoc ? ownerDoc.name : "PDF, JPG ou PNG — Max 5MB"}
              </span>
            </label>
            {ownerDoc && (
              <p className="text-green-600 text-xs mt-1">✓ {ownerDoc.name} prêt à l'envoi</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800 transition disabled:opacity-50">
              {loading ? "Soumission..." : "Soumettre le terrain"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
