# API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://your-domain.com/api`

## Authentication
All protected endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Response Format
All responses follow this format:
```json
{
  "data": {},
  "error": "Error message (if any)",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student", // or "counsellor"
  "phone": "+1234567890", // optional
  "specialization": "Anxiety Disorders" // required for counsellors
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "approved": true
  },
  "needsApproval": false
}
```

#### POST /auth/verify
Verify Firebase ID token and get user profile.

**Request Body:**
```json
{
  "idToken": "firebase_id_token"
}
```

**Response:**
```json
{
  "user": {
    "uid": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "isBlocked": false,
    "approved": true
  },
  "tokenValid": true
}
```

### Chatbot

#### POST /chatbot/phq
Start or continue PHQ-9 depression assessment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "step": 1,
  "answer": 2, // 0-3 scale
  "sessionId": "optional_session_id"
}
```

**Response:**
```json
{
  "completed": false,
  "step": 2,
  "totalSteps": 9,
  "question": "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
  "options": [
    {"value": 0, "text": "Not at all"},
    {"value": 1, "text": "Several days"},
    {"value": 2, "text": "More than half the days"},
    {"value": 3, "text": "Nearly every day"}
  ],
  "sessionId": "session_id",
  "progress": 11
}
```

#### POST /chatbot/gad
Start or continue GAD-7 anxiety assessment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "step": 1,
  "answer": 1,
  "sessionId": "optional_session_id"
}
```

#### POST /chatbot/ai
Chat with AI counsellor.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "I'm feeling anxious about my exams",
  "sessionId": "optional_session_id",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "I understand that exam anxiety can be overwhelming. Would you like to try some breathing exercises or talk about what specifically worries you about the exams?",
  "suggestions": ["Breathing exercises", "Talk about worries", "Study tips"],
  "sessionId": "session_id",
  "isCrisis": false
}
```

### Users

#### GET /users/profile/:userId?
Get user profile (own profile if no userId provided).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "student",
    "profileComplete": true,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### PUT /users/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio",
  "languages": ["en", "es"]
}
```

#### GET /users/counsellors
Get list of available counsellors.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `specialization`: Filter by specialization
- `language`: Filter by language
- `available`: Filter by current availability

**Response:**
```json
{
  "counsellors": [
    {
      "id": "counsellor_id",
      "name": "Dr. Jane Smith",
      "specialization": "Anxiety Disorders",
      "bio": "Licensed therapist with 10 years experience",
      "languages": ["en", "es"],
      "rating": 4.8,
      "totalSessions": 150
    }
  ]
}
```

### Bookings

#### POST /bookings
Create a new booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "counsellorId": "counsellor_id",
  "scheduledAt": "2023-12-01T14:00:00.000Z",
  "type": "chat", // or "audio"
  "notes": "First session for anxiety management",
  "preferredLanguage": "en"
}
```

**Response:**
```json
{
  "message": "Booking request created successfully",
  "bookingId": "booking_id",
  "status": "pending",
  "scheduledAt": "2023-12-01T14:00:00.000Z"
}
```

#### GET /bookings/my-bookings
Get user's bookings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filter by status (pending, confirmed, completed, cancelled)
- `type`: Filter by type (chat, audio)
- `upcoming`: Filter upcoming bookings only

**Response:**
```json
{
  "bookings": [
    {
      "id": "booking_id",
      "scheduledAt": "2023-12-01T14:00:00.000Z",
      "type": "chat",
      "status": "confirmed",
      "counsellor": {
        "id": "counsellor_id",
        "name": "Dr. Jane Smith",
        "specialization": "Anxiety Disorders"
      }
    }
  ]
}
```

### Resources

#### GET /resources
Get wellness resources.

**Query Parameters:**
- `type`: Filter by type (article, video, game, pdf, audio)
- `language`: Filter by language (en, te, hi, ta)
- `category`: Filter by category
- `search`: Search term

**Response:**
```json
{
  "resources": [
    {
      "id": "resource_id",
      "title": "Understanding Anxiety",
      "description": "A comprehensive guide to anxiety disorders",
      "type": "article",
      "language": "en",
      "category": "anxiety",
      "rating": 4.5,
      "viewCount": 150
    }
  ],
  "total": 25
}
```

#### GET /resources/:resourceId
Get specific resource details.

**Response:**
```json
{
  "resource": {
    "id": "resource_id",
    "title": "Understanding Anxiety",
    "description": "A comprehensive guide to anxiety disorders",
    "content": "Full article content...",
    "type": "article",
    "language": "en",
    "category": "anxiety",
    "rating": 4.5,
    "viewCount": 151,
    "relatedResources": ["resource_id_2", "resource_id_3"]
  }
}
```

### Reports

#### POST /reports
Create a new report.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reportedId": "user_id",
  "reason": "Inappropriate behavior during session",
  "type": "inappropriate_behavior",
  "sessionId": "session_id", // optional
  "evidence": "Screenshots or additional details" // optional
}
```

**Response:**
```json
{
  "message": "Report submitted successfully",
  "reportId": "report_id",
  "priority": "medium",
  "status": "open"
}
```

### ML Services

#### POST /ml/crisis-detect
Analyze text for crisis indicators.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "I don't want to live anymore",
  "language": "en"
}
```

**Response:**
```json
{
  "isCrisis": true,
  "confidence": 0.95,
  "method": "keyword",
  "language": "en"
}
```

#### POST /ml/sentiment
Analyze text sentiment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "I'm feeling really happy today!",
  "language": "en"
}
```

**Response:**
```json
{
  "polarity": 0.8,
  "subjectivity": 0.6,
  "label": "positive",
  "confidence": 0.9,
  "language": "en"
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- ML endpoints: 50 requests per 15 minutes per user
- Crisis detection: 20 requests per 15 minutes per user

## Webhooks

### Crisis Detection Alert
Triggered when crisis language is detected.

**Payload:**
```json
{
  "event": "crisis_detected",
  "userId": "user_id",
  "confidence": 0.95,
  "timestamp": "2023-01-01T00:00:00.000Z",
  "reportId": "report_id"
}
```

### Booking Status Change
Triggered when booking status changes.

**Payload:**
```json
{
  "event": "booking_status_changed",
  "bookingId": "booking_id",
  "oldStatus": "pending",
  "newStatus": "confirmed",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```