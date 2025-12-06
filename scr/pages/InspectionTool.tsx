
import React, { useState, useEffect } from 'react';
import { Camera, Video, X, Check, AlertCircle, CheckCircle, CloudUpload, Loader2 } from 'lucide-react';
import { Vehicle } from '../types';
import { UploadManager } from '../services/uploadManager';

interface InspectionToolProps {
  vehicle: Vehicle;
  mode: 'pickup' | 'delivery';
  onComplete: () => void;
  onCancel: () => void;
}

const InspectionTool: React.FC<InspectionToolProps> = ({ vehicle, mode, onComplete, onCancel }) => {
  const [photosTaken, setPhotosTaken] = useState<number>(0);
  const [videoStatus, setVideoStatus] = useState<'NONE' | 'RECORDING' | 'QUEUED' | 'COMPLETED'>('NONE');
  
  // To track real upload progress from the manager
  const [uploadProgress, setUploadProgress] = useState(0);

  // In a real app, we would use the camera API here. 
  // For this demo, we simulate capturing a file.
  const handleCapturePhoto = () => {
    // Simulate a file blob
    const mockFile = new Blob(["mock-image-data"], { type: "image/jpeg" });
    UploadManager.addFile(mockFile, 'PHOTO', vehicle.id);
    setPhotosTaken(prev => prev + 1);
  };

  const handleCaptureVideo = () => {
    setVideoStatus('RECORDING');
    // Simulate recording time (3 seconds)
    setTimeout(() => {
      const mockVideoBlob = new Blob(["mock-video-data-heavy"], { type: "video/mp4" });
      
      // Add to background queue
      UploadManager.addFile(mockVideoBlob, 'VIDEO', vehicle.id);
      
      setVideoStatus('QUEUED');
    }, 2000);
  };

  // Subscribe to upload manager updates to show progress bar
  useEffect(() => {
    const unsubscribe = UploadManager.subscribe((queue) => {
      // Find tasks related to this vehicle
      const tasks = queue.filter(t => t.vehicleId === vehicle.id && t.type === 'VIDEO');
      if (tasks.length > 0) {
        const latestVideo = tasks[tasks.length - 1];
        if (latestVideo.status === 'UPLOADING') {
            setUploadProgress(latestVideo.progress);
        } else if (latestVideo.status === 'COMPLETED') {
            setVideoStatus('COMPLETED');
            setUploadProgress(100);
        }
      }
    });
    return unsubscribe;
  }, [vehicle.id]);

  const canComplete = photosTaken >= 5 && (videoStatus === 'QUEUED' || videoStatus === 'COMPLETED');

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col animate-in slide-in-from-bottom-10">
      <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-slate-800">
        <div>
           <h2 className="text-white font-bold">{mode === 'pickup' ? 'Origin Inspection' : 'Delivery Inspection'}</h2>
           <p className="text-xs text-slate-400 font-mono">{vehicle.year} {vehicle.model}</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-slate-800 rounded-full text-white"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-blue-200 text-sm">
          <CloudUpload size={20} className="shrink-0 text-blue-400" />
          <p>Media uploads in the background. You can close this and continue working once items are queued.</p>
        </div>

        {/* Photo Section */}
        <div className="space-y-4">
          <h3 className="text-slate-400 font-semibold uppercase text-xs flex justify-between">
            <span>Photos ({photosTaken}/5)</span>
            {photosTaken >= 5 && <span className="text-green-400 flex items-center gap-1"><Check size={12}/> Min Met</span>}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(photosTaken)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 relative overflow-hidden">
                <img src={`https://source.unsplash.com/random/200x200?car&sig=${i}`} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-500 bg-black/50 rounded-full" />
                </div>
              </div>
            ))}
            <button 
              onClick={handleCapturePhoto}
              className="aspect-square bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-white transition-colors active:scale-95"
            >
              <Camera size={24} />
              <span className="text-xs mt-1">Snap</span>
            </button>
          </div>
        </div>

        {/* Video Section */}
        <div className="space-y-4">
          <h3 className="text-slate-400 font-semibold uppercase text-xs">360° Video Walkaround</h3>
          
          {videoStatus === 'NONE' && (
            <button 
                onClick={handleCaptureVideo}
                className="w-full h-32 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-red-500 transition-colors"
            >
                <Video size={32} className="mb-2" />
                <span className="font-medium">Record 360° Video</span>
            </button>
          )}

          {videoStatus === 'RECORDING' && (
             <div className="w-full h-32 bg-red-900/20 border border-red-500/50 rounded-xl flex flex-col items-center justify-center">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping mb-2"></div>
                <span className="text-red-400 font-bold animate-pulse">RECORDING...</span>
             </div>
          )}

          {(videoStatus === 'QUEUED' || videoStatus === 'COMPLETED') && (
            <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Video size={20} className={videoStatus === 'COMPLETED' ? 'text-green-500' : 'text-blue-400'} />
                   </div>
                   <div className="flex-1">
                      <div className="text-white font-bold text-sm">Walkaround Video</div>
                      <div className="text-xs text-slate-400">
                         {videoStatus === 'COMPLETED' ? 'Upload Complete' : `Uploading... ${uploadProgress.toFixed(0)}%`}
                      </div>
                   </div>
                   {videoStatus === 'COMPLETED' ? <CheckCircle className="text-green-500"/> : <Loader2 className="animate-spin text-blue-400"/>}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                   <div 
                      className="bg-green-500 h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                   />
                </div>
                <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                    <span>Quality: 4K (Compressed)</span>
                    <span>Safe to close</span>
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <button 
          onClick={onComplete}
          disabled={!canComplete}
          className="w-full bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {canComplete ? (
             <>Confirm & Save <Check size={20}/></>
          ) : (
             <span className="text-xs">Required: 5 Photos + 1 Video</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default InspectionTool;