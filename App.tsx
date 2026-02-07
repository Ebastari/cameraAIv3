
import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { BottomSheet } from './components/BottomSheet';
import { useLocalStorage } from './hooks/useLocalStorage';
import { writeExifData } from './services/exifService';
import { uploadToAppsScript } from './services/uploadService';
import { watchGpsLocation } from './services/gpsService';
import { PlantEntry, GpsLocation, ToastState, FormState } from './types';
import { Toast } from './components/Toast';

const App: React.FC = () => {
  const [entries, setEntries] = useLocalStorage<PlantEntry[]>('monitoringData', []);
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Menggunakan useLocalStorage agar form (Pengawas, Vendor, dll) tidak hilang saat reload
  const [formState, setFormState] = useLocalStorage<FormState>('formState', {
    tinggi: 10,
    tahunTanam: new Date().getFullYear(),
    jenis: 'Sengon',
    pekerjaan: '',
    pengawas: '',
    vendor: '',
    tim: '',
    kesehatan: 'Sehat',
  });

  const [gps, setGps] = useState<GpsLocation | null>(null);
  
  // Update URL Apps Script sesuai link yang diberikan user
  const [appsScriptUrl, setAppsScriptUrl] = useLocalStorage<string>(
    'appsScriptUrl', 
    'https://script.google.com/macros/s/AKfycbz_lxW9C6HYzFLlrJmY9PuQNDKx1UUwjdKsdpVs8rtWgJxFcAmFg-MIYRT5zlkjH5aoDQ/exec'
  );

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi Terhubung', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Mode Offline Aktif', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let watchId: number;
    try {
      watchId = watchGpsLocation(
        (location) => setGps(location),
        (error) => console.error("GPS Error:", error)
      );
    } catch (e) {
      console.error("GPS Geolocation not available");
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const syncPendingEntries = useCallback(async () => {
    const pending = entries.filter(e => !e.uploaded);
    if (pending.length === 0) {
      showToast('Semua data sudah tersinkronisasi', 'success');
      return;
    }

    if (!navigator.onLine) {
      showToast('Tidak ada internet untuk sinkronisasi', 'error');
      return;
    }

    showToast(`Sinkronisasi ${pending.length} data...`, 'info');
    
    let successCount = 0;
    const updatedEntries = [...entries];

    for (const entry of pending) {
      try {
        await uploadToAppsScript(appsScriptUrl, entry);
        const index = updatedEntries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          updatedEntries[index] = { ...updatedEntries[index], uploaded: true };
          successCount++;
        }
      } catch (error) {
        console.error(`Gagal upload entri ${entry.id}:`, error);
      }
    }

    setEntries(updatedEntries);
    if (successCount > 0) {
      showToast(`${successCount} data berhasil diunggah`, 'success');
    } else {
      showToast('Gagal sinkronisasi data', 'error');
    }
  }, [entries, appsScriptUrl, setEntries, showToast]);

  const handleCapture = useCallback(async (dataUrl: string) => {
    const timestamp = new Date();
    
    // PEMBARUAN: Menambahkan milidetik (3 digit) untuk menjamin keunikan ID
    const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');
    const id = `${timestamp.getFullYear()}${pad(timestamp.getMonth() + 1)}${pad(timestamp.getDate())}-${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}${pad(timestamp.getMilliseconds(), 3)}`;

    const lat = gps ? gps.lat : 0;
    const lon = gps ? gps.lon : 0;

    const newEntryMeta: Omit<PlantEntry, 'foto'> = {
      id,
      tanggal: timestamp.toLocaleString('id-ID'),
      timestamp: timestamp.toISOString(),
      gps: gps || undefined,
      lokasi: `${lat.toFixed(6)},${lon.toFixed(6)}`,
      pekerjaan: formState.pekerjaan,
      tinggi: formState.tinggi,
      koordinat: `${lat.toFixed(6)},${lon.toFixed(6)}`,
      y: lon,
      x: lat,
      tanaman: formState.jenis,
      tahunTanam: formState.tahunTanam,
      pengawas: formState.pengawas,
      vendor: formState.vendor,
      tim: formState.tim,
      kesehatan: formState.kesehatan,
      noPohon: entries.length + 1,
      uploaded: false,
      statusDuplikat: "UNIK"
    };

    try {
      showToast('Memproses & Menyimpan...', 'info', 1000);
      const photoWithExif = await writeExifData(dataUrl, newEntryMeta);
      const finalEntry: PlantEntry = { ...newEntryMeta, foto: photoWithExif };
      
      // SAVE LOCALLY FIRST
      setEntries(prev => [...prev, finalEntry]);

      // DOWNLOAD PHOTO
      const downloadLink = document.createElement('a');
      downloadLink.href = photoWithExif;
      downloadLink.download = `foto_${id}.jpg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // TRY TO UPLOAD IF ONLINE
      if (appsScriptUrl && navigator.onLine) {
        showToast('Mengirim ke Cloud...', 'info');
        try {
          await uploadToAppsScript(appsScriptUrl, finalEntry);
          setEntries(prev => prev.map(e => e.id === finalEntry.id ? { ...e, uploaded: true } : e));
          showToast('Data Berhasil Terkirim!', 'success');
        } catch (error) {
          showToast('Upload Gagal, Data Disimpan Lokal.', 'info');
        }
      } else {
        showToast('Data Disimpan Lokal (Offline).', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Gagal memproses gambar.', 'error');
    }
  }, [formState, gps, entries.length, appsScriptUrl, setEntries, showToast]);

  const handleClearData = () => {
    if (window.confirm('Hapus semua data lokal?')) {
      setEntries([]);
      showToast('Data lokal dibersihkan.', 'success');
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-slate-800">
      <CameraView 
        onCapture={handleCapture}
        formState={formState}
        onFormStateChange={setFormState}
        entriesCount={entries.length}
        gps={gps}
        onGpsUpdate={setGps}
        onShowSheet={() => setBottomSheetOpen(true)}
        showToast={showToast}
        isOnline={isOnline}
      />
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        entries={entries}
        formState={formState}
        onFormStateChange={setFormState}
        onClearData={handleClearData}
        appsScriptUrl={appsScriptUrl}
        onAppsScriptUrlChange={setAppsScriptUrl}
        showToast={showToast}
        gps={gps}
        onGpsUpdate={setGps}
        onSyncPending={syncPendingEntries}
        isOnline={isOnline}
      />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default App;
