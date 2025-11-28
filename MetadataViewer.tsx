import React from 'react';
import { X, Database, Search, ShieldAlert, User, FileText } from 'lucide-react';

interface MetadataViewerProps {
  metadata: Record<string, string>;
  onClose: () => void;
}

// Define keys that represent potentially sensitive PII
const SENSITIVE_KEYS = [
  'PDF Author', 
  'PDF Creator tool', 
  'PDF Producer', 
  'Author', 
  'Creator', 
  'Producer',
  'Last Modified By'
];

const MetadataViewer: React.FC<MetadataViewerProps> = ({ metadata, onClose }) => {
  
  // Split metadata into sensitive and general categories
  const sensitiveData = Object.entries(metadata).filter(([key]) => SENSITIVE_KEYS.includes(key));
  const generalData = Object.entries(metadata).filter(([key]) => !SENSITIVE_KEYS.includes(key));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-lexBlack border border-lexGold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] relative overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-lexGold/20 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lexGold/10 rounded border border-lexGold/30">
               <Database className="w-5 h-5 text-lexGold" />
            </div>
            <div>
               <h3 className="font-serif text-lg text-white tracking-widest text-glow">METADATA EXTRACTOR</h3>
               <p className="font-mono text-[9px] text-lexGold uppercase">Forensic Attribute Analysis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 bg-black/40">
           
           {/* SENSITIVE DATA SECTION */}
           {sensitiveData.length > 0 && (
             <div className="border-b border-lexRed/30 bg-lexRed/5 p-5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-lexRed animate-pulse"></div>
                
                {/* Diagonal striping background */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(136,0,0,0.05)_25%,transparent_25%,transparent_50%,rgba(136,0,0,0.05)_50%,rgba(136,0,0,0.05)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>

                <div className="relative z-10 mb-4 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4 text-lexRed animate-pulse" />
                   <h4 className="font-mono text-xs text-lexRed font-bold uppercase tracking-widest flex items-center gap-2">
                     PII / Sensitive Data Detected
                     <span className="px-1.5 py-0.5 bg-lexRed text-white text-[9px] rounded-sm">CONFIDENTIAL</span>
                   </h4>
                </div>

                <div className="grid grid-cols-1 gap-2 relative z-10">
                  {sensitiveData.map(([key, value]) => (
                    <div key={key} className="flex flex-col md:flex-row md:items-center bg-black/60 border border-lexRed/30 p-2 rounded">
                      <div className="w-1/3 flex items-center gap-2 text-lexRed/80 font-mono text-[10px] uppercase">
                        <User className="w-3 h-3" />
                        {key}
                      </div>
                      <div className="flex-1 font-mono text-xs text-white break-all border-l border-lexRed/20 pl-3 md:ml-2">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* GENERAL DATA TABLE */}
           <div className="p-0">
             {sensitiveData.length > 0 && (
                 <div className="p-3 bg-white/5 border-b border-white/5 font-mono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2 border-t border-white/5">
                    <FileText className="w-3 h-3" />
                    General File Attributes
                 </div>
             )}
             
             <table className="w-full text-left border-collapse">
                {!sensitiveData.length && (
                    <thead className="bg-white/5">
                        <tr className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">
                            <th className="py-2 px-6 font-normal">Attribute</th>
                            <th className="py-2 px-6 font-normal">Data Value</th>
                        </tr>
                    </thead>
                )}
               <tbody className="divide-y divide-white/5">
                 {generalData.map(([key, value]) => (
                   <tr key={key} className="hover:bg-white/5 transition-colors group">
                     <td className="py-3 px-6 font-mono text-xs text-lexGold/60 border-r border-white/5 w-1/3 group-hover:text-lexGold transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-lexGold/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                          {key}
                        </div>
                     </td>
                     <td className="py-3 px-6 font-mono text-xs text-gray-400 break-all group-hover:text-gray-200 transition-colors">
                       {value}
                     </td>
                   </tr>
                 ))}
                 {generalData.length === 0 && sensitiveData.length === 0 && (
                     <tr>
                         <td colSpan={2} className="py-8 text-center text-gray-500 font-mono text-xs">
                             No extractable metadata found.
                         </td>
                     </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-lexGold/20 bg-black/50 text-[9px] font-mono text-gray-600 flex justify-between items-center backdrop-blur">
            <span className="flex items-center gap-2">
                <Search className="w-3 h-3" />
                DEEP INSPECTION COMPLETE
            </span>
            <span className="text-lexGold/50">LEX SENTINEL V.2.0</span>
        </div>
      </div>
    </div>
  );
};

export default MetadataViewer;