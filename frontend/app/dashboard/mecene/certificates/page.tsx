"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { certificatesApi } from "@/lib/api";
import { Award, Download, Shield, CheckCircle } from "lucide-react";

const STANDARD_COLORS: Record<string, string> = {
  rebois_internal:    "bg-gray-100 text-gray-700",
  label_bas_carbone:  "bg-blue-100 text-blue-700",
  verra_vcs:          "bg-green-100 text-green-700",
  gold_standard:      "bg-yellow-100 text-yellow-700",
  plan_vivo:          "bg-purple-100 text-purple-700",
};

export default function MeceneCertificatesPage() {
  const [certs,   setCerts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificatesApi.list()
      .then((r) => setCerts(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const totalCO2 = certs.reduce((sum, c) => sum + parseFloat(c.co2_tons_certified || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mes certificats CO₂</h1>
          <p className="text-gray-500 text-sm">Preuve de votre impact environnemental</p>
        </div>

        {/* Total CO2 */}
        <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Award size={24} />
            <span className="font-semibold">Impact total certifié</span>
          </div>
          <div className="text-4xl font-bold">{totalCO2.toFixed(1)} t CO₂</div>
          <div className="text-green-200 text-sm mt-1">séquestrées sur 30 ans via {certs.length} projet(s)</div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : certs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
            <Award size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucun certificat pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Investissez dans un projet pour recevoir vos certificats CO₂</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {certs.map((cert) => (
              <div key={cert.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-green-800 to-emerald-700 p-4 text-white">
                  <div className="text-xs text-green-200 mb-1">N° {cert.serial_number}</div>
                  <div className="font-bold">{cert.project_title}</div>
                  <div className="text-green-200 text-sm">{cert.project_country}</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {cert.co2_tons_certified}t
                  </div>
                  <div className="text-xs text-gray-400 mb-3">CO₂ séquestré</div>

                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Investissement</span>
                      <span className="font-medium">{cert.investment_amount} {cert.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quote-part</span>
                      <span className="font-medium">{cert.co2_share_percent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Surface</span>
                      <span className="font-medium">{cert.surface_hectares} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Période</span>
                      <span className="font-medium">{cert.start_date} → {cert.end_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${STANDARD_COLORS[cert.standard] || "bg-gray-100 text-gray-600"}`}>
                      {cert.standard_display}
                    </span>
                    {cert.pdf_file && (
                      <a href={cert.pdf_file.replace("http://minio:9000", "http://192.168.56.102:9000")}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-700 hover:underline">
                        <Download size={12} />
                        PDF
                      </a>
                    )}
                  </div>

                  {cert.certificate_hash && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                      <Shield size={10} />
                      <span className="truncate font-mono">{cert.certificate_hash.slice(0, 20)}...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
