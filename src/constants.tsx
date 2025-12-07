import { DriverProfile, Truck, Load, ClientShipmentRequest, Trip, CarrierOffer, CarrierApplication, Dispute, AdminUserView, Transaction } from './types';

// Structural Constants (Do not delete)
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


// --- DATOS LIMPIOS (VACÍOS) ---
export const MOCK_TRUCKS: Truck[] = [];
export const MOCK_DRIVERS: DriverProfile[] = [];
export const MOCK_LOADS: Load[] = [];
export const MOCK_OFFERS: CarrierOffer[] = [];
export const MOCK_CLIENT_REQUESTS: ClientShipmentRequest[] = [];
export const MOCK_TRIPS: Trip[] = [];
export const MOCK_PENDING_APPLICATIONS: CarrierApplication[] = [];
export const MOCK_DISPUTES: Dispute[] = [];
export const MOCK_ALL_USERS: AdminUserView[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];