"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CheckSquare, Upload, FileText } from "lucide-react";

export default function StructureDashboard() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord Structure</h1>
          <p className="text-gray-500 text-sm">Gérez vos missions de reforestation</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <CheckSquare size={20} className="text-purple-600 mb-2" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-gray-500">Missions actives</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Upload size={20} className="text-blue-600 mb-2" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-gray-500">Preuves uploadées</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <FileText size={20} className="text-green-600 mb-2" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-gray-500">Contrats signés</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune mission assignée pour le moment</p>
          <p className="text-gray-400 text-sm mt-1">Les missions apparaîtront ici une fois assignées par un Admin</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
