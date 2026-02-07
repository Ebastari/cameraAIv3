
import React, { useMemo, useEffect } from 'react';
import { PlantEntry } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';

const HEALTH_COLORS = {
  Sehat: '#10b981',
  Merana: '#f59e0b',
  Mati: '#ef4444'
};

// Fungsi helper untuk mendapatkan URL gambar berkualitas tinggi dari link Google Drive
const getHighResImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url; // Base64 lokal sudah high-res sesuai canvas

  // Ekstrak ID File dari link Google Drive (format: /d/FILE_ID/view atau ?id=FILE_ID)
  const driveIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    // Menggunakan endpoint thumbnail dengan ukuran besar (w800) agar tidak pecah
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
  
  return url;
};

// Komponen Helper untuk memindahkan pusat peta saat data berubah
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 18);
  }, [center, map]);
  return null;
};

export const AnalyticsPanel: React.FC<{ entries: PlantEntry[] }> = ({ entries }) => {
  // Data untuk Grafik Tinggi (Bar Chart) - Ambil 25 data terakhir
  const heightData = useMemo(() => {
    return entries.slice(-25).map(e => ({
      no: `P#${e.noPohon}`,
      tinggi: typeof e.tinggi === 'string' ? parseFloat(e.tinggi) : e.tinggi,
      kesehatan: e.kesehatan
    }));
  }, [entries]);

  // Data Realisasi per Pengawas (Aggregation)
  const supervisorData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      const name = e.pengawas || 'Tanpa Nama';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [entries]);

  const mapCenter = useMemo(() => {
    const valid = entries.filter(e => e.gps && e.gps.lat !== 0);
    if (valid.length === 0) return [-2.979129, 115.199507];
    const last = valid[valid.length - 1];
    return [last.gps!.lat, last.gps!.lon];
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl">📊</div>
        <p className="font-bold text-[10px] uppercase tracking-widest">Menunggu Data Real-time...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* 1. Peta Sebaran Interaktif */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peta Sebaran Real-time</h4>
            <p className="text-[8px] text-blue-500 font-bold uppercase">Klik marker untuk melihat foto HD</p>
          </div>
          <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
            {entries.filter(e => e.gps).length} LOKASI
          </span>
        </div>
        <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl relative z-0">
          <MapContainer center={mapCenter as [number, number]} zoom={18} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapRecenter center={mapCenter as [number, number]} />
            {entries.filter(e => e.gps && e.gps.lat !== 0).map((entry) => (
              <Marker key={entry.id} position={[entry.gps!.lat, entry.gps!.lon]}>
                <Popup className="custom-popup" minWidth={220}>
                  <div className="w-56 overflow-hidden rounded-xl">
                    {entry.foto ? (
                      <div className="relative h-36 w-full bg-slate-100 mb-3 rounded-xl overflow-hidden shadow-inner">
                        <img 
                          src={getHighResImageUrl(entry.foto)} 
                          className="w-full h-full object-cover" 
                          alt="foto pohon"
                          loading="lazy"
                        />
                        {!entry.foto.startsWith('data:') && (
                          <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm text-[7px] text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest shadow-lg">CLOUD HD</div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-slate-50 flex items-center justify-center text-[10px] text-slate-300 font-black mb-3 rounded-xl uppercase">NO IMAGE</div>
                    )}
                    <div className="space-y-1.5 px-1">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-slate-800 uppercase text-[11px]">Pohon #{entry.noPohon}</p>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full text-white shadow-sm ${HEALTH_COLORS[entry.kesehatan as keyof typeof HEALTH_COLORS] || '#ccc'}`}>
                          {String(entry.kesehatan).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-blue-100">{entry.tanaman}</span>
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-slate-100">{entry.tinggi} CM</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                        <p className="text-[8px] text-slate-500 font-black uppercase leading-none">{entry.pengawas}</p>
                        <p className="text-[7px] text-slate-400 font-medium italic">{entry.tanggal}</p>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      {/* 2. Grafik Realisasi per Pengawas */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Realisasi per Pengawas (Total)</h4>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supervisorData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                fontSize={8} 
                fontWeight="black" 
                tickLine={false} 
                axisLine={false}
                stroke="#64748b"
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" name="Jumlah Pohon" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={24}>
                 {supervisorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. Grafik Batang Tinggi Tanaman */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Statistik Tinggi (25 Data Terakhir)</h4>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heightData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="no" 
                fontSize={7} 
                fontWeight="black" 
                tickLine={false} 
                axisLine={false} 
                stroke="#94a3b8"
              />
              <YAxis 
                fontSize={8} 
                fontWeight="bold" 
                tickLine={false} 
                axisLine={false} 
                stroke="#94a3b8"
                unit="cm"
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar dataKey="tinggi" name="Tinggi (cm)" radius={[10, 10, 0, 0]}>
                {heightData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={HEALTH_COLORS[entry.kesehatan as keyof typeof HEALTH_COLORS] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6">
           {Object.entries(HEALTH_COLORS).map(([label, color]) => (
             <div key={label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
             </div>
           ))}
        </div>
      </section>

      <div className="text-center pt-4">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">PT Energi Batubara Lestari • Sistem Monitoring V2</p>
      </div>
    </div>
  );
};
