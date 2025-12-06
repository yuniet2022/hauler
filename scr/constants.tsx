
import { DriverProfile, Truck, Load, ClientShipmentRequest, Trip, CarrierOffer, CarrierApplication, Dispute, AdminUserView, Transaction } from './types';

export const TRUCK_POSITIONS = [
  { id: 'p1', name: 'Head Rack' },
  { id: 'p2', name: 'Truck Deck' },
  { id: 'p3', name: 'Top Front' },
  { id: 'p4a', name: 'Top Middle A' },
  { id: 'p4b', name: 'Top Middle B' },
  { id: 'p5', name: 'Top Rear' },
  { id: 'p6', name: 'Belly' },
  { id: 'p7', name: 'Lower Front' },
  { id: 'p8', name: 'Tail' },
];

export const MOCK_TRUCKS: Truck[] = [
  { id: 't1', name: 'Unit 101', vin: '1M8...001', plate: 'FL-1234', status: 'READY', currentLocation: { lat: 25.76, lng: -80.19 } },
  { id: 't2', name: 'Unit 102', vin: '1M8...002', plate: 'TX-5678', status: 'ON_TRIP', currentLocation: { lat: 29.76, lng: -95.36 } },
  { id: 't3', name: 'Unit 103', vin: '1M8...003', plate: 'NY-9012', status: 'REPAIR', currentLocation: { lat: 40.71, lng: -74.00 } },
];

export const MOCK_DRIVERS: DriverProfile[] = [
  { id: 'd1', name: 'Alex Rivera', email: 'alex@autologix.com', phone: '555-0101', status: 'AVAILABLE', joinedAt: '2023-01-15', isSetupComplete: true },
  { id: 'd2', name: 'Sarah Connor', email: 'sarah@autologix.com', phone: '555-0102', status: 'ON_TRIP', joinedAt: '2023-03-10', isSetupComplete: true },
  { id: 'd3', name: 'John Doe', email: 'john@autologix.com', phone: '555-0103', status: 'OFF_DUTY', joinedAt: '2023-06-20', isSetupComplete: true },
];

export const MOCK_LOADS: Load[] = [
  {
    id: 'L-1001',
    origin: 'Miami, FL',
    destination: 'Dallas, TX',
    price: 1200,
    distance: 1300,
    status: 'PUBLISHED',
    pickupDate: '2023-10-25',
    deliveryDate: '2023-10-27',
    vehicles: [
      { 
        id: 'v1', vin: 'VIN123...ABC', make: 'Toyota', model: 'Camry', year: 2022, type: 'Sedan', status: 'PENDING', 
        gatePassCode: 'GP-9988',
        pickupLocation: {
          name: 'Copart Miami North',
          address: '1234 Auction Way, Miami, FL',
          type: 'AUCTION',
          lat: 25.90, lng: -80.25,
          instructions: 'Lane 4, Row 12. Need safety vest.'
        }
      },
      { 
        id: 'v2', vin: 'VIN098...XYZ', make: 'Honda', model: 'Civic', year: 2021, type: 'Sedan', status: 'PENDING', 
        gatePassCode: 'GP-7766',
        pickupLocation: {
          name: 'Copart Miami North',
          address: '1234 Auction Way, Miami, FL',
          type: 'AUCTION',
          lat: 25.90, lng: -80.25,
          instructions: 'Lane 2, Row 5.'
        }
      },
      {
        id: 'v3', vin: 'VIN555...RES', make: 'Tesla', model: 'Model 3', year: 2023, type: 'Sedan', status: 'PENDING',
        pickupLocation: {
          name: 'Private Residence',
          address: '500 Ocean Dr, Miami Beach, FL',
          type: 'RESIDENCE',
          lat: 25.78, lng: -80.13,
          contactName: 'Michael Scott',
          contactPhone: '555-999-0000',
          instructions: 'Call 1 hour before arrival. Gated community.'
        }
      }
    ]
  },
  {
    id: 'L-1002',
    origin: 'Orlando, FL',
    destination: 'Atlanta, GA',
    price: 600,
    distance: 450,
    status: 'ASSIGNED',
    assignedCarrierId: 'C-001',
    pickupDate: '2023-10-26',
    deliveryDate: '2023-10-26',
    vehicles: [
      { 
        id: 'v4', vin: 'VIN1122334455', make: 'Ford', model: 'F-150', year: 2023, type: 'Pickup', status: 'PENDING', 
        gatePassCode: 'GP-5544',
        pickupLocation: {
          name: 'Manheim Orlando',
          address: '9800 Auction Blvd, Orlando, FL',
          type: 'AUCTION',
          lat: 28.53, lng: -81.37
        }
      }
    ]
  }
];

export const MOCK_OFFERS: CarrierOffer[] = [
  { id: 'o1', carrierName: 'FastTracks Logistics', price: 950, rating: 4.8, message: 'Can pick up tomorrow morning. Enclosed trailer.' },
  { id: 'o2', carrierName: 'SafeHaul Transport', price: 890, rating: 4.5, message: 'Standard open transport. fast delivery.' },
];

export const MOCK_CLIENT_REQUESTS: ClientShipmentRequest[] = [
  {
    id: 'R-501',
    origin: 'Austin, TX',
    destination: 'Seattle, WA',
    vehicleDetails: '2021 Tesla Model 3',
    pickupDate: '2023-11-01',
    status: 'PENDING',
    offers: MOCK_OFFERS,
    isInoperable: false,
    paymentStatus: 'UNPAID',
  }
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'TR-2023-001',
    truckId: 't2',
    driverIds: ['d2'],
    loadIds: ['L-1002'],
    vehicleIds: ['v3'],
    status: 'ACTIVE',
    loadPlan: { 'p1': 'v3' },
    financials: {
      grossTotal: 600,
      expenses: 150,
      driverPayMode: 'PERCENTAGE',
      driverPayRate: 25,
      paymentsReceived: { cash: 0, zelle: 0, check: 600, ach: 0 }
    }
  }
];

// Admin Mock Data
export const MOCK_PENDING_APPLICATIONS: CarrierApplication[] = [
  {
    id: 'APP-001',
    companyName: 'Eagle Trans LLC',
    dotNumber: '3456789',
    mcNumber: '123456',
    ein: '99-8877665',
    ownerName: 'James Eagle',
    ownerPhone: '555-000-1111',
    ownerEmail: 'james@eagletrans.com',
    status: 'PENDING_VERIFICATION',
    submittedAt: '2023-10-24T10:00:00Z',
    documents: { einDoc: null, authorityDoc: null, insuranceDoc: null, w9Doc: null }
  },
  {
    id: 'APP-002',
    companyName: 'Speedy Haulers Inc',
    dotNumber: '9876543',
    mcNumber: '654321',
    ein: '11-2233445',
    ownerName: 'Maria Speedy',
    ownerPhone: '555-222-3333',
    ownerEmail: 'maria@speedy.com',
    status: 'PENDING_VERIFICATION',
    submittedAt: '2023-10-25T14:30:00Z',
    documents: { einDoc: null, authorityDoc: null, insuranceDoc: null, w9Doc: null }
  }
];

export const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'DIS-900',
    loadId: 'L-1001',
    reportedBy: 'CLIENT',
    reason: 'Carrier No-Show on Pickup Date',
    status: 'OPEN',
    amountAtRisk: 1200,
    createdAt: '2023-10-26T09:00:00Z'
  }
];

export const MOCK_ALL_USERS: AdminUserView[] = [
  { id: 'C-001', name: 'FastTracks Logistics', email: 'dispatch@fasttracks.com', role: 'carrier', status: 'ACTIVE', rating: 4.8, joinDate: '2023-01-10', phone: '555-123-4567' },
  { id: 'C-002', name: 'SafeHaul Transport', email: 'admin@safehaul.com', role: 'carrier', status: 'ACTIVE', rating: 4.5, joinDate: '2023-02-15', phone: '555-987-6543' },
  { id: 'C-003', name: 'Eagle Trans LLC', email: 'james@eagletrans.com', role: 'carrier', status: 'PENDING', rating: 0, joinDate: '2023-10-24', phone: '555-000-1111' },
  { id: 'CL-501', name: 'Michael Scott', email: 'mscott@dunder.com', role: 'client', status: 'ACTIVE', joinDate: '2023-09-15', phone: '555-999-0000' },
  { id: 'D-202', name: 'Miami Auto Imports', email: 'sales@miamiauto.com', role: 'dealer', status: 'SUSPENDED', joinDate: '2023-05-20', phone: '555-111-2222' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TX-1001', date: '2023-10-25', type: 'CLIENT_PAYMENT', amount: 1200, description: 'Escrow Deposit: Load L-1001', status: 'COMPLETED', relatedLoadId: 'L-1001', platformFee: 120, netToCarrier: 1080 },
  { id: 'TX-1002', date: '2023-10-26', type: 'CARRIER_PAYOUT', amount: 600, description: 'Payout Release: Load L-1002', status: 'PENDING', relatedLoadId: 'L-1002', platformFee: 60, netToCarrier: 540 },
  { id: 'TX-1003', date: '2023-10-24', type: 'CLIENT_PAYMENT', amount: 950, description: 'Escrow Deposit: Load L-1003', status: 'COMPLETED', relatedLoadId: 'L-1003', platformFee: 95, netToCarrier: 855 },
];

export const US_LOCATIONS = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", 
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", 
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", 
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC", 
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", 
  "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD", 
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ", 
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Miami, FL", 
  "Raleigh, NC", "Omaha, NE", "Long Beach, CA", "Virginia Beach, VA", "Oakland, CA", 
  "Minneapolis, MN", "Tulsa, OK", "Arlington, TX", "Tampa, FL", "New Orleans, LA", 
  "Wichita, KS", "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA", 
  "Honolulu, HI", "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX", "Lexington, KY",
  "Orlando, FL", "Newark, NJ", "Jersey City, NJ", "Buffalo, NY", "Saint Paul, MN",
  "Plano, TX", "Irvine, CA", "Toledo, OH", "Durham, NC", "Chula Vista, CA",
  "Saint Petersburg, FL", "Laredo, TX", "Chandler, AZ", "Madison, WI", "Lubbock, TX",
  "Scottsdale, AZ", "Reno, NV", "Glendale, AZ", "Gilbert, AZ", "Winston-Salem, NC",
  "North Las Vegas, NV", "Norfolk, VA", "Chesapeake, VA", "Garland, TX", "Irving, TX",
  "Hialeah, FL", "Fremont, CA", "Boise, ID", "Richmond, VA", "Baton Rouge, LA"
];