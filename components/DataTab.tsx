
import React, { useState, useMemo } from 'react';
import { PlantEntry } from '../types';

interface DataTabProps {
  entries: PlantEntry[];
  isOnline: boolean;
  onSyncPending: () => Promise<void>;
}

const ITEMS_PER_PAGE = 5;

export const DataTab: React.FC<DataTabProps> = ({ entries, isOnline, onSyncPending }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount = useMemo(() => entries.filter(e => !e.uploaded).length, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [entries]);

  const latestEntry = sortedEntries[0];
  
  const handleSync = async () => {
    setIsSyncing(true);
    await onSyncPending();
    setIsSyncing(false);
  };

  const paginatedEntries = useMemo(() => {
    return sortedEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [sortedEntries, currentPage]);
  
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      
      {/* Header Section */}
      <div className="flex justify-between items-end px-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-black text-lg text-slate-800 leading-none">Penyimpanan</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entries.length} Entri Tersimpan</span>
            {pendingCount > 0 && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
        </div>
        
        {pendingCount > 0 && (
          <button 
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center gap-2 ${isOnline ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {isSyncing ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>☁️</span>
            )}
            <span>{isSyncing ? 'SYNCING...' : 'SYNC ALL'}</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center text-4xl mx-auto shadow-inner ring-1 ring-slate-100 grayscale opacity-40">📸</div>
          <div>
            <p className="text-slate-800 text-sm font-black uppercase tracking-widest">Belum Ada Data</p>
            <p className="text-slate-400 text-xs font-medium mt-1">Ambil foto untuk mulai memantau.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: Review Foto Terakhir (BESAR & RAPI) */}
          <div className="px-1 group">
            <div className="bg-white p-2 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="relative aspect-[4/3] w-full rounded-[2.5rem] overflow-hidden shadow-inner bg-slate-200">
                <img src={latestEntry.foto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview Terakhir" />
                
                {/* Floating Sync Status Overlay */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                   <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border flex items-center gap-2 shadow-2xl transition-all duration-500 ${latestEntry.uploaded ? 'bg-blue-600/80 border-blue-400/50' : 'bg-amber-500/80 border-amber-400/50'}`}>
                      <div className={`w-2 h-2 rounded-full ${latestEntry.uploaded ? 'bg-blue-200' : 'bg-white animate-pulse'}`} />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                        {latestEntry.uploaded ? 'Sync Cloud' : 'Local Only'}
                      </span>
                   </div>
                   
                   <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xs font-bold">
                     #{latestEntry.noPohon}
                   </div>
                </div>

                {/* Info Detail Glassmorphism Bottom */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${latestEntry.kesehatan === 'Sehat' ? 'bg-green-400' : latestEntry.kesehatan === 'Mati' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                        <h4 className="text-lg font-black text-white leading-none tracking-tight">{latestEntry.tanaman}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-lg uppercase">Tinggi: {latestEntry.tinggi} cm</span>
                         <span className="text-[10px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-lg backdrop-blur-sm uppercase">P: {latestEntry.pengawas}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                       <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{latestEntry.tanggal}</p>
                       <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                          <span className="text-[8px] font-mono text-emerald-400 leading-none">{latestEntry.lokasi}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Riwayat List */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-3">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Riwayat Pengamatan</h4>
              <div className="h-px flex-1 mx-4 bg-slate-100" />
            </div>

            <div className="space-y-3 px-1">
              {paginatedEntries.map(entry => (
                <div key={entry.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex gap-4 items-center group active:scale-[0.98] transition-all relative shadow-sm hover:shadow-md hover:border-blue-100">
                  <div className="relative h-16 w-16 rounded-[1.25rem] overflow-hidden flex-shrink-0 shadow-sm border border-slate-50">
                    <img src={entry.foto} className="h-full w-full object-cover" loading="lazy" />
                    <div className={`absolute inset-x-0 bottom-0 h-1 ${entry.kesehatan === 'Sehat' ? 'bg-green-500' : entry.kesehatan === 'Mati' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-sm text-slate-800 truncate">Pohon #{entry.noPohon}</p>
                      {entry.id === latestEntry.id && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">LATEST</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] bg-slate-100 px-2.5 py-1 rounded-xl text-slate-600 font-black uppercase tracking-tight">{entry.tanaman}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{entry.tinggi} cm</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch py-1">
                    <div 
                      className={`text-[16px] transition-all duration-300 ${entry.uploaded ? 'scale-100 text-blue-500' : 'opacity-30 grayscale'}`}
                    >
                      {entry.uploaded ? '✅' : '💾'} 
                    </div>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 px-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 disabled:opacity-20 active:scale-90 transition-all">←</button>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentPage === i + 1 ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200'}`} />
                  ))}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 disabled:opacity-20 active:scale-90 transition-all">→</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
