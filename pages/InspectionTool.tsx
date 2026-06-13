
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Video, X, Check, CheckCircle, Upload, Loader2, 
  Scan, ShieldCheck, AlertCircle, Sparkles, Plus, PenTool, RotateCcw 
} from 'lucide-react';
import { Vehicle } from '../types';
import { UploadManager } from '../services/uploadManager';
import { analyzeInspectionVideo } from '../services/geminiService';

interface InspectionToolProps {
  vehicle: Vehicle;
  mode: 'pickup' | 'delivery';
  onComplete: () => void;
  onCancel: () => void;
}

const InspectionTool: React.FC<InspectionToolProps> = ({ vehicle, mode, onComplete, onCancel }) => {
  const [photosTaken, setPhotosTaken] = useState<number>(0);
  const [videoStatus, setVideoStatus] = useState<'NONE' | 'RECORDING' | 'ANALYZING' | 'COMPLETED'>('NONE');
  const [aiReport, setAiReport] = useState<any>(null);
  const [isSigned, setIsSigned] = useState(false);
  
  // Signature State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // --- LÓGICA DE FIRMA ---
  useEffect(() => {
    if (videoStatus === 'COMPLETED' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      }
    }
  }, [videoStatus]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
      setIsSigned(true);
    }
  };

  const stopDrawing = () => setIsDrawing(false);
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsSigned(false);
    }
  };

  // --- LÓGICA DE INSPECCIÓN ---
  const handleCapturePhoto = () => {
    const mockFile = new Blob(["img"], { type: "image/jpeg" });
    UploadManager.addFile(mockFile, 'PHOTO', vehicle.id);
    setPhotosTaken(prev => prev + 1);
  };

  const handleStart360Scan = () => {
    setVideoStatus('RECORDING');
    setTimeout(() => {
      setVideoStatus('ANALYZING');
      processAiAnalysis();
    }, 5000);
  };

  const processAiAnalysis = async () => {
    const report = await analyzeInspectionVideo(vehicleDesc);
    setTimeout(() => {
      setAiReport(report);
      setVideoStatus('COMPLETED');
    }, 3000);
  };

  const canComplete = photosTaken >= 5 && videoStatus === 'COMPLETED' && isSigned;

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-slate-900/90 backdrop-blur-2xl flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
             <Scan size={24} />
           </div>
           <div>
             <h2 className="text-white font-black uppercase italic tracking-tighter text-xl">AI Smart <span className="text-blue-500 italic underline decoration-blue-600 underline-offset-4">eBOL</span></h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Inspection: {vehicleDesc}</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 rounded-2xl text-white transition-all"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar pb-40">
        
        {/* 1. VIDEO 360 AI SCAN */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
               <Video size={16} className="text-blue-500" /> 360° AI Integrity Scan
            </h3>
            {videoStatus === 'COMPLETED' && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 italic">AI Verified</span>}
          </div>
          
          {videoStatus === 'NONE' && (
            <button onClick={handleStart360Scan} className="w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all group relative shadow-2xl overflow-hidden">
                <Video size={48} className="text-slate-700 group-hover:text-blue-500 transition-transform mb-4" />
                <span className="font-black uppercase text-xs tracking-[0.3em] text-white italic">Start 360° Walkaround</span>
                <p className="text-[10px] text-slate-600 mt-4 max-w-[280px] text-center uppercase font-bold tracking-widest">AI analysis enabled for damage detection</p>
            </button>
          )}

          {videoStatus === 'RECORDING' && (
             <div className="w-full aspect-video bg-slate-900 rounded-[3rem] border-2 border-red-500/40 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-[scan_2s_infinite]"></div>
                <div className="w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin mb-4"></div>
                <span className="text-red-500 font-black uppercase text-xs tracking-[0.4em] animate-pulse">Scanning 360°...</span>
                <style>{`@keyframes scan { 0% { top: 0% } 50% { top: 100% } 100% { top: 0% } }`}</style>
             </div>
          )}

          {videoStatus === 'ANALYZING' && (
             <div className="w-full aspect-video bg-blue-600/5 rounded-[3rem] border border-blue-500/20 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] italic">Comparing damage baseline...</span>
             </div>
          )}

          {videoStatus === 'COMPLETED' && aiReport && (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-10 animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                   <div className="bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl text-[10px] font-black border border-emerald-500/20 tracking-tighter">AI CONFIDENCE: {aiReport.ai_score}%</div>
                </div>
                <div className="flex items-center gap-6 mb-8">
                   <div className="p-5 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/30"><ShieldCheck size={32} /></div>
                   <div>
                      <h4 className="text-white font-black uppercase italic tracking-tighter text-2xl">AI Guard <span className="text-blue-500">Report</span></h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Integrity confirmed via neural mapping</p>
                   </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                   {aiReport.findings.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-slate-950 rounded-2xl border border-slate-800"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{f}</span></div>
                   ))}
                </div>
            </div>
          )}
        </div>

        {/* 2. PHOTOS SECTION */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <Camera size={16} className="text-slate-500" /> Mandatory Key Angles
            </h3>
            <span className="text-[10px] font-black text-slate-600 tracking-widest">{photosTaken} / 5</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(photosTaken)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-center overflow-hidden"><CheckCircle className="text-emerald-500" /></div>
            ))}
            <button onClick={handleCapturePhoto} className="aspect-square bg-slate-900 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-600 hover:text-white transition-all"><Plus size={24} /></button>
          </div>
        </div>

        {/* 3. DIGITAL SIGNATURE SECTION */}
        {videoStatus === 'COMPLETED' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 px-2">
               <PenTool size={16} className="text-blue-500" /> Biometric Signature
            </h3>
            <div className="bg-white rounded-[3rem] p-4 relative shadow-[0_20px_60px_rgba(59,130,246,0.3)]">
                <canvas 
                    ref={canvasRef}
                    width={800}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[200px] cursor-crosshair touch-none"
                />
                <div className="absolute bottom-6 right-8 flex gap-4">
                   <button onClick={clearSignature} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><RotateCcw size={14}/> Clear</button>
                   {isSigned && <div className="p-3 bg-emerald-500 text-white rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Check size={14}/> Validated</div>}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.05]">
                   <span className="text-5xl font-black italic uppercase tracking-[0.5em] text-slate-950">SIGN HERE</span>
                </div>
            </div>
            <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest">AL FIRMAR, EL CLIENTE ACEPTA EL AI GUARD REPORT COMO PARTE DEL EBOL DIGITAL</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-10 border-t border-white/5 bg-slate-900/90 backdrop-blur-3xl absolute bottom-0 left-0 w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-40">
        <button 
          onClick={onComplete}
          disabled={!canComplete}
          className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-8 rounded-[2.5rem] transition-all shadow-2xl shadow-blue-900/40 disabled:shadow-none flex items-center justify-center gap-4 uppercase italic tracking-widest text-lg"
        >
          {canComplete ? (
             <>Generate Biometric eBOL <CheckCircle size={24}/></>
          ) : (
             <div className="flex items-center gap-4">
               <AlertCircle size={20} />
               <span className="text-sm">Complete: Video + Photos + Signature</span>
             </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default InspectionTool;