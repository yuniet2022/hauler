export type UserRole = 'admin' | 'dealer' | 'carrier' | 'driver' | 'client';
export type RegistrationRole = 'client' | 'carrier' | 'dealer' | null;

export type TruckStatus = 'READY' | 'ON_TRIP' | 'REPAIR';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
export type LoadStatus = 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'PAID' | 'COMPLETED';
export type VehicleStatus = 'PENDING' | 'ON_TRIP' | 'DELIVERED';
export type PaymentStatus = 'UNPAID' | 'ESCROW_HELD' | 'RELEASED_TO_CARRIER' | 'REFUNDED';
export type LocationType = 'AUCTION' | 'RESIDENCE' | 'DEALERSHIP' | 'PORT';
export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
export type CompanyStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
export type DisputeStatus = 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_PAYOUT' | 'INVESTIGATING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}



export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: 'carrier' | 'dealer' | 'client';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  rating?: number; // Only for carriers
  joinDate: string;
  phone?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'CLIENT_PAYMENT' | 'CARRIER_PAYOUT' | 'REFUND';
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  relatedLoadId?: string;
  platformFee?: number;
  netToCarrier?: number;
}

export interface TruckPosition {
  id: string;
  name: string; // e.g., 'Head Rack', 'Belly'
  vehicleId?: string | null;
}

export interface Truck {
  id: string;
  name: string;
  vin: string;
  plate: string;
  status: TruckStatus;
  currentLocation?: { lat: number; lng: number };
}

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  licensePhotoUrl?: string;
  joinedAt?: string;
  isSetupComplete?: boolean;
}

export interface PickupLocation {
  name: string;
  address: string;
  type: LocationType;
  lat: number;
  lng: number;
  contactName?: string;
  contactPhone?: string;
  instructions?: string;
}

export interface InspectionReport {
  timestamp: string;
  photos: string[];
  videoUrl?: string;
  damages: { area: string; description: string }[];
  signatureUrl?: string;
  // Upload tracking fields
  uploadStatus?: UploadStatus;
  uploadProgress?: number; // 0 to 100
}

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: VehicleStatus;
  pickupLocation: PickupLocation; // New: Specific location data
  gatePassCode?: string; // For auction pickup only
  pickupInspection?: InspectionReport;
  deliveryInspection?: InspectionReport;
}

export interface Load {
  id: string;
  origin: string;
  destination: string;
  price: number;
  distance: number; // miles
  vehicles: Vehicle[];
  status: LoadStatus;
  pickupDate: string;
  deliveryDate: string;
  assignedCarrierId?: string;
  trackingCode?: string;
}

export interface Trip {
  id: string;
  truckId: string;
  driverIds: string[]; // 1 or 2 drivers
  loadIds: string[]; // Loads contained in this trip
  vehicleIds: string[]; // Individual vehicles on this trip
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  departureDate?: string; // New field for dispatching
  loadPlan: Record<string, string>; // PositionID -> VehicleID
  financials: {
    grossTotal: number;
    expenses: number;
    driverPayMode: 'PERCENTAGE' | 'MILE';
    driverPayRate: number; // e.g., 25 or 0.60
    paymentsReceived: {
      cash: number;
      zelle: number;
      check: number;
      ach: number;
    };
  };
}

export interface ClientShipmentRequest {
  id: string;
  origin: string;
  destination: string;
  vehicleDetails: string; // "2023 Ford F-150"
  isInoperable: boolean; // New: Condition of vehicle
  pickupDate: string;
  status: 'QUOTING' | 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: PaymentStatus; // New: Escrow status
  escrowReleaseDate?: string; // New: When carrier gets paid
  offers: CarrierOffer[];
  assignedCarrier?: {
    name: string;
    phone: string;
    rating: number;
  };
  trackingCode?: string;
  driverRating?: number;
  driverFeedback?: string;
  targetPrice?: number; // New field for user's offer
}

export interface CarrierOffer {
  id: string;
  carrierName: string;
  price: number;
  rating: number;
  message: string;
}

export interface CarrierApplication {
  id?: string;
  companyName: string;
  dotNumber: string;
  mcNumber: string;
  ein: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  submittedAt?: string;
  status?: CompanyStatus;
  documents: {
    einDoc: File | null;
    authorityDoc: File | null;
    insuranceDoc: File | null;
    w9Doc: File | null;
  };
}

export interface Dispute {
  id: string;
  loadId: string;
  reportedBy: 'CLIENT' | 'CARRIER';
  reason: string;
  status: DisputeStatus;
  amountAtRisk: number;
  createdAt: string;
}

export interface FileUploadTask {
  id: string;
  file: File | Blob;
  type: 'PHOTO' | 'VIDEO';
  vehicleId: string;
  progress: number;
  status: UploadStatus;
  url?: string;
}