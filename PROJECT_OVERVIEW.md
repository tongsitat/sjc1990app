# Project Overview: High School Classmates Connection Platform

## Executive Summary

**Project Name**: SJC1990 Classmates Connection Platform (working title)

**Vision**: Create a trusted, unified communication platform that connects high school classmates across multiple communication channels (mobile app, SMS, email, WhatsApp) while respecting individual platform preferences and privacy concerns.

**Built by**: A trusted classmate with 35 years of reunion organizing experience

**Target Users**: High school classmates from the class of 1990 and potentially other graduating classes

---

## The Problem

### Current Situation

High school classmates want to stay connected, but face several challenges:

1. **Platform Fragmentation**: Not everyone uses the same communication platform
   - Some prefer WhatsApp
   - Others use Facebook groups
   - Some avoid social media entirely
   - Many only use SMS and email

2. **Trust Issues**: Concerns about data privacy on large social platforms

3. **Exclusion**: Classmates who don't use popular platforms get left out of group communications

4. **Organizing Challenges**: Reunion organizer struggles to reach everyone effectively

### User Personas

**Persona 1: "The Social Media User" - Sarah**
- Uses WhatsApp and Facebook daily
- Comfortable with technology
- Wants quick, real-time communication
- Concerned about who sees her information

**Persona 2: "The Privacy-Conscious" - Michael**
- Avoids Facebook and WhatsApp
- Only uses email and SMS
- Values privacy and data control
- Still wants to stay connected with classmates

**Persona 3: "The Reunion Organizer" - You**
- Needs to reach everyone regardless of platform
- Maintains contact lists for 35 years
- Trusted by all classmates
- Wants efficient way to coordinate events

**Persona 4: "The Occasional User" - David**
- Checks messages infrequently
- Prefers email for important updates
- Not interested in daily chatter
- Wants to hear about reunions and major events

---

## The Solution

### Core Value Proposition

A **trusted, self-hosted communication platform** that:

1. **Unifies Communication**: Bridges WhatsApp, SMS, email, and native app users
2. **Respects Preferences**: Each user chooses their preferred communication channel
3. **Ensures Trust**: Built and operated by a trusted classmate, not a corporation
4. **Maintains Privacy**: Users control who sees their information
5. **Enables Flexibility**: Supports both real-time and asynchronous communication

### Key Features

#### Phase 1: User Registration & Authentication

**3-Step Onboarding Process**:

1. **Step 1: Identity Verification**
   - User provides real name (as known in school)
   - Provides phone number
   - Receives SMS verification code
   - Enters verification code to confirm identity

2. **Step 2: Peer Approval**
   - New user's registration triggers notification to existing members
   - One or more existing users must approve the new member
   - Approval confirms: "Yes, this person was in our class"
   - Prevents unauthorized access

3. **Step 3: Preferences & Classification**
   - **Communication Preferences**:
     - Primary channel: App / WhatsApp / Email / SMS
     - Frequency: Real-time / Daily digest / Weekly digest
     - Quiet hours: Don't disturb schedule
   - **Privacy Settings**:
     - Who can see phone number: Everyone / Friends only / Nobody
     - Who can see email: Everyone / Friends only / Nobody
     - Who can message directly: Everyone / Friends only
   - **Class/House Identification**:
     - Which graduating class (e.g., 1990)
     - Which house/section (if applicable)
     - School activities/clubs participated in

#### Phase 2: Core Communication Features

**1:1 Messaging**:
- Direct messaging between any two users
- Works across different platforms
- Example: User A (email-only) can message User B (WhatsApp-only)
- System bridges the communication

**Main Forum** (Community-wide):
- All members can participate
- General discussions, announcements, reunion planning
- Similar to a WhatsApp Community main group

**Interest-Based Sub-Forums**:
- Users can create or join topic-specific forums
- Examples:
  - Golf Buddies
  - Dining & Food Lovers
  - Travel Enthusiasts
  - Book Club
  - Career Networking
- Similar to WhatsApp groups within a Community
- Users choose which forums to join

**Forum Features**:
- Create new forum (with approval or auto-creation)
- Join/leave forums
- Post messages, photos, links
- Reply to threads
- @mention users
- Pin important messages
- Search message history

#### Phase 3: Cross-Channel Communication Bridge (PRIORITY)

**The Core Innovation**: Message routing across different platforms

**Scenario Examples**:

1. **Email ↔ WhatsApp**:
   - Person A (email-only) wants to contact Person B (WhatsApp-only)
   - Person A sends message via email to system
   - System recognizes Person A's identity
   - System sends message to Person B via WhatsApp
   - Message shows: "From [Person A's Name]"
   - Person B replies in WhatsApp
   - System routes reply to Person A's email
   - Conversation continues seamlessly

2. **App ↔ SMS**:
   - Person C uses the mobile app
   - Person D only uses SMS
   - Person C sends message in app
   - System sends SMS to Person D
   - Person D replies via SMS
   - Reply appears in Person C's app

3. **Forum Participation Across Channels**:
   - Main forum has message posted in app
   - Email users receive digest (daily/weekly)
   - WhatsApp users see message in WhatsApp group
   - SMS users receive text notification for important posts
   - Replies from any channel appear in all channels

**Message Routing Engine Requirements**:
- Maintain user identity across channels
- Track conversation threads
- Handle message formatting differences
- Manage media attachments (photos, documents)
- Queue messages if delivery fails
- Retry with backoff
- Notify sender if delivery ultimately fails

**Channel-Specific Handling**:

- **WhatsApp**:
  - Use WhatsApp Business API
  - Respect template requirements for initial contact
  - Handle media files
  - Support group messaging

- **Email**:
  - Professional formatting
  - Thread management (Re: subject lines)
  - HTML email with plain text fallback
  - Attachment handling
  - SPF/DKIM for deliverability

- **SMS**:
  - 160 character limit awareness
  - Link shortening
  - Split long messages
  - Cost management (don't spam)
  - Short codes for replies

- **In-App**:
  - Rich formatting
  - Push notifications
  - Real-time updates via WebSocket
  - Offline support with sync

#### Phase 4: Advanced Features (Future)

**AI-Powered Features**:
- Message summarization for digest users
- Sentiment analysis for moderation
- Smart notification timing
- Duplicate message detection
- Translation for international classmates

**Event Management**:
- Reunion planning tools
- RSVP tracking
- Calendar integration
- Venue suggestions
- Photo sharing from events

**Media Handling**:
- Shared photo albums
- Video messages
- Document sharing
- File size optimization per channel

**Analytics & Insights** (for organizer):
- Engagement metrics
- Platform usage statistics
- Message delivery success rates
- User activity patterns

---

## User Workflows

### Workflow 1: New User Registration

```
1. User visits app/website or receives SMS invitation
2. Clicks "Join Our Classmates Network"
3. Enters real name and phone number
4. Receives SMS verification code
5. Enters code to verify phone
6. Registration pending approval
7. System notifies existing members
8. Existing member(s) approve new user
9. User receives approval notification
10. User sets communication preferences
11. User identifies class/house affiliation
12. User can now access the platform
```

### Workflow 2: Cross-Channel 1:1 Messaging

```
Email User (Person A) → WhatsApp User (Person B):

1. Person A sends email to: personb@classmates.yourdomain.com
2. System receives email, identifies Person A by email address
3. System looks up Person B's preferences: WhatsApp primary
4. System formats message for WhatsApp
5. System sends WhatsApp message to Person B
6. Message shows: "From Person A: [message content]"
7. Person B sees message in WhatsApp
8. Person B replies in WhatsApp
9. System receives WhatsApp reply via webhook
10. System identifies conversation thread
11. System formats reply as email
12. System sends email to Person A
13. Conversation continues seamlessly
```

### Workflow 3: Multi-Channel Forum Post

```
User posts in "Golf Buddies" Forum:

1. User posts "Anyone want to golf this Saturday?" in app
2. System identifies all "Golf Buddies" forum members
3. For each member, system checks preference:
   - Real-time app users: Push notification immediately
   - Real-time WhatsApp users: Message to WhatsApp group
   - Daily digest email users: Queue for evening digest
   - Weekly digest email users: Queue for Sunday digest
   - SMS users: No notification (forum post, not direct message)
4. Messages delivered according to preferences
5. Replies from any channel update the forum thread
6. Thread visible to all members in their preferred format
```

---

## Technical Requirements

### Functional Requirements

**Must Have (MVP)**:
1. SMS-based phone verification
2. Peer approval system
3. User preference management
4. 1:1 cross-channel messaging (at least 2 channels)
5. Basic forum/group messaging
6. Message routing engine
7. Mobile app (iOS and Android)
8. Web interface

**Should Have (V1)**:
1. All 4 channels supported (App, WhatsApp, Email, SMS)
2. Multiple forums/interest groups
3. Media sharing (photos)
4. Message threading
5. Search functionality
6. User profile pages
7. Admin dashboard

**Could Have (Future)**:
1. AI-powered features
2. Event management
3. Advanced analytics
4. Video messaging
5. Translation
6. Calendar integration

### Non-Functional Requirements

**Security**:
- End-to-end encryption for in-app messages
- Encrypted storage of PII (phone numbers, emails)
- Secure API authentication (JWT)
- Rate limiting to prevent abuse
- Regular security audits
- GDPR compliance (data export/deletion)

**Performance**:
- Message delivery within 5 seconds for real-time channels
- App startup time < 3 seconds
- Support 1000 concurrent users
- 99.5% uptime
- Database response time < 100ms

**Scalability**:
- Architecture supports growth to 10,000 users
- Horizontal scaling for backend services
- Message queue for handling spikes
- CDN for media files

**Usability**:
- Simple, intuitive UI
- Accessibility compliance (WCAG 2.1 AA)
- Support for multiple languages
- Offline mode for mobile app
- Clear error messages

**Reliability**:
- Message delivery retry mechanism
- Graceful degradation if external services fail
- Backup and disaster recovery
- Monitoring and alerting
- Audit logs for troubleshooting

---

## Success Metrics

### User Adoption
- Target: 80% of classmates register within 6 months
- Monthly active users: 60%+
- Cross-channel usage: 40%+ users interact across platforms

### Engagement
- Average messages per user per week: 5+
- Forum participation: 50%+ users post monthly
- Response rate to reunion planning: 80%+

### Technical Performance
- Message delivery success rate: 99%+
- Average delivery time: < 5 seconds
- App crash rate: < 1%
- User-reported bugs: < 5 per month

### User Satisfaction
- Net Promoter Score (NPS): 50+
- User retention after 3 months: 70%+
- Privacy satisfaction: 90%+ feel their data is safe

---

## Risks and Mitigation

### Technical Risks

**Risk 1: WhatsApp API Approval Delay**
- *Impact*: Can't launch with WhatsApp support
- *Mitigation*: Start with Email + SMS + App, add WhatsApp later
- *Probability*: Medium

**Risk 2: SMS Costs**
- *Impact*: High operational costs with many users
- *Mitigation*: Encourage app adoption, use SMS sparingly, consider cost-sharing
- *Probability*: High

**Risk 3: Email Deliverability**
- *Impact*: Messages marked as spam
- *Mitigation*: Proper SPF/DKIM setup, gradual sending ramp-up, user whitelist
- *Probability*: Medium

**Risk 4: Cross-Channel Message Formatting**
- *Impact*: Messages look broken on some platforms
- *Mitigation*: Extensive testing, graceful degradation, format conversion layer
- *Probability*: High

### Business Risks

**Risk 5: Low User Adoption**
- *Impact*: Platform has few users, not useful
- *Mitigation*: Personal outreach, demonstrate value, start with reunion planning
- *Probability*: Medium

**Risk 6: Privacy Concerns**
- *Impact*: Users don't trust the platform
- *Mitigation*: Transparency about data usage, open-source consideration, clear privacy policy
- *Probability*: Low (you're trusted organizer)

**Risk 7: Maintenance Burden**
- *Impact*: Becomes too much work to maintain
- *Mitigation*: Automated monitoring, modular architecture, community moderators
- *Probability*: Medium

---

## Project Constraints

### Budget
- Bootstrapped project (personal investment)
- Cost-conscious technology choices
- Pay-as-you-grow service selection

### Timeline
- No hard deadline
- Iterative development approach
- MVP within 6-9 months (target)

### Resources
- Solo developer (with AI assistance)
- Potential volunteer moderators from classmates
- Community-driven feature prioritization

### Compliance
- GDPR (if any EU users)
- TCPA (telephone consumer protection)
- CAN-SPAM (email regulations)
- WhatsApp Business API terms
- Twilio acceptable use policy

---

## Open Questions & Future Exploration

### To Be Decided

1. **Backend Language**: Python (FastAPI) vs Node.js (NestJS)?
   - Consider: Team expertise, ecosystem, performance needs

2. **Database**: PostgreSQL vs MongoDB?
   - Consider: Relational needs, scalability, query patterns

3. **Hosting**: AWS vs GCP vs Azure vs Digital Ocean?
   - Consider: Cost, features needed, complexity

4. **State Management (Flutter)**: Provider vs Riverpod vs Bloc?
   - Consider: App complexity, team preference, community support

5. **Monetization**: Free forever? Freemium? Donation-based?
   - Consider: Sustainability, user expectations

### Future Features to Explore

1. **Birthday/Anniversary Reminders**
2. **Classmate Directory with Search**
3. **Memory Lane**: Shared photos from school days
4. **Mentorship Connections**: Career networking
5. **Local Meetup Coordination**: Small group gatherings
6. **Memorial Section**: Remember deceased classmates
7. **Family Connections**: Spouses and children network
8. **Integration with School Alumni Association**

---

## Next Steps

### Immediate Actions

1. **Finalize Architecture**: Create detailed architecture document
2. **Technology Selection**: Decide on backend language, database, hosting
3. **Set Up Development Environment**: Install tools, create project structure
4. **Create Project Roadmap**: Detailed milestones and timeline
5. **Register Domain**: Secure domain name for the platform
6. **Apply for Services**:
   - Twilio account (SMS)
   - SendGrid/AWS SES (Email)
   - WhatsApp Business API (start approval process)

### Phase 1 Development Priorities

1. Backend API foundation
2. Database schema design
3. SMS verification system
4. Basic user authentication
5. Flutter app skeleton
6. Simple 1:1 messaging (in-app only)
7. Deployment to staging environment

---

## Appendix

### Glossary

- **Cross-Channel**: Communication between users on different platforms
- **Channel**: A communication method (App, WhatsApp, Email, SMS)
- **Forum**: A group discussion space, similar to a WhatsApp group
- **Main Forum**: The primary community-wide discussion space
- **Sub-Forum**: Interest-based discussion groups
- **Peer Approval**: Verification by existing members that a new user belongs
- **Message Routing**: System that directs messages to user's preferred channel
- **Digest**: Batched summary of messages sent periodically

### References

- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Twilio SMS: https://www.twilio.com/docs/sms
- SendGrid Email: https://docs.sendgrid.com/
- Flutter Documentation: https://docs.flutter.dev/
- GDPR Compliance: https://gdpr.eu/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Author**: Claude (based on project requirements from tongsitat)
