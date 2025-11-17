/**
 * User model - matches DynamoDB Users table schema
 */

export interface User {
  userId: string;                    // PK - UUID v4
  phoneNumber: string;               // Hashed phone number
  phoneNumberPlain: string;          // Plain phone (encrypted at rest by DynamoDB)
  email?: string;
  name: string;
  profilePhotoS3Key?: string;
  profilePhotoCdnUrl?: string;
  bio?: string;
  status: UserStatus;
  approvedBy?: string;               // approver userId
  approvedAt?: number;               // timestamp
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export enum UserStatus {
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export interface VerificationCode {
  phoneNumberHash: string;           // PK - hashed phone
  phoneNumber: string;               // Plain phone for SMS
  code: string;                      // 6-digit code
  createdAt: number;
  expiresAt: number;                 // createdAt + 5 minutes
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

export interface PendingApproval {
  userId: string;                    // PK
  phoneNumber: string;
  name: string;
  status: ApprovalStatus;
  requestedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
  notificationSent: boolean;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface UserPreferences {
  userId: string;                    // PK
  primaryChannel: CommunicationChannel;
  enabledChannels: CommunicationChannel[];
  smsNotifications: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  notifyOnMessages: boolean;
  notifyOnForumPosts: boolean;
  notifyOnEvents: boolean;
  digestFrequency: DigestFrequency;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  profileVisibility: ProfileVisibility;
  showPhoneNumber: boolean;
  showEmail: boolean;
  updatedAt: number;
}

export enum CommunicationChannel {
  APP = 'app',
  SMS = 'sms',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp'
}

export enum DigestFrequency {
  REALTIME = 'realtime',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  CLASSMATES = 'classmates',
  CONNECTIONS = 'connections'
}

export interface Classroom {
  classroomId: string;               // PK - Format: "YEAR-CLASSROOM" (e.g., "1985-P4B")
  year: number;
  grade: string;
  section: string;
  displayName: string;
  teacherName?: string;
  studentCount?: number;
  photoS3Key?: string;
  createdAt: number;
}

export interface UserClassroom {
  userId: string;                    // PK
  classroomId: string;               // SK
  addedAt: number;
  verifiedBy?: string;
  role: ClassroomRole;
}

export enum ClassroomRole {
  STUDENT = 'student',
  TEACHER = 'teacher'
}
