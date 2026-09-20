import { Lock, Database, Smartphone, Check } from "lucide-react";

export default function LoginSecurityInfo() {
  const items = [
    {
      icon: Lock,
      title: "Data Terpisah Per Email",
      desc: "Setiap email punya data terpisah & terisolasi dengan keamanan RLS database"
    },
    {
      icon: Database,
      title: "Disimpan Server-Side",
      desc: "Data disimpan di cloud server, bukan di device. Aman & selalu tersedia"
    },
    {
      icon: Smartphone,
      title: "Sinkronisasi Multi-Device",
      desc: "Login di HP, laptop, atau tablet — semua data tetap sama & terbaru"
    },
    {
      icon: Check,
      title: "Aman & Terpercaya",
      desc: "Enkripsi end-to-end, RLS security, dan privacy terjamin sepenuhnya"
    }
  ];

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-400/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-semibold">{item.title}</p>
                <p className="text-white/60 text-xs mt-1">{item.desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}