
import React, { useState } from 'react';
import { PlantEntry, GpsLocation, FormState } from '../types';
import { FormTab } from './FormTab';
import { DataTab } from './DataTab';
import { AnalyticsTab } from './AnalyticsTab';
import { SettingsTab } from './SettingsTab';
import { OnlineDashboardTab } from './OnlineDashboardTab';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entries: PlantEntry[];
  formState: FormState;
  onFormStateChange: React.Dispatch<React.SetStateAction<FormState>>;
  onClearData: () => void;
  appsScriptUrl: string;
  onAppsScriptUrlChange: (url: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  gps: GpsLocation | null;
  onGpsUpdate: (gps: GpsLocation) => void;
  onSyncPending: () => Promise<void>;
  isOnline: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen, onClose, entries, formState, onFormStateChange, onClearData, appsScriptUrl, onAppsScriptUrlChange, onSyncPending, isOnline
}) => {
  const [activeTab, setActiveTab] = useState('form');

  return (
    <div 
      className={`fixed inset-0 z-40 transition-all duration-500 ease-in-out ${isOpen ? 'bg-black/60 backdrop-blur-[2px] opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 h-[92vh] bg-white rounded-t-[40px] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="w-full h-10 flex items-center justify-center flex-shrink-0 group focus:outline-none"
          aria-label="Close panel"
        >
          <div className="h-1.5 w-16 bg-slate-200 rounded-full group-hover:bg-slate-300 group-active:scale-x-125 transition-all duration-300" />
        </button>

        <div className="px-6 pb-4">
          <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar">
            {[
              { id: 'form', label: 'form' },
              { id: 'data', label: 'data' },
              { id: 'dashboard', label: 'dashboard' },
              { id: 'grafik', label: 'grafik' },
              { id: 'pengaturan', label: 'pengaturan' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {activeTab === 'form' && (
            <FormTab 
              formState={formState} 
              onFormStateChange={onFormStateChange} 
            />
          )}
          
          {activeTab === 'data' && (
            <DataTab 
              entries={entries} 
              isOnline={isOnline} 
              onSyncPending={onSyncPending} 
            />
          )}

          {activeTab === 'dashboard' && (
            <OnlineDashboardTab 
              appsScriptUrl={appsScriptUrl} 
              isOnline={isOnline} 
            />
          )}
          
          {activeTab === 'grafik' && (
            <AnalyticsTab 
              entries={entries} 
              appsScriptUrl={appsScriptUrl}
              isOnline={isOnline}
            />
          )}
          
          {activeTab === 'pengaturan' && (
            <SettingsTab 
              appsScriptUrl={appsScriptUrl} 
              onAppsScriptUrlChange={onAppsScriptUrlChange} 
              entries={entries} 
              onClearData={onClearData} 
            />
          )}
        </div>
      </div>
    </div>
  );
};
