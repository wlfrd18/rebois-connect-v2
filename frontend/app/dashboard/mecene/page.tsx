"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { proposalsApi, certificatesApi } from "@/lib/api";
import { TreePine, Award, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function MeceneDashboard() {
  const [proposals,    setProposals]    = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      proposalsApi.list({ status: "approved" }),
      certificatesApi.list(),
    ]).then(([p, c]) => {
      setProposals(p.data.results || []);
      setCertificates(c.data.results || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = proposals.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.address_country?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCO2 = certificates.reduce((sum: number, c: any) =>
    sum + parseFloat(c.co2_tons_certified || 0), 0
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
          <p className="text-gray-500 text-sm">Investissez dans des projets de reforestation certifiés</p>
        </div>

        {/* Stats Mécène */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <TreePine size={20} className="text-green-600 mb-2" />
            <div className="text-2xl font-bold">{proposals.length}</div>
            <div className="text-xs text-gray-500">Terrains disponibles</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Award size={20} className="text-yellow-600 mb-2" />
            <div className="text-2xl font-bold">{certificates.length}</div>
            <div className="text-xs text-gray-500">Mes certificats CO₂</div>
          </div>
          <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-xl p-4 text-white">
            <div className="text-xs text-green-200 mb-1">Total CO₂ séquestré</div>
            <div className="text-2xl font-bold">{totalCO2.toFixed(1)}t</div>
            <div className="text-xs text-green-200">sur 30 ans</div>
          </div>
        </div>

        {/* Recherche */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par pays, région..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Terrains */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement de la marketplace...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <TreePine size={40} className="mx-auto text-gray-300 mb-3" />
            <p>Aucun terrain disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="bg-gradient-to-br from-green-800 to-emerald-700 p-4 text-white">
                  <div className="text-lg font-bold">{p.title}</div>
                  <div className="text-green-200 text-sm">{p.address_country}{p.address_region ? `, ${p.address_region}` : ""}</div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{p.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-400">Surface</div>
                      <div className="font-semibold text-gray-700">{p.surface_hectares} ha</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-gray-400">CO₂ estimé</div>
                      <div className="font-semibold text-green-700">{p.co2_estimated_tons || "—"} t</div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/mecene/invest/${p.id}`}
                    className="w-full block text-center bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800 transition"
                  >
                    Investir dans ce projet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
