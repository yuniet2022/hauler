
// Expanded types to support all application components
export type UserRole = 'admin' | 'dealer' | 'carrier' | 'driver' | 'client';
export type RegistrationRole = 'client' | 'carrier' | 'dealer' | 'driver' | null;

export type TruckStatus = 'READY' | 'ON_TRIP' | 'REPAIR';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
export type LoadStatus = 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'PAID' | 'COMPLETED';
export type VehicleStatus = 'PENDING' | 'IN_TRANSIT' | 'ON_TRIP' | 'DELIVERED';
export type PaymentStatus = 'UNPAID' | 'ESCROW_HELD' | 'RELEASED_TO_CARRIER' | 'REFUNDED';
export type LocationType = 'AUCTION' | 'RESIDENCE' | 'DEALERSHIP' | 'PORT';
export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
export type CompanyStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
export type DisputeStatus = 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_PAYOUT' | 'INVESTIGATING';

export interface Coordinates {
  lat: number;
  lng: number;
}

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
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  rating?: number;
  joinDate: string;
  phone?: string;
}

export interface Truck {
  id: string;
  name: string;
  vin: string;
  plate: string;
  status: TruckStatus;
  owner_id?: string;
  currentLocation?: Coordinates;
}

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  owner_id?: string;
  user_id?: string;  
  license_number?: string;
  license_expiration?: string;
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

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  type?: string;
  status: VehicleStatus;
  pickupLocation: PickupLocation;
  gatePassCode?: string;
}

export interface Load {
  id: string;
  origin: string;
  originCoords?: Coordinates;
  destination: string;
  destinationCoords?: Coordinates;
  price: number;
  distance: number;
  vehicles: Vehicle[];
  status: LoadStatus;
  pickupDate: string;
  deliveryDate?: string;
  assignedCarrierId?: string;
}

export interface Trip {
  id: string;
  truckId: string;
  driverIds: string[];
  loadIds: string[];
  vehicleIds: string[];
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  departureDate?: string;
  loadPlan: Record<string, string>;
  financials: {
    grossTotal: number;
    expenses: number;
    driverPayMode?: 'PERCENTAGE' | 'MILE';
    driverPayRate?: number;
    paymentsReceived?: {
      cash: number;
      zelle: number;
      check: number;
      ach: number;
    };
  };
}

export interface CarrierOffer {
  id: string;
  carrierName: string;
  price: number;
  rating: number;
  message: string;
}

export interface ClientShipmentRequest {
  id: string;
  origin: string;
  originCoords?: Coordinates;
  destination: string;
  destinationCoords?: Coordinates;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  isInoperable: boolean; 
  pickupDate: string;
  status: string;
  paymentStatus: PaymentStatus;
  offers: CarrierOffer[];
  targetPrice?: number;
  distance?: number;
  assignedCarrier?: {
    name: string;
    phone: string;
    rating: number;
  };
  ownerId?: string;
  assignedCarrierId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  relatedLoadId?: string;
  platformFee?: number;
  netToCarrier?: number;
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

export interface CarrierApplication {
  id?: string;
  companyName: string;
  dotNumber: string;
  mcNumber: string;
  ein: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  status?: CompanyStatus;
  submittedAt?: string;
  documents: any;
}

export interface FileUploadTask {
  id: string;
  vehicleId: string;
  progress: number;
  status: UploadStatus;
  type: 'PHOTO' | 'VIDEO';
  file?: File | Blob;
  url?: string;
}
