# Technical Architecture: High School Classmates Connection Platform

## Architecture Overview

This document describes the technical architecture for the High School Classmates Connection Platform, a multi-channel communication system that bridges different messaging platforms.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Design](#component-design)
3. [Data Architecture](#data-architecture)
4. [API Design](#api-design)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Technology Decisions](#technology-decisions)

---

## System Architecture

### High-Level Architecture (Serverless)

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
├──────────────────────────────────────────────────────────────────┤
│  Flutter App    │   Web App   │   Email   │   SMS   │  WhatsApp  │
│  (iOS/Android)  │  (Browser)  │  Clients  │ Devices │    App     │
└────────┬────────┴──────┬──────┴─────┬─────┴────┬────┴──────┬─────┘
         │               │            │          │           │
         └───────────────┴────────────┴──────────┴───────────┘
                                │
                    ┌───────────▼──────────────┐
                    │   AWS API Gateway        │
                    │   (REST + WebSocket)     │
                    └───────────┬──────────────┘
                                │
         ┌──────────────────────┼───────────────────────┐
         │                      │                       │
    ┌────▼─────────┐    ┌──────▼────────┐     ┌───────▼─────────┐
    │  Auth Lambda │    │  API Lambdas  │     │ WebSocket Lambda│
    │  Functions   │    │  Functions    │     │   (AppSync)     │
    └────┬─────────┘    └──────┬────────┘     └───────┬─────────┘
         │                     │                       │
         └──────────┬──────────┴──────────┬────────────┘
                    │                     │
         ┌──────────▼──────────┐  ┌───────▼────────────┐
         │ Routing Lambda      │  │   Amazon DynamoDB  │
         │ (Message Engine)    │  │   (NoSQL Database) │
         └──────────┬──────────┘  └───────┬────────────┘
                    │                     │
         ┌──────────┴──────────┬──────────┴───────────────┐
         │                     │                          │
    ┌────▼──────┐      ┌──────▼────┐           ┌─────────▼─────┐
    │ SQS/SNS   │      │ DynamoDB  │           │   Amazon S3   │
    │ (Queues)  │      │  Streams  │           │ (Photo Store) │
    └────┬──────┘      └───────────┘           └───────────────┘
         │
         └─────────────┬─────────────────────────────┐
                       │                             │
              ┌────────▼────────┐         ┌──────────▼──────────┐
              │  AWS SNS (SMS)  │         │  AWS SES (Email)    │
              │  WhatsApp API   │         │  S3 + CloudFront    │
              │  (via Lambda)   │         │  (CDN)              │
              └─────────────────┘         └─────────────────────┘
```

### Architecture Patterns

**Primary Pattern**: **Serverless (FaaS - Function as a Service)**

**Supporting Patterns**:
- **Event-Driven**: Lambda functions triggered by events (API Gateway, DynamoDB Streams, SQS)
- **Microservices**: Each Lambda function is a micro-service
- **API Gateway**: Single entry point for all client requests
- **Message Queue**: SQS for asynchronous processing and reliability
- **CQRS (Light)**: DynamoDB Streams for event sourcing
- **Circuit Breaker**: Lambda retry policies and DLQ (Dead Letter Queue)

---

## Component Design

### 1. Client Applications

#### Flutter Mobile/Web App

**Purpose**: Native user experience for iOS, Android, and Web

**Key Features**:
- User registration and authentication
- Real-time messaging (WebSocket)
- Forum browsing and participation
- User profile management
- Push notifications
- Offline support with local caching

**Technology**:
- Flutter 3.x+ (Dart)
- State Management: Riverpod (compile-safe)
- Local Storage: Hive or flutter_secure_storage
- HTTP Client: Dio
- WebSocket: AppSync or web_socket_channel
- AWS Integration: amplify_flutter

**Key Screens**:
- Login/Registration
- Verification (SMS code entry)
- Profile & Photos Setup (NEW - upload profile, tag old photos)
- Preferences & Classroom Selection
- Main Feed/Forum
- Direct Messages
- Forum List
- Photo Gallery (NEW - browse and tag old class photos)
- User Profile (with old tagged photos)
- Settings

#### Email Interface

**Purpose**: Allow email-only users to participate

**Implementation**:
- Dedicated email addresses per user: `username@classmates.yourdomain.com`
- Inbound email processing via AWS SES webhooks (to Lambda)
- Outbound email with proper threading (Reply-To headers)
- HTML emails with plain text fallback

**Features**:
- Forum digest emails (daily/weekly)
- Direct message notifications
- Reply via email
- Attachment handling

#### SMS Interface

**Purpose**: Basic notifications and replies for SMS-only users

**Implementation**:
- AWS SNS for SMS (50-80% cheaper than Twilio for international)
- Keyword-based commands (e.g., "REPLY 1: Your message")
- Shortlinks for app downloads
- Delivery status tracking via SNS callbacks to Lambda

**Features**:
- Important notifications only
- One-way announcements
- Limited two-way via keywords

#### WhatsApp Interface

**Purpose**: Native WhatsApp experience for WhatsApp users

**Implementation**:
- WhatsApp Business API
- Webhook for incoming messages
- Template messages for notifications
- WhatsApp groups for forums

**Features**:
- Forum mirroring in WhatsApp groups
- Direct messaging
- Media sharing
- Rich formatting

---

### 2. Backend Lambda Functions

#### Authentication Functions

**Responsibilities**:
- User registration
- SMS verification (via AWS SNS)
- JWT token generation and validation
- Peer approval workflow
- Session management
- Password reset (for app users)

**Endpoints**:
```
POST /auth/register
POST /auth/verify-sms
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
GET  /auth/approval-pending
POST /auth/approve-user
```

**Database Tables**:
- users
- verification_codes
- pending_approvals
- sessions

#### API Service

**Responsibilities**:
- User profile management
- Forum CRUD operations
- Message retrieval
- User search
- Preference management

**Endpoints**:
```
# Users
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/:id
GET    /api/users/search

# Forums
GET    /api/forums
POST   /api/forums
GET    /api/forums/:id
PUT    /api/forums/:id
DELETE /api/forums/:id
POST   /api/forums/:id/join
POST   /api/forums/:id/leave

# Messages
GET    /api/messages
POST   /api/messages
GET    /api/messages/:id
GET    /api/conversations/:userId

# Preferences
GET    /api/preferences
PUT    /api/preferences
```

**Database Tables**:
- users
- forums
- forum_members
- messages
- user_preferences

#### WebSocket Server

**Responsibilities**:
- Real-time message delivery
- Online/offline status
- Typing indicators
- Read receipts

**Events**:
```
Client → Server:
- authenticate
- send_message
- typing_start
- typing_stop
- mark_read

Server → Client:
- message_received
- user_status_changed
- typing
- message_read
```

**Technology**:
- Socket.io (Node.js) or WebSocket (Python with asyncio)
- Redis pub/sub for horizontal scaling
- JWT authentication for connections

#### Message Routing Engine

**Responsibilities**:
- Route messages to appropriate channels
- Handle cross-channel message format conversion
- Manage delivery retries
- Track message status

**Core Logic**:
```python
def route_message(message, recipient):
    # Get recipient's preferred channel
    channel = get_user_preference(recipient.id).primary_channel

    # Get channel-specific formatter
    formatter = get_formatter(channel)

    # Format message for channel
    formatted_message = formatter.format(message)

    # Send via appropriate integration
    integration = get_integration(channel)
    result = integration.send(formatted_message, recipient)

    # Queue for retry if failed
    if not result.success:
        queue_for_retry(message, recipient, channel)

    # Log delivery attempt
    log_delivery(message.id, recipient.id, channel, result)

    return result
```

**Components**:
- Channel Router
- Message Formatters (per channel)
- Delivery Queue
- Retry Handler
- Delivery Status Tracker

---

### 3. Integration Services

#### SMS Integration (Twilio)

**Capabilities**:
- Send SMS messages
- Receive SMS via webhook
- Delivery status callbacks
- Shortcode management

**Configuration**:
```python
TWILIO_ACCOUNT_SID = env('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = env('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = env('TWILIO_PHONE_NUMBER')
```

**Webhook Endpoints**:
```
POST /webhooks/twilio/incoming-sms
POST /webhooks/twilio/status-callback
```

#### Email Integration (SendGrid or AWS SES)

**Capabilities**:
- Send transactional emails
- Send digest emails
- Receive inbound email via webhook
- Track opens and clicks
- Manage templates

**Configuration**:
```python
SENDGRID_API_KEY = env('SENDGRID_API_KEY')
SENDGRID_FROM_EMAIL = env('SENDGRID_FROM_EMAIL')
INBOUND_EMAIL_DOMAIN = env('INBOUND_EMAIL_DOMAIN')
```

**Webhook Endpoints**:
```
POST /webhooks/sendgrid/inbound
POST /webhooks/sendgrid/events
```

#### WhatsApp Integration (WhatsApp Business API)

**Capabilities**:
- Send template messages
- Send session messages (within 24hr window)
- Receive messages via webhook
- Manage WhatsApp groups (if supported)
- Media handling

**Configuration**:
```python
WHATSAPP_PHONE_NUMBER_ID = env('WHATSAPP_PHONE_NUMBER_ID')
WHATSAPP_ACCESS_TOKEN = env('WHATSAPP_ACCESS_TOKEN')
WHATSAPP_VERIFY_TOKEN = env('WHATSAPP_VERIFY_TOKEN')
```

**Webhook Endpoints**:
```
GET  /webhooks/whatsapp (verification)
POST /webhooks/whatsapp/messages
```

---

## Data Architecture

### Database Schema (Amazon DynamoDB)

**Design Philosophy**: Single-table design pattern for optimal performance and cost efficiency

#### Core Tables

**Users Table**
```javascript
TableName: 'Users'
PartitionKey: userId (String)
GlobalSecondaryIndexes:
  - GSI1: phoneNumber (String) - for phone lookup
  - GSI2: email (String) - for email lookup
  - GSI3: status (String) - for filtering by status

Attributes:
{
  userId: "uuid-v4",
  phoneNumber: "+85298765432",
  phoneVerified: true,
  email: "john@example.com",
  fullName: "John Smith",
  displayName: "John",
  status: "active", // pending, approved, active, suspended
  avatarUrl: "s3://bucket/avatars/uuid.jpg",
  bio: "Living in London, architect",
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  lastSeenAt: 1700000000000
}
```

**UserPreferences Table**
```javascript
TableName: 'UserPreferences'
PartitionKey: userId (String)

Attributes:
{
  userId: "uuid-v4",
  primaryChannel: "whatsapp", // app, whatsapp, email, sms
  messageFrequency: "realtime", // realtime, daily, weekly
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  timezone: "Asia/Hong_Kong",
  language: "en",
  privacyPhone: "friends", // everyone, friends, nobody
  privacyEmail: "friends",
  privacyPhotos: "everyone",
  createdAt: 1700000000000,
  updatedAt: 1700000000000
}
```

**Classrooms Table**
```javascript
TableName: 'Classrooms'
PartitionKey: classroomId (String)
SortKey: year (Number)
GlobalSecondaryIndexes:
  - GSI1: level#section (String) - for filtering by level

Attributes:
{
  classroomId: "uuid-v4",
  year: 1985,
  level: "Primary 4",
  section: "B",
  fullName: "Primary 4B (1985)",
  studentCount: 38,
  createdAt: 1700000000000
}
```

**UserClassrooms Table** (Many-to-Many relationship)
```javascript
TableName: 'UserClassrooms'
PartitionKey: userId (String)
SortKey: classroomId (String)
GlobalSecondaryIndexes:
  - GSI1: classroomId (PK), userId (SK) - for reverse lookup

Attributes:
{
  userId: "uuid-v4",
  classroomId: "uuid-v4",
  years: "1985-1986",
  role: "student", // student, teacher
  joinedAt: 1700000000000
}

// Query patterns:
// 1. Get all classrooms for user: Query by userId
// 2. Get all users in classroom: Query GSI1 by classroomId
// 3. Find shared classrooms: Query both users, compare results
```

**VerificationCodes Table**
```javascript
TableName: 'VerificationCodes'
PartitionKey: phoneNumber (String)
SortKey: createdAt (Number)
TTL: expiresAt (Number) // Auto-delete expired codes

Attributes:
{
  phoneNumber: "+85298765432",
  code: "123456",
  createdAt: 1700000000000,
  expiresAt: 1700000600000, // 10 minutes later
  verified: false,
  attempts: 0
}
```

**PendingApprovals Table**
```javascript
TableName: 'PendingApprovals'
PartitionKey: userId (String)
SortKey: createdAt (Number)

Attributes:
{
  userId: "uuid-v4",
  approvedBy: "uuid-v4",
  approvedAt: 1700000000000,
  notes: "Confirmed - was in my class",
  status: "pending", // pending, approved, rejected
  createdAt: 1700000000000
}
```

**Forums Table**
```javascript
TableName: 'Forums'
PartitionKey: forumId (String)
GlobalSecondaryIndexes:
  - GSI1: type (String) - for filtering by forum type

Attributes:
{
  forumId: "uuid-v4",
  name: "Golf Buddies",
  description: "For classmates who love golf",
  type: "public", // main, public, private
  createdBy: "uuid-v4",
  avatarUrl: "s3://bucket/forum-avatars/uuid.jpg",
  memberCount: 25,
  createdAt: 1700000000000,
  updatedAt: 1700000000000
}
```

**ForumMembers Table**
```javascript
TableName: 'ForumMembers'
PartitionKey: forumId (String)
SortKey: userId (String)
GlobalSecondaryIndexes:
  - GSI1: userId (PK), forumId (SK) - for user's forums

Attributes:
{
  forumId: "uuid-v4",
  userId: "uuid-v4",
  role: "member", // member, moderator, admin
  joinedAt: 1700000000000,
  lastReadAt: 1700000000000
}
```

**Messages Table**
```javascript
TableName: 'Messages'
PartitionKey: conversationId (String) // forumId or "dm#{userId1}#{userId2}"
SortKey: timestamp (Number)
GlobalSecondaryIndexes:
  - GSI1: senderId (PK), timestamp (SK) - for user's sent messages
  - GSI2: recipientId (PK), timestamp (SK) - for user's received messages

Attributes:
{
  messageId: "uuid-v4",
  conversationId: "dm#uuid1#uuid2", // or forumId for forum messages
  senderId: "uuid-v4",
  recipientId: "uuid-v4", // null for forum messages
  forumId: "uuid-v4", // null for DMs
  parentId: "uuid-v4", // for threading
  content: "Hello! How are you?",
  contentType: "text", // text, image, video, file
  metadata: {
    attachments: ["s3://bucket/file.jpg"],
    mentions: ["uuid-v4", "uuid-v4"]
  },
  timestamp: 1700000000000,
  editedAt: null,
  deletedAt: null
}
```

**MessageDeliveries Table**
```javascript
TableName: 'MessageDeliveries'
PartitionKey: messageId (String)
SortKey: recipientId#channel (String)
GlobalSecondaryIndexes:
  - GSI1: recipientId (PK), timestamp (SK) - for user's deliveries
  - GSI2: status (PK), timestamp (SK) - for failed messages

Attributes:
{
  messageId: "uuid-v4",
  recipientId: "uuid-v4",
  channel: "whatsapp", // app, whatsapp, email, sms
  status: "delivered", // pending, sent, delivered, failed, read
  externalId: "whatsapp-msg-id-123",
  attempts: 1,
  lastAttemptAt: 1700000000000,
  deliveredAt: 1700000050000,
  readAt: 1700000100000,
  errorMessage: null,
  createdAt: 1700000000000
}
```

**Photos Table** (NEW for photo tagging feature)
```javascript
TableName: 'Photos'
PartitionKey: photoId (String)
GlobalSecondaryIndexes:
  - GSI1: year (Number), classroom (String) - for filtering
  - GSI2: uploadedBy (PK), uploadDate (SK) - for user's uploads

Attributes:
{
  photoId: "uuid-v4",
  uploadedBy: "uuid-v4",
  year: 1985,
  classroom: "Primary 4B",
  event: "Sports Day",
  description: "Annual Sports Day 1985",
  s3Key: "photos/1985/sports-day-001.jpg",
  s3Bucket: "classmates-photos",
  cdnUrl: "https://cdn.example.com/photos/1985/sports-day-001.jpg",
  width: 1920,
  height: 1080,
  tagCount: 12, // number of people tagged
  uploadDate: 1700000000000,
  createdAt: 1700000000000
}
```

**PhotoTags Table** (NEW for photo tagging feature)
```javascript
TableName: 'PhotoTags'
PartitionKey: photoId (String)
SortKey: userId (String)
GlobalSecondaryIndexes:
  - GSI1: userId (PK), photoId (SK) - for user's tagged photos

Attributes:
{
  photoId: "uuid-v4",
  userId: "uuid-v4",
  taggedBy: "uuid-v4", // who created the tag (self or peer)
  facePosition: {
    x: 120,
    y: 45,
    width: 50,
    height: 60
  },
  verified: true, // peer-verified tag
  verifiedBy: ["uuid-v4", "uuid-v4"], // users who confirmed
  taggedAt: 1700000000000,
  createdAt: 1700000000000
}

// Query patterns:
// 1. Get all tags in photo: Query by photoId
// 2. Get all photos user is tagged in: Query GSI1 by userId
// 3. Find classmates in same photo: Query photoId, compare userIds
```

**ChannelIdentities Table**
```javascript
TableName: 'ChannelIdentities'
PartitionKey: userId (String)
SortKey: channel (String)
GlobalSecondaryIndexes:
  - GSI1: channel#identifier (PK) - for reverse lookup

Attributes:
{
  userId: "uuid-v4",
  channel: "whatsapp",
  channelIdentifier: "+85298765432",
  verified: true,
  primaryIdentity: true,
  createdAt: 1700000000000
}

// Query patterns:
// 1. Get all channels for user: Query by userId
// 2. Find user by channel identifier: Query GSI1 by "whatsapp#+85298765432"
```

### DynamoDB Design Considerations

**Cost Optimization**:
- On-demand billing mode for unpredictable traffic
- TTL for auto-expiring verification codes
- Projected attributes in GSIs to minimize storage costs
- Batch operations for bulk reads/writes

**Performance**:
- Single-digit millisecond latency for primary key queries
- GSIs for common query patterns
- Composite sort keys for range queries
- DynamoDB Streams for triggering Lambda functions

**Scalability**:
- Auto-scales to handle traffic spikes
- No need to provision capacity
- Supports eventual consistency for reads (cheaper)
- Strong consistency available when needed

### Caching Strategy (Optional - DynamoDB DAX or ElastiCache)

**Cache Keys** (if using ElastiCache Redis):
```
user:{userId} → User object (TTL: 15 minutes)
user:phone:{phone} → User ID lookup (TTL: 1 hour)
user:email:{email} → User ID lookup (TTL: 1 hour)
forum:{forumId} → Forum object (TTL: 30 minutes)
preferences:{userId} → User preferences (TTL: 1 hour)
```

**Note**: DynamoDB is already very fast, so caching may not be necessary initially. Consider adding later if needed.

### File Storage (Amazon S3)

**Bucket Structure**:
```
/avatars/{userId}/{filename}              # User profile pictures
/forum-avatars/{forumId}/{filename}       # Forum avatars
/attachments/{messageId}/{filename}       # Message attachments
/photos/{year}/{event}/{filename}         # Class photos (NEW)
/photos/thumbnails/{photoId}/{size}.jpg   # Photo thumbnails (NEW)
```

**Access Control**:
- Pre-signed URLs for uploads
- Public read for avatars
- Authenticated read for attachments
- Lifecycle policies for old files

---

## API Design

### RESTful API Conventions

**Base URL**: `https://api.classmates.yourdomain.com/v1`

**Authentication**: Bearer token (JWT)
```
Authorization: Bearer {token}
```

**Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  },
  "error": null
}
```

**Error Format**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Phone number is required",
    "fields": {
      "phone_number": ["This field is required"]
    }
  }
}
```

**Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

### Pagination

```
GET /api/messages?page=1&per_page=20&sort=created_at&order=desc
```

### Filtering

```
GET /api/users?graduating_class=1990&house=A
```

### WebSocket API

**Connection**:
```javascript
const socket = io('wss://ws.classmates.yourdomain.com', {
  auth: {
    token: jwt_token
  }
});
```

**Message Format**:
```json
{
  "event": "send_message",
  "data": {
    "recipient_id": "uuid",
    "content": "Hello!",
    "content_type": "text"
  },
  "timestamp": 1699999999
}
```

---

## Security Architecture

### Authentication & Authorization

**Authentication Methods**:
1. JWT tokens for API access
2. SMS verification for registration
3. Peer approval for account activation

**Token Structure**:
```json
{
  "sub": "user_id",
  "name": "Full Name",
  "role": "member",
  "iat": 1699999999,
  "exp": 1699999999
}
```

**Authorization Levels**:
- **Guest**: Can register only
- **Pending**: Waiting for approval
- **Member**: Full access
- **Moderator**: Can moderate forums
- **Admin**: Full system access

### Data Encryption

**At Rest**:
- Database encryption (PostgreSQL with pgcrypto)
- Phone numbers encrypted with AES-256
- Emails encrypted with AES-256
- File storage encryption (S3 SSE)

**In Transit**:
- TLS 1.3 for all API traffic
- WSS (WebSocket Secure) for real-time
- HTTPS for all web traffic

**Secrets Management**:
- Environment variables (never committed)
- AWS Secrets Manager or HashiCorp Vault (production)
- Rotation policy for API keys

### Rate Limiting

**Per User Limits**:
```
- Registration attempts: 5 per hour per IP
- SMS verifications: 3 per hour per phone
- API calls: 1000 per hour per user
- Messages sent: 100 per hour per user
- Forum posts: 20 per hour per user
```

**Implementation**: Redis-based token bucket algorithm

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Input Validation

- All inputs sanitized
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- File upload restrictions (type, size)
- Phone number validation (libphonenumber)
- Email validation (RFC 5322)

---

## Deployment Architecture

### Development Environment

```
- Local machines (macOS/Linux/Windows)
- Docker Compose for local services
- PostgreSQL, Redis containers
- Mock external services (Twilio, SendGrid)
- Hot reload for rapid development
```

### Staging Environment

```
- Cloud-hosted (AWS/GCP/Azure)
- Mirrors production setup
- Test external service integrations
- Separate database (with test data)
- CI/CD automated deployments
```

### Production Environment

**Infrastructure Components**:
```
- Load Balancer (ALB/Cloud Load Balancer)
- Application Servers (auto-scaling group)
- PostgreSQL (managed RDS/Cloud SQL)
- Redis (ElastiCache/Memorystore)
- S3 buckets (object storage)
- CDN (CloudFront/Cloud CDN)
- Monitoring (Prometheus + Grafana)
- Logging (ELK stack or cloud logging)
```

**Scaling Strategy**:
- Horizontal scaling for API servers
- Read replicas for database
- Redis cluster for cache
- CDN for static assets
- Message queue for async processing

**Backup Strategy**:
- Daily database backups (7-day retention)
- Weekly full backups (30-day retention)
- Transaction log backups (PITR)
- S3 versioning for file storage
- Disaster recovery plan

### CI/CD Pipeline

**On Pull Request**:
```
1. Code linting
2. Unit tests
3. Integration tests
4. Security scanning
5. Build Docker images
6. Deploy to preview environment
```

**On Merge to Main**:
```
1. Run full test suite
2. Build production images
3. Tag with version
4. Deploy to staging
5. Run smoke tests
6. Manual approval gate
7. Deploy to production
8. Health check monitoring
```

---

## Technology Decisions

### Backend Language: Node.js (TypeScript) ✅ DECIDED

**Rationale**:
- Developer familiarity (user preference)
- Excellent async/await support for serverless
- Rich npm ecosystem for AWS SDK and integrations
- Great TypeScript support for type safety
- Perfect for Lambda functions (fast cold starts)
- Mature serverless framework support

**Alternatives Considered**: Python (FastAPI) - not chosen due to developer preference

### Database: Amazon DynamoDB ✅ DECIDED

**Rationale**:
- **9x cheaper** than PostgreSQL RDS (~$20-40/mo vs $90/mo)
- True serverless - scales to zero when idle
- Perfect for sporadic traffic patterns (reunion app)
- Sub-10ms latency for queries
- No server management required
- DynamoDB Streams for event-driven architecture
- On-demand billing ideal for unpredictable usage
- AWS Startup Credits last 10-12 months vs <1 year for RDS

**Alternatives Considered**: PostgreSQL (Aurora Serverless) - too expensive for this use case

### Architecture: Serverless (AWS Lambda) ✅ DECIDED

**Rationale**:
- User preference for serverless over containers
- Pay only for what you use (cost-effective)
- No server management overhead
- Auto-scaling built-in
- Perfect for solo developer
- Integrates seamlessly with DynamoDB, S3, SNS, SES
- Lower operational complexity

**Alternatives Considered**: Docker containers with ECS - rejected per user preference

### SMS Provider: AWS SNS ✅ DECIDED

**Rationale**:
- **50-80% cheaper** than Twilio for international SMS
- Integrated with AWS ecosystem
- Reliable for Hong Kong + worldwide destinations
- ~$0.008-0.04 per SMS vs Twilio's ~$0.05-0.15
- Direct Lambda integration
- No third-party dependency

**Alternatives Considered**: Twilio - too expensive for international SMS

### Email Provider: AWS SES ✅ DECIDED

**Rationale**:
- $0.10 per 1,000 emails (very cost-effective)
- Integrated with AWS
- Easy Lambda integration
- Reliable delivery
- Inbound email support via S3

**Alternatives Considered**: SendGrid - AWS SES more cost-effective and integrated

### Frontend: Flutter ✅ DECIDED

**Rationale**:
- True cross-platform (iOS, Android, Web)
- Single codebase reduces maintenance
- Excellent performance
- Beautiful UI capabilities
- Growing community
- Dart language is straightforward

**Alternatives Considered**: React Native, Native (Swift/Kotlin)

### State Management: Riverpod ✅ DECIDED

**Rationale**:
- Modern, compile-safe
- Great developer experience
- Good for complex state
- Active community
- Better than Provider for this scale

**Alternatives Considered**: Bloc, Provider

### Hosting: AWS ✅ DECIDED

**Rationale**:
- User preference for AWS
- 100% serverless stack possible
- $1,000 startup credits available
- Comprehensive services (Lambda, DynamoDB, S3, SNS, SES, CloudFront)
- Good documentation
- Mature ecosystem

**Alternatives Considered**: GCP - not chosen due to user AWS preference

---

## Performance Targets

**API Response Times**:
- P50: < 100ms
- P95: < 300ms
- P99: < 500ms

**Message Delivery**:
- In-app: < 1 second
- WhatsApp: < 5 seconds
- Email: < 30 seconds
- SMS: < 10 seconds

**Database Queries**:
- Simple queries: < 10ms
- Complex queries: < 50ms
- Aggregations: < 100ms

**Concurrent Users**:
- Target: 1000 concurrent
- Burst capacity: 2000 concurrent

---

## Monitoring & Observability

**Metrics to Track**:
- API request rates and latency
- Database connection pool usage
- Cache hit rates
- Message delivery success rates
- Error rates by endpoint
- User engagement metrics

**Logging**:
- Structured JSON logs
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for tracing
- PII redaction in logs

**Alerting**:
- API error rate > 5%
- Database connections > 80%
- Message delivery failure > 10%
- Disk usage > 80%
- SSL certificate expiration

**Tools**:
- AWS CloudWatch (metrics, logs, alarms)
- AWS X-Ray (distributed tracing)
- Sentry (error tracking, optional)
- Uptime Robot or similar (uptime monitoring)

---

## Future Architectural Considerations

**Potential Evolutions**:

1. **Multi-Region Deployment**: For global expansion and disaster recovery
   - DynamoDB Global Tables
   - Multi-region Lambda deployments
   - Route 53 for failover

2. **Event Sourcing**: For better auditability and replay capabilities
   - Full event log in DynamoDB
   - Event replay for debugging

3. **GraphQL with AppSync**: If client needs become complex
   - Real-time subscriptions built-in
   - Optimized for mobile apps

4. **Step Functions**: For complex workflows
   - Multi-step approval processes
   - Scheduled digest generation

5. **ML/AI Enhancements**:
   - AWS Rekognition for photo face detection
   - AWS Comprehend for content moderation
   - Personalized recommendations

6. **Multi-Tenant Architecture**: Support other graduating classes
   - Tenant isolation in DynamoDB
   - Separate S3 prefixes per tenant
   - Shared Lambda functions

---

**Document Version**: 2.0
**Last Updated**: 2025-11-16
**Author**: Claude (AI Assistant)
**Status**: Serverless Architecture - Node.js + DynamoDB
**Major Changes in v2.0**:
- Complete redesign for AWS serverless architecture
- Replaced PostgreSQL with DynamoDB schema (11 tables)
- Updated from Python to Node.js (TypeScript)
- Added photo tagging tables (Photos, PhotoTags, Classrooms, UserClassrooms)
- Changed from containers to Lambda functions
- Updated all integrations to AWS services (SNS, SES)
- Added DynamoDB design considerations and query patterns
- Updated technology decisions with cost rationale
