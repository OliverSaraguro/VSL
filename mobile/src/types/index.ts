export enum UserRole {
  DRIVER = 'DRIVER',
  PARENT = 'PARENT',
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  photoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver extends User {
  role: UserRole.DRIVER;
  licenseNumber: string;
  licenseExpiry: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleCapacity: number;
  vehicleColor: string;
  rating: number;
  totalTrips: number;
}

export interface Parent extends User {
  role: UserRole.PARENT;
  address: string;
  emergencyContact: string;
  students: Student[];
}

export interface Student {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  driverId: string;
  parentId?: string;
  isActive: boolean;
  createdAt?: string;
  invitationCode?: string | null;
  invitationCodeExpiresAt?: string | null;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  driverId: string;
  driver?: Driver;
  stops: Stop[];
  students: Student[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  daysOfWeek: number[];
  destinationName?: string;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stop {
  id: string;
  routeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
  estimatedTime: string;
  students: Student[];
  studentId?: string;
}

export interface Trip {
  id: string;
  routeId: string;
  route?: Route;
  driverId: string;
  driver?: Driver;
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
  date: string;
  boardings: Boarding[];
  currentLatitude?: number;
  currentLongitude?: number;
  createdAt: string;
}

export interface Boarding {
  id: string;
  tripId: string;
  studentId: string;
  student?: Student;
  stopId?: string;
  stop?: Stop;
  boardedAt?: string;
  droppedAt?: string;
  isAbsent: boolean;
  createdAt: string;
}

export interface Absence {
  id: string;
  studentId: string;
  student?: Student;
  date: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  parentId: string;
  parent?: Parent;
  studentId: string;
  student?: Student;
  amount: number;
  month: string;
  status: PaymentStatus;
  paidAt?: string;
  dueDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'trip_started'
  | 'trip_completed'
  | 'student_boarded'
  | 'student_dropped'
  | 'absence_reported'
  | 'payment_reminder'
  | 'payment_confirmed'
  | 'route_updated'
  | 'general';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
