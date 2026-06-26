"use client";
import Image from "next/image";
import Link from "next/link";
import { TreePine, Users, Award, ShieldCheck, ArrowRight, Globe } from "lucide-react";

const STATS = [
  { value: "10K+", label: "Arbres plantés" },
  { value: "500+", label: "Volontaires actifs" },
  { value: "50+",  label: "Projets financés" },
  { value: "25",   label: "Pays couverts" },
];

const FEATURES = [
  { icon: <TreePine size={24} />, title: "Soumettez vos terrains", desc: "Les propriétaires fonciers proposent leurs terres dégradées pour des projets de reforestation supervisés.", step: "1" },
  { icon: <Users size={24} />, title: "Financez des projets", desc: "Les mécènes investissent directement dans des projets vérifiés et reçoivent des certificats CO₂ certifiés.", step: "2" },
  { icon: <Award size={24} />, title: "Certifiez votre impact", desc: "Chaque arbre planté génère des certificats CO₂ traçables, alignés sur les standards Verra et Plan Vivo.", step: "3" },
  { icon: <ShieldCheck size={24} />, title: "Sécurité totale", desc: "Paiements en escrow, audit trail immuable, vérification KYC — votre investissement est protégé.", step: "4" },
];

const ROLES = [
  { role: "Volontaire", emoji: "🌱", desc: "Vous possédez un terrain ? Proposez-le pour la reforestation et contribuez à la restauration des écosystèmes.", cta: "Soumettre un terrain", color: "from-green-700 to-emerald-600" },
  { role: "Mécène", emoji: "💰", desc: "Investissez dans des projets de reforestation vérifiés et compensez votre empreinte carbone.", cta: "Investir maintenant", color: "from-emerald-700 to-teal-600" },
  { role: "Structure", emoji: "🏗️", desc: "ONG, entreprise ou organisme gouvernemental ? Rejoignez notre réseau de reforestation.", cta: "Rejoindre le réseau", color: "from-teal-700 to-green-600" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src="/logo.png" alt="Rebois Connect" width={130} height={48} className="object-contain" />
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#mission" className="hover:text-green-700 transition">Notre mission</a>
            <a href="#comment" className="hover:text-green-700 transition">Comment ça marche</a>
            <a href="#roles" className="hover:text-green-700 transition">Rejoindre</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-green-800 font-medium hover:text-green-600 transition px-4 py-2">
              Se connecter
            </Link>
            <Link href="/register" className="text-sm bg-green-700 text-white px-5 py-2.5 rounded-full hover:bg-green-800 transition font-medium">
              Rejoindre gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80" alt="Forêt vue aérienne" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/75" />
        </div>
        <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-6">
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Rebois Connect" width={200} height={72} className="object-contain brightness-0 invert" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            Reboisez la planète,<br /><span className="text-green-400">ensemble.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-3 max-w-3xl mx-auto leading-relaxed">
            La plateforme qui connecte propriétaires fonciers, mécènes et structures de reforestation pour restaurer les écosystèmes dégradés à travers le monde.
          </p>
          <p className="text-gray-400 mb-10 text-lg">Chaque arbre planté, certifié. Chaque investissement, tracé.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-4 rounded-full text-lg transition flex items-center gap-2 justify-center shadow-lg shadow-green-500/30">
              Commencer maintenant <ArrowRight size={20} />
            </Link>
            <a href="#mission" className="border border-white/40 text-white hover:bg-white/10 font-medium px-8 py-4 rounded-full text-lg transition">
              Découvrir la mission
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 z-10">
          <div className="max-w-3xl mx-auto px-6 grid grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center text-white border border-white/20">
                <div className="text-2xl font-bold text-green-400">{s.value}</div>
                <div className="text-xs text-gray-300 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Globe size={14} /> Notre mission
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Restaurer les forêts dégradées à l'échelle mondiale</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                Rebois Connect est né d'un constat simple : des millions d'hectares de terres dégradées existent partout dans le monde, pendant que des entreprises et des particuliers cherchent à compenser leur empreinte carbone.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Notre plateforme crée le lien manquant entre propriétaires de terres, financeurs et experts en reforestation — pour transformer des terres improductives en forêts certifiées.
              </p>
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center">
                  <Award size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Impact certifié internationalement</div>
                  <div className="text-sm text-gray-500">Standards Verra VCS & Plan Vivo</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80" alt="Reforestation" className="rounded-3xl shadow-2xl w-full h-96 object-cover" />
              <div className="absolute -bottom-6 -left-6 bg-green-700 text-white rounded-2xl p-5 shadow-xl">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-green-200 mt-1">Taux de survie des plantations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">Comment ça marche</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent, certifié</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">De la soumission du terrain à la certification CO₂, chaque étape est vérifiée et traçable.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-700 mb-4">{f.icon}</div>
                <div className="text-xs font-bold text-green-600 mb-2 tracking-wide">ÉTAPE {f.step}</div>
                <h3 className="font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rôles */}
      <section id="roles" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Rejoignez la communauté</h2>
            <p className="text-gray-500 text-lg">Quel que soit votre profil, il y a une place pour vous.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r) => (
              <div key={r.role} className={`bg-gradient-to-br ${r.color} rounded-3xl p-8 text-white hover:scale-[1.02] transition-transform`}>
                <div className="text-5xl mb-5">{r.emoji}</div>
                <h3 className="text-2xl font-bold mb-3">{r.role}</h3>
                <p className="text-white/80 leading-relaxed mb-8 text-sm">{r.desc}</p>
                <Link href="/register" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2.5 rounded-full transition text-sm">
                  {r.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-32 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1920&q=80" alt="Forêt" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-green-900/85" />
        <div className="relative z-10 text-center text-white max-w-3xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-6 leading-tight">Agissez pour la planète aujourd'hui.</h2>
          <p className="text-green-200 text-xl mb-10 leading-relaxed">
            Rejoignez des centaines de volontaires, mécènes et structures qui œuvrent chaque jour pour reverdir notre planète.
          </p>
          <Link href="/register" className="bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-5 rounded-full text-xl transition inline-flex items-center gap-3 shadow-xl shadow-green-900/50">
            Créer mon compte gratuitement <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="Rebois Connect" width={120} height={44} className="object-contain brightness-0 invert opacity-50" />
          <p className="text-sm">© 2026 Rebois Connect. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Confidentialité</a>
            <a href="#" className="hover:text-white transition">CGU</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
