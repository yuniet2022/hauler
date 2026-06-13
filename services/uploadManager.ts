
import { FileUploadTask } from '../types';

// This class simulates a Background Worker that handles uploads
// regardless of what screen the user is on.
class UploadManagerService {
  private queue: FileUploadTask[] = [];
  private listeners: ((queue: FileUploadTask[]) => void)[] = [];

  constructor() {
    // In a real app, load pending uploads from IndexedDB here
  }

  // Add a file to the upload queue
  public addFile(file: File | Blob, type: 'PHOTO' | 'VIDEO', vehicleId: string): string {
    const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: FileUploadTask = {
      id: taskId,
      file,
      type,
      vehicleId,
      progress: 0,
      status: 'PENDING'
    };

    this.queue.push(newTask);
    this.notify();
    this.processQueue(); // Start processing

    return taskId;
  }

  // Subscribe to queue changes (to update UI)
  public subscribe(callback: (queue: FileUploadTask[]) => void) {
    this.listeners.push(callback);
    callback(this.queue); // Initial emit
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.queue]));
  }

  // The "Worker" Logic
  private async processQueue() {
    const pending = this.queue.find(t => t.status === 'PENDING');
    if (!pending) return;

    // Mark as uploading
    this.updateTaskStatus(pending.id, 'UPLOADING', 0);

    try {
      // SIMULATE S3 PRESIGNED URL UPLOAD
      // In real code: 
      // 1. Get Presigned URL from Backend API
      // 2. XMLHttpRequest PUT to S3 with upload progress event
      
      await this.simulateUpload(pending);

      this.updateTaskStatus(pending.id, 'COMPLETED', 100, `https://s3.aws.com/bucket/${pending.id}`);
    } catch (error) {
      console.error("Upload failed", error);
      this.updateTaskStatus(pending.id, 'ERROR', 0);
    }

    // Process next item
    this.processQueue();
  }

  private updateTaskStatus(id: string, status: FileUploadTask['status'], progress: number, url?: string) {
    this.queue = this.queue.map(t => 
      t.id === id ? { ...t, status, progress, url } : t
    );
    this.notify();
  }

  // Simulates a slow network upload (especially for video)
  private simulateUpload(task: FileUploadTask): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      // Videos take longer (simulating 500MB file vs 5MB photo)
      const speed = task.type === 'VIDEO' ? 2 : 10; 

      const interval = setInterval(() => {
        progress += speed;
        // Introduce some randomness to simulate network jitter
        if (Math.random() > 0.8) progress -= 1; 

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        
        // Update progress in queue without re-triggering full process loop
        this.updateTaskStatus(task.id, 'UPLOADING', progress);
      }, 200);
    });
  }

  public getQueue() {
    return this.queue;
  }
}

export const UploadManager = new UploadManagerService();