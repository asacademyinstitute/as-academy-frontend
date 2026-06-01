# AS Academy Backend Analysis Report

Generated on: June 1, 2026

---

## Table of Contents
1. [Complete API Documentation](#1-complete-api-documentation)
2. [Authentication Flow](#2-authentication-flow)
3. [Database Schema](#3-database-schema)
4. [Storage Flow](#4-storage-flow)
5. [Payment Flow](#5-payment-flow)
6. [Dead Code Report](#6-dead-code-report)
7. [Unused Dependencies](#7-unused-dependencies)
8. [Migration Difficulty Report](#8-migration-difficulty-report)

---

## 1. Complete API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: Configured via `FRONTEND_URL` environment variable

### Authentication
- JWT Access Token (15 minutes expiry)
- JWT Refresh Token (7 days expiry)
- Bearer Token in Authorization header

---

### 1.1 Authentication Endpoints

#### POST `/api/auth/register`
**Description:** Register a new user
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "college_name": "string (optional)",
  "semester": "string (optional)",
  "role": "student|teacher|admin (default: student)"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {...},
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```
**Migration Difficulty:** Easy

---

#### POST `/api/auth/login`
**Description:** Login user with device tracking
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Headers:** `X-Device-ID` (auto-generated if not provided)
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```
**Migration Difficulty:** Easy

---

#### POST `/api/auth/refresh`
**Description:** Refresh access token
**Body:**
```json
{
  "refreshToken": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string"
  }
}
```
**Migration Difficulty:** Easy

---

#### POST `/api/auth/logout`
**Description:** Logout user (revokes refresh token)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "refreshToken": "string"
}
```
**Migration Difficulty:** Easy

---

#### POST `/api/auth/change-password`
**Description:** Change user password
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```
**Migration Difficulty:** Easy

---

#### GET `/api/auth/me`
**Description:** Get current user info
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/auth/admin/reset-device/:userId`
**Description:** Reset student device (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.2 User Endpoints

#### GET `/api/users`
**Description:** Get all users (Admin only)
**Query:** `role`, `status`, `search`, `page`, `limit`
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/users/:id`
**Description:** Get user by ID
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/users`
**Description:** Create user (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PUT `/api/users/:id`
**Description:** Update user
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### DELETE `/api/users/:id`
**Description:** Delete user (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PATCH `/api/users/:id/status`
**Description:** Block/Unblock user (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/users/:id/courses`
**Description:** Get user's enrolled courses
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/users/:id/stats`
**Description:** Get user statistics
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/users/:id/reset-device`
**Description:** Reset device (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/users/:id/devices`
**Description:** Get user devices (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/users/request-course`
**Description:** Request course creation (Teacher only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.3 Course Endpoints

#### GET `/api/courses`
**Description:** Get all courses (public with optional auth)
**Query:** `status`, `teacherId`, `search`, `page`, `limit`
**Migration Difficulty:** Easy

---

#### GET `/api/courses/:id`
**Description:** Get course by ID (public with optional auth)
**Migration Difficulty:** Easy

---

#### POST `/api/courses`
**Description:** Create course (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PUT `/api/courses/:id`
**Description:** Update course (Admin or assigned teacher)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### DELETE `/api/courses/:id`
**Description:** Delete course (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/courses/:id/stats`
**Description:** Get course statistics
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/courses/teacher/:teacherId`
**Description:** Get courses by teacher
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.4 Chapter Endpoints

#### GET `/api/chapters/course/:courseId`
**Description:** Get chapters by course
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/chapters/:id`
**Description:** Get chapter by ID
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/chapters`
**Description:** Create chapter (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PUT `/api/chapters/:id`
**Description:** Update chapter (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### DELETE `/api/chapters/:id`
**Description:** Delete chapter (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/chapters/course/:courseId/reorder`
**Description:** Reorder chapters (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.5 Lecture Endpoints

#### GET `/api/lectures/chapter/:chapterId`
**Description:** Get lectures by chapter
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/lectures/:id`
**Description:** Get lecture by ID
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/lectures`
**Description:** Create lecture (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PUT `/api/lectures/:id`
**Description:** Update lecture (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### DELETE `/api/lectures/:id`
**Description:** Delete lecture (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/lectures/chapter/:chapterId/reorder`
**Description:** Reorder lectures (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/lectures/:id/progress`
**Description:** Get lecture progress (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/lectures/:id/progress`
**Description:** Update lecture progress (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.6 Enrollment Endpoints

#### GET `/api/enrollments/student/:studentId`
**Description:** Get student enrollments
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/enrollments/course/:courseId`
**Description:** Get course enrollments (Teacher/Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/enrollments/check/:courseId`
**Description:** Check access (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/enrollments/admin-enroll`
**Description:** Admin enroll student (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "student_id": "uuid",
  "course_id": "uuid",
  "validity_days": "number"
}
```
**Migration Difficulty:** Easy

---

#### POST `/api/enrollments/:enrollmentId/extend`
**Description:** Extend enrollment (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/enrollments/:enrollmentId/cancel`
**Description:** Cancel enrollment (Teacher/Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### DELETE `/api/enrollments/:enrollmentId`
**Description:** Delete enrollment (Teacher/Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/enrollments/:enrollmentId/unblock`
**Description:** Unblock enrollment (Teacher/Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/enrollments/course/:courseId/bulk-remove`
**Description:** Bulk remove students (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/enrollments/course/:courseId/progress`
**Description:** Get course progress (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.7 Payment Endpoints

#### POST `/api/payments/create-order`
**Description:** Create Razorpay order
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "courseId": "uuid",
  "amount": "number"
}
```
**Migration Difficulty:** Medium (Razorpay integration)

---

#### POST `/api/payments/verify`
**Description:** Verify payment
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "orderId": "string",
  "paymentId": "string",
  "signature": "string"
}
```
**Migration Difficulty:** Medium (Razorpay integration)

---

#### POST `/api/payments/webhook`
**Description:** Razorpay webhook handler
**Headers:** `x-razorpay-signature`
**Migration Difficulty:** Medium (Razorpay integration)

---

#### GET `/api/payments/history`
**Description:** Get payment history
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.8 Streaming Endpoints

#### GET `/api/streaming/video/:lectureId`
**Description:** Get video stream URL (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Medium (Signed URL generation)

---

#### GET `/api/streaming/pdf/:lectureId`
**Description:** Get PDF stream URL (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Medium (Signed URL generation)

---

### 1.9 Quiz Endpoints

#### GET `/api/quizzes/course/:courseId`
**Description:** Get quizzes by course
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/quizzes/:id`
**Description:** Get quiz by ID (Teachers see answers, students don't)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/quizzes`
**Description:** Create quiz (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/quizzes/:id/submit`
**Description:** Submit quiz (Student)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "answers": {...}
}
```
**Migration Difficulty:** Easy

---

#### GET `/api/quizzes/student/:studentId/attempts`
**Description:** Get student attempts
**Query:** `quizId`
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### DELETE `/api/quizzes/:id`
**Description:** Delete quiz (Teacher or Admin)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.10 Certificate Endpoints

#### POST `/api/certificates/generate`
**Description:** Generate certificate (Student)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "courseId": "uuid"
}
```
**Migration Difficulty:** Medium (PDF generation + storage)

---

#### GET `/api/certificates/student/:studentId`
**Description:** Get student certificates
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/certificates/:id/download`
**Description:** Get certificate download URL (Student)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Medium (Signed URL)

---

#### GET `/api/certificates/verify/:certificateNumber`
**Description:** Verify certificate (Public)
**Migration Difficulty:** Easy

---

### 1.11 Audit Endpoints

#### GET `/api/audit`
**Description:** Get audit logs (Admin only)
**Query:** `userId`, `action`, `startDate`, `endDate`, `page`, `limit`
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/audit/user/:userId`
**Description:** Get user activity (Admin only)
**Query:** `days`
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.12 AI Endpoints

#### POST `/api/ai/solve-doubt`
**Description:** Solve doubt using AI (Student)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "question": "string",
  "context": "string (optional)"
}
```
**Migration Difficulty:** Hard (AI API integration)

---

#### POST `/api/ai/summarize`
**Description:** Summarize content using AI (Student)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "content": "string"
}
```
**Migration Difficulty:** Hard (AI API integration)

---

#### POST `/api/ai/study-tips`
**Description:** Get study tips using AI (Student)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "topic": "string"
}
```
**Migration Difficulty:** Hard (AI API integration)

---

### 1.13 Security Endpoints

#### GET `/api/security/watermark-data`
**Description:** Get watermark data for current user
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Medium (Watermarking logic)

---

#### POST `/api/security/report-violation`
**Description:** Report security violation
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "violationType": "string",
  "deviceInfo": "object"
}
```
**Migration Difficulty:** Easy

---

#### GET `/api/security/violations`
**Description:** Get security violations (Admin only)
**Query:** `userId`, `violationType`, `limit`
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/security/stats`
**Description:** Get security statistics (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

### 1.14 Notification Endpoints

#### GET `/api/notifications`
**Description:** Get all notifications for user
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/notifications/unread`
**Description:** Get unread notifications
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### GET `/api/notifications/unread-count`
**Description:** Get unread count
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PATCH `/api/notifications/:id/read`
**Description:** Mark notification as read
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PATCH `/api/notifications/mark-all-read`
**Description:** Mark all as read
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### POST `/api/notifications/live-class`
**Description:** Notify live class (Admin/Teacher only)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "courseId": "uuid"
}
```
**Migration Difficulty:** Medium (FCM integration)

---

#### POST `/api/notifications/new-content`
**Description:** Notify new content (Admin/Teacher only)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "courseId": "uuid",
  "contentType": "string",
  "contentTitle": "string"
}
```
**Migration Difficulty:** Medium (FCM integration)

---

### 1.15 Settings Endpoints

#### GET `/api/settings`
**Description:** Get system settings
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

#### PUT `/api/settings`
**Description:** Update system settings (Admin only)
**Headers:** `Authorization: Bearer <token>`
**Migration Difficulty:** Easy

---

## 2. Authentication Flow

### 2.1 Registration Flow
```
1. User submits registration data
2. Backend checks if email already exists
3. Password is hashed using bcrypt (10 rounds)
4. User record created in Supabase
5. JWT access token generated (15 min expiry)
6. JWT refresh token generated (7 days expiry)
7. Refresh token stored in database with device_id
8. Tokens returned to client
```

**Migration Difficulty:** Easy

---

### 2.2 Login Flow
```
1. User submits email and password
2. Device ID generated from request headers/IP
3. Backend fetches user by email
4. Password verified using bcrypt
5. For students: Device limit checked (default: 1 device)
   - If device limit reached, login blocked
   - If new device, check against registered devices
6. User status checked (active/blocked)
7. JWT access token generated (includes deviceId for students)
8. JWT refresh token generated
9. Refresh token stored with device association
10. Tokens returned to client
```

**Migration Difficulty:** Easy

---

### 2.3 Token Refresh Flow
```
1. Client sends refresh token
2. Backend verifies refresh token signature
3. Backend checks if token exists in database
4. Backend checks if token is revoked
5. Backend checks if token is expired
6. New access token generated
7. Access token returned to client
```

**Migration Difficulty:** Easy

---

### 2.4 Device Tracking (Students Only)
```
1. Device ID generated from: IP + User-Agent + Device headers
2. On login, device ID is stored in user_devices table
3. Device limit enforced (configurable via system_settings)
4. JWT access token includes deviceId for validation
5. Every request validates deviceId matches current device
6. Admin can reset student devices via API
```

**Migration Difficulty:** Medium (Device fingerprinting logic)

---

### 2.5 Role-Based Access Control (RBAC)
```
Roles: student, teacher, admin

Middleware:
- authenticate: Verifies JWT token
- authorize(roles): Checks user role
- isStudent: Student only
- isTeacher: Teacher only
- isAdmin: Admin only
- isTeacherOrAdmin: Teacher or Admin
- isAdminOrSelf: Admin or self (for user resources)
```

**Migration Difficulty:** Easy

---

## 3. Database Schema

### 3.1 Core Tables

#### users
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- college_name (VARCHAR)
- semester (VARCHAR)
- password_hash (VARCHAR)
- role (VARCHAR: student|teacher|admin)
- status (VARCHAR: active|blocked|inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- idx_users_email
- idx_users_role
- idx_users_status
```
**Migration Difficulty:** Easy

---

#### courses
```sql
- id (UUID, PK)
- title (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- validity_days (INTEGER, default: 365)
- teacher_id (UUID, FK -> users)
- thumbnail_url (TEXT)
- status (VARCHAR: active|inactive|draft)
- live_class_link (TEXT)
- live_class_scheduled_at (TIMESTAMP)
- live_class_title (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- idx_courses_teacher
- idx_courses_status
```
**Migration Difficulty:** Easy

---

#### chapters
```sql
- id (UUID, PK)
- course_id (UUID, FK -> courses)
- title (VARCHAR)
- chapter_order (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Unique: (course_id, chapter_order)

Indexes:
- idx_chapters_course
- idx_chapters_order
```
**Migration Difficulty:** Easy

---

#### lectures
```sql
- id (UUID, PK)
- chapter_id (UUID, FK -> chapters)
- title (VARCHAR)
- type (VARCHAR: video|pdf|text)
- file_url (TEXT)
- duration (INTEGER, seconds)
- lecture_order (INTEGER)
- b2_file_id (VARCHAR) - Backblaze file ID
- hls_playlist_url (TEXT) - HLS streaming URL
- hls_360p_url (TEXT)
- hls_480p_url (TEXT)
- hls_720p_url (TEXT)
- thumbnail_url (TEXT)
- conversion_status (VARCHAR: pending|completed|failed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Unique: (chapter_id, lecture_order)

Indexes:
- idx_lectures_chapter
- idx_lectures_type
- idx_lectures_order
```
**Migration Difficulty:** Medium (HLS/B2 integration columns)

---

#### enrollments
```sql
- id (UUID, PK)
- student_id (UUID, FK -> users)
- course_id (UUID, FK -> courses)
- enrolled_at (TIMESTAMP)
- valid_until (TIMESTAMP)
- payment_type (VARCHAR: online|offline)
- payment_id (UUID, FK -> payments)
- status (VARCHAR: active|expired|cancelled)

Unique: (student_id, course_id)

Indexes:
- idx_enrollments_student
- idx_enrollments_course
- idx_enrollments_validity
- idx_enrollments_status
```
**Migration Difficulty:** Easy

---

#### payments
```sql
- id (UUID, PK)
- razorpay_order_id (VARCHAR)
- razorpay_payment_id (VARCHAR)
- razorpay_signature (VARCHAR)
- student_id (UUID, FK -> users)
- course_id (UUID, FK -> courses)
- amount (DECIMAL)
- currency (VARCHAR, default: INR)
- status (VARCHAR: pending|success|failed|refunded)
- payment_method (VARCHAR)
- error_description (TEXT)
- paid_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- idx_payments_student
- idx_payments_course
- idx_payments_status
- idx_payments_razorpay_order
```
**Migration Difficulty:** Medium (Razorpay-specific fields)

---

#### quizzes
```sql
- id (UUID, PK)
- course_id (UUID, FK -> courses)
- title (VARCHAR)
- description (TEXT)
- total_marks (INTEGER, default: 100)
- passing_marks (INTEGER, default: 40)
- duration_minutes (INTEGER, default: 60)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- idx_quizzes_course
```
**Migration Difficulty:** Easy

---

#### quiz_questions
```sql
- id (UUID, PK)
- quiz_id (UUID, FK -> quizzes)
- question_text (TEXT)
- option_a (TEXT)
- option_b (TEXT)
- option_c (TEXT)
- option_d (TEXT)
- correct_answer (VARCHAR: A|B|C|D)
- marks (INTEGER, default: 1)
- question_order (INTEGER)
- created_at (TIMESTAMP)

Indexes:
- idx_quiz_questions_quiz
```
**Migration Difficulty:** Easy

---

#### quiz_attempts
```sql
- id (UUID, PK)
- quiz_id (UUID, FK -> quizzes)
- student_id (UUID, FK -> users)
- score (INTEGER)
- total_marks (INTEGER)
- passed (BOOLEAN, default: false)
- started_at (TIMESTAMP)
- submitted_at (TIMESTAMP)
- answers (JSONB)

Indexes:
- idx_quiz_attempts_quiz
- idx_quiz_attempts_student
```
**Migration Difficulty:** Easy

---

#### certificates
```sql
- id (UUID, PK)
- student_id (UUID, FK -> users)
- course_id (UUID, FK -> courses)
- certificate_url (TEXT)
- certificate_number (VARCHAR, UNIQUE)
- issued_date (TIMESTAMP)

Unique: (student_id, course_id)

Indexes:
- idx_certificates_student
- idx_certificates_course
- idx_certificates_number
```
**Migration Difficulty:** Easy

---

#### user_devices
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- device_id (VARCHAR)
- device_name (VARCHAR)
- device_fingerprint (VARCHAR)
- os_version (VARCHAR)
- app_version (VARCHAR)
- is_rooted (BOOLEAN, default: false)
- is_emulator (BOOLEAN, default: false)
- ip_address (VARCHAR)
- user_agent (TEXT)
- last_active (TIMESTAMP)
- created_at (TIMESTAMP)

Unique: (user_id, device_id)

Indexes:
- idx_user_devices_user
- idx_user_devices_device
```
**Migration Difficulty:** Medium (Security tracking fields)

---

#### audit_logs
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- action (VARCHAR)
- description (TEXT)
- ip_address (VARCHAR)
- user_agent (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)

Indexes:
- idx_audit_logs_user
- idx_audit_logs_action
- idx_audit_logs_created
```
**Migration Difficulty:** Easy

---

#### lecture_progress
```sql
- id (UUID, PK)
- student_id (UUID, FK -> users)
- lecture_id (UUID, FK -> lectures)
- completed (BOOLEAN, default: false)
- last_position (INTEGER, default: 0)
- completed_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Unique: (student_id, lecture_id)

Indexes:
- idx_lecture_progress_student
- idx_lecture_progress_lecture
```
**Migration Difficulty:** Easy

---

#### refresh_tokens
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- token (TEXT, UNIQUE)
- device_id (VARCHAR)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- revoked (BOOLEAN, default: false)

Indexes:
- idx_refresh_tokens_user
- idx_refresh_tokens_token
- idx_refresh_tokens_expires
```
**Migration Difficulty:** Easy

---

#### notifications
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- title (VARCHAR)
- message (TEXT)
- type (VARCHAR, default: info)
- topic (VARCHAR)
- data (JSONB)
- read (BOOLEAN, default: false)
- created_at (TIMESTAMP)

Indexes:
- idx_notifications_user
- idx_notifications_created_at
- idx_notifications_read
```
**Migration Difficulty:** Easy

---

#### security_violations
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- violation_type (VARCHAR)
- device_info (JSONB)
- ip_address (VARCHAR)
- user_agent (TEXT)
- created_at (TIMESTAMP)

Indexes:
- idx_security_violations_user
- idx_security_violations_type
- idx_security_violations_created
```
**Migration Difficulty:** Easy

---

#### system_settings
```sql
- id (UUID, PK)
- setting_key (VARCHAR, UNIQUE)
- setting_value (TEXT)
- description (TEXT)
- updated_at (TIMESTAMP)
- updated_by (UUID, FK -> users)

Indexes:
- idx_system_settings_key
```
**Migration Difficulty:** Easy

---

#### fcm_tokens
```sql
- id (UUID, PK)
- user_id (UUID, UNIQUE, FK -> users)
- token (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:
- idx_fcm_tokens_user_id
```
**Migration Difficulty:** Medium (Push notification integration)

---

#### live_classes
```sql
- id (UUID, PK)
- course_id (UUID, FK -> courses)
- title (VARCHAR)
- description (TEXT)
- meeting_url (TEXT)
- scheduled_at (TIMESTAMP)
- duration_minutes (INTEGER, default: 60)
- created_at (TIMESTAMP)

Indexes:
- idx_live_classes_course
- idx_live_classes_scheduled
```
**Migration Difficulty:** Easy

---

### 3.2 Database Functions

#### check_enrollment_validity()
Checks if student has valid enrollment for a course. Auto-updates expired enrollments.

**Migration Difficulty:** Easy

---

#### get_course_progress()
Calculates course completion percentage for a student.

**Migration Difficulty:** Easy

---

#### update_updated_at_column()
Auto-updates updated_at timestamp on row updates.

**Migration Difficulty:** Easy

---

### 3.3 Triggers
- update_users_updated_at
- update_courses_updated_at
- update_chapters_updated_at
- update_lectures_updated_at
- update_payments_updated_at
- update_quizzes_updated_at
- update_lecture_progress_updated_at

**Migration Difficulty:** Easy

---

## 4. Storage Flow

### 4.1 Storage Architecture
```
Primary Storage: Backblaze B2
CDN: AWS CloudFront (for signed URLs)
Backup: Local fallback (optional)
```

**Migration Difficulty:** Medium (B2 + CloudFront setup)

---

### 4.2 File Upload Flow
```
1. Client uploads file to backend (multipart/form-data)
2. Backend validates file type and size
3. Backend generates unique filename
4. Backend uploads to Backblaze B2 via backblaze-b2 SDK
5. B2 returns file ID and URL
6. Backend stores file metadata in database
7. Backend returns file URL to client
```

**Service:** `backblaze.service.js`
**Methods:**
- `authorize()` - Authenticate with B2
- `getUploadUrl()` - Get upload URL
- `uploadFile()` - Upload file buffer
- `deleteFile()` - Delete file
- `listFiles()` - List files in bucket

**Migration Difficulty:** Medium

---

### 4.3 Video Streaming Flow
```
1. Student requests video stream
2. Backend verifies enrollment and validity
3. Backend generates signed URL (2 hour expiry)
4. URL includes signature, expiry, and user ID
5. Client streams video from signed URL
6. URL expires after 2 hours
```

**Service:** `streaming.service.js`
**Methods:**
- `generateVideoStreamUrl()` - Generate signed video URL
- `generatePDFStreamUrl()` - Generate signed PDF URL
- `_generateSignature()` - HMAC-SHA256 signature
- `verifySignature()` - Verify URL signature

**Migration Difficulty:** Medium

---

### 4.4 HLS Video Conversion
```
1. Video uploaded to B2
2. Backend triggers video conversion service
3. Video converted to HLS format (360p, 480p, 720p)
4. Multiple quality versions stored
5. Playlist URL generated
6. Client requests appropriate quality based on bandwidth
```

**Service:** `video-conversion.service.js` (uses fluent-ffmpeg)

**Migration Difficulty:** Hard (FFmpeg setup + processing)

---

### 4.5 Certificate Storage Flow
```
1. Student completes all lectures
2. Backend triggers certificate generation
3. PDF created using PDFKit
4. PDF uploaded to B2
5. Certificate record saved in database
6. Signed URL generated for download
```

**Service:** `certificate.service.js`
**Methods:**
- `generateCertificate()` - Create and upload certificate
- `createCertificatePDF()` - Generate PDF with design
- `getCertificateUrl()` - Get signed download URL
- `verifyCertificate()` - Verify certificate number

**Migration Difficulty:** Medium

---

### 4.6 Storage Security
- All URLs are signed with expiry
- Signature includes user ID and lecture ID
- URLs expire after 2 hours (configurable)
- Device validation for students
- Enrollment validity checked before access

**Migration Difficulty:** Medium

---

## 5. Payment Flow

### 5.1 Payment Architecture
```
Payment Gateway: Razorpay
Currency: INR
Webhook: Enabled for payment status updates
```

**Migration Difficulty:** Medium (Razorpay setup)

---

### 5.2 Payment Creation Flow
```
1. Student selects course
2. Client requests order creation
3. Backend checks if already enrolled
4. Backend creates Razorpay order
5. Backend saves payment record (status: created)
6. Backend returns order details to client
7. Client opens Razorpay checkout
```

**Endpoint:** `POST /api/payments/create-order`
**Service:** `payment.service.js`
**Method:** `createOrder()`

**Migration Difficulty:** Medium

---

### 5.3 Payment Verification Flow
```
1. Razorpay returns payment success
2. Client sends payment details to backend
3. Backend verifies signature using HMAC-SHA256
4. Backend updates payment status to success
5. Backend creates enrollment record
6. Backend sets validity based on course validity_days
7. Backend returns success to client
```

**Endpoint:** `POST /api/payments/verify`
**Service:** `payment.service.js`
**Method:** `processPayment()`

**Migration Difficulty:** Medium

---

### 5.4 Webhook Flow
```
1. Razorpay sends webhook event
2. Backend verifies webhook signature
3. Backend processes event type:
   - payment.captured: Mark payment as success
   - payment.failed: Mark payment as failed
4. Backend updates payment record
5. Backend returns 200 OK
```

**Endpoint:** `POST /api/payments/webhook`
**Service:** `payment.service.js`
**Method:** `handleWebhook()`

**Migration Difficulty:** Medium

---

### 5.5 Payment Status Flow
```
Statuses:
- created: Order created, awaiting payment
- success: Payment successful, enrollment created
- failed: Payment failed
- refunded: Payment refunded (not implemented)
```

**Migration Difficulty:** Easy

---

### 5.6 Offline Enrollment Flow
```
1. Admin manually enrolls student
2. Backend creates enrollment (payment_type: offline)
3. Backend sets validity based on provided days
4. No payment record created
5. Audit log created
```

**Endpoint:** `POST /api/enrollments/admin-enroll`
**Service:** `enrollment.service.js`
**Method:** `adminEnrollStudent()`

**Migration Difficulty:** Easy

---

### 5.7 Payment Security
- Signature verification for all payments
- Webhook signature verification
- Order ID uniqueness
- Double enrollment prevention
- Amount validation

**Migration Difficulty:** Medium

---

## 6. Dead Code Report

### 6.1 Potentially Unused Code

#### 1. `video-conversion.service.js`
**Status:** Service file exists but not used in any route
**Evidence:** No route imports this service
**Recommendation:** Remove if video conversion is not implemented
**Migration Impact:** None

---

#### 2. `query()` function in `database.js`
**Status:** Defined but never used
**Evidence:** No service uses this RPC function
**Recommendation:** Remove if not using custom SQL execution
**Migration Impact:** None

---

#### 3. `execute_sql` RPC function reference
**Status:** Referenced in database.js but function may not exist
**Evidence:** Supabase schema doesn't show this function
**Recommendation:** Remove or implement the function
**Migration Impact:** None

---

#### 4. Empty directories
**Status:** `controllers/`, `utils/`, `validators/` directories are empty
**Evidence:** No files found in these directories
**Recommendation:** Remove if not planning to use this pattern
**Migration Impact:** None

---

### 6.2 Unused Imports

#### 1. `crypto` package
**Status:** Imported in config.js but not used
**Evidence:** No crypto usage in config.js
**Recommendation:** Remove from package.json if not used elsewhere
**Migration Impact:** Low (used in other services)

---

#### 2. `firebase-admin` package
**Status:** In package.json but not imported in any file
**Evidence:** No import found in codebase
**Recommendation:** Remove if FCM not implemented
**Migration Impact:** Medium (if FCM is planned)

---

### 6.3 Incomplete Features

#### 1. Live Classes
**Status:** Table exists but no routes/service
**Evidence:** `live_classes` table exists but no live-class.routes.js
**Recommendation:** Implement or remove table
**Migration Impact:** Low

---

#### 2. FCM Notifications
**Status:** Table exists but service incomplete
**Evidence:** `fcm_tokens` table exists but firebase-admin not used
**Recommendation:** Implement FCM or remove table
**Migration Impact:** Medium

---

## 7. Unused Dependencies

### 7.1 Definitely Unused

#### 1. `firebase-admin`
**Version:** ^13.6.0
**Usage:** Not imported anywhere in codebase
**Recommendation:** Remove if not using Firebase
**Migration Difficulty:** Easy

---

#### 2. `fluent-ffmpeg`
**Version:** ^2.1.3
**Usage:** Only in `video-conversion.service.js` which is unused
**Recommendation:** Remove if video conversion not implemented
**Migration Difficulty:** Easy

---

### 7.2 Potentially Unused

#### 1. `nodemailer`
**Version:** ^6.9.7
**Usage:** Configured but no email service found
**Recommendation:** Verify if email notifications are needed
**Migration Difficulty:** Easy

---

#### 2. `aws-sdk`
**Version:** ^2.1524.0
**Usage:** Configured for CloudFront but not actively used
**Recommendation:** Keep if using CloudFront signed URLs
**Migration Difficulty:** Medium

---

### 7.3 All Dependencies Analysis

```json
{
  "@supabase/supabase-js": "^2.39.3",        // USED - Database
  "aws-sdk": "^2.1524.0",                   // USED - CloudFront (partial)
  "axios": "^1.6.5",                         // USED - AI service
  "backblaze-b2": "^1.7.1",                 // USED - Storage
  "bcryptjs": "^2.4.3",                     // USED - Password hashing
  "cors": "^2.8.5",                         // USED - CORS
  "crypto": "^1.0.1",                      // BUILTIN - Node.js
  "dotenv": "^16.3.1",                      // USED - Environment vars
  "express": "^4.18.2",                     // USED - Framework
  "express-rate-limit": "^7.1.5",           // USED - Rate limiting
  "express-validator": "^7.0.1",            // USED - Validation
  "firebase-admin": "^13.6.0",              // UNUSED - Remove
  "fluent-ffmpeg": "^2.1.3",               // UNUSED - Remove
  "helmet": "^7.1.0",                       // USED - Security headers
  "jsonwebtoken": "^9.0.2",                 // USED - JWT
  "multer": "^1.4.5-lts.1",                // USED - File uploads (not imported)
  "nodemailer": "^6.9.7",                   // UNUSED - Remove
  "pdfkit": "^0.14.0",                     // USED - Certificates
  "razorpay": "^2.9.6",                    // USED - Payments
  "uuid": "^9.0.1"                         // USED - UUID generation
}
```

**Recommendations:**
1. Remove `firebase-admin` - Not used
2. Remove `fluent-ffmpeg` - Video conversion not implemented
3. Remove `nodemailer` - Email service not implemented
4. Verify `multer` usage - Not imported but may be needed for uploads
5. Keep `aws-sdk` - Configured for CloudFront

**Migration Difficulty:** Easy

---

## 8. Migration Difficulty Report

### 8.1 Overall Assessment

**Total Endpoints:** 65+
**Total Tables:** 18
**Total Services:** 17
**Total Middlewares:** 5

---

### 8.2 Feature Migration Difficulty

#### EASY TO MIGRATE
**Criteria:** Standard CRUD operations, no external dependencies, simple logic

**Features:**
1. User Management (CRUD)
2. Course Management (CRUD)
3. Chapter Management (CRUD)
4. Lecture Management (CRUD)
5. Quiz Management (CRUD)
6. Enrollment Management (CRUD)
7. Certificate Generation (PDF generation)
8. Audit Logging
9. System Settings
10. Basic Authentication (JWT)
11. Role-Based Access Control
12. Notification Management (in-app)

**Migration Effort:** 2-3 days
**Risk Level:** Low

---

#### MEDIUM TO MIGRATE
**Criteria:** External API integrations, file handling, security features

**Features:**
1. Payment Integration (Razorpay)
2. Storage Integration (Backblaze B2)
3. Signed URL Generation (CloudFront)
4. Device Tracking & Fingerprinting
5. Video Streaming (HLS)
6. Security Violation Tracking
7. Push Notifications (FCM - if implemented)
8. Watermarking (if implemented)
9. Rate Limiting
10. File Upload Handling

**Migration Effort:** 5-7 days
**Risk Level:** Medium

---

#### HARD TO MIGRATE
**Criteria:** Complex integrations, video processing, AI features

**Features:**
1. AI Integration (OpenAI/Custom AI)
2. Video Conversion (FFmpeg + HLS)
3. Real-time Features (Live classes)
4. Advanced Security (Root detection, emulator detection)
5. Watermarking Implementation
6. CDN Configuration
7. Webhook Handling (payment webhooks)

**Migration Effort:** 10-14 days
**Risk Level:** High

---

### 8.3 Database Migration Difficulty

#### EASY
- All core tables (users, courses, chapters, lectures)
- Standard relationships and indexes
- Basic triggers

**Migration Effort:** 1-2 days

---

#### MEDIUM
- Payment tables (Razorpay-specific fields)
- Device tracking tables (security fields)
- JSONB columns (quiz answers, metadata)

**Migration Effort:** 2-3 days

---

#### HARD
- Database functions (enrollment validity, progress calculation)
- Row Level Security (RLS) policies
- Custom SQL functions

**Migration Effort:** 3-4 days

---

### 8.4 Infrastructure Migration Difficulty

#### EASY
- Node.js/Express setup
- Environment configuration
- Basic middleware setup

**Migration Effort:** 1 day

---

#### MEDIUM
- Supabase configuration
- Backblaze B2 setup
- Razorpay account setup
- CloudFront CDN setup

**Migration Effort:** 3-5 days

---

#### HARD
- FFmpeg installation and configuration
- Video processing pipeline
- AI API integration and configuration
- Security infrastructure (SSL, firewall)

**Migration Effort:** 5-7 days

---

### 8.5 Total Migration Estimate

**Phase 1: Core Features (Easy)**
- Duration: 5-7 days
- Features: User management, course management, basic auth
- Risk: Low

**Phase 2: Advanced Features (Medium)**
- Duration: 7-10 days
- Features: Payments, storage, streaming, device tracking
- Risk: Medium

**Phase 3: Complex Features (Hard)**
- Duration: 10-14 days
- Features: AI, video conversion, live classes, advanced security
- Risk: High

**Total Estimated Time:** 22-31 days (4-6 weeks)

---

### 8.6 Migration Recommendations

#### Priority 1 (Must Have)
1. Authentication & Authorization
2. User Management
3. Course Management
4. Payment Integration
5. Basic Storage (file upload/download)

#### Priority 2 (Should Have)
1. Device Tracking
2. Video Streaming
3. Certificate Generation
4. Quiz System
5. Enrollment Management

#### Priority 3 (Nice to Have)
1. AI Features
2. Live Classes
3. Advanced Security
4. Push Notifications
5. Video Conversion

---

### 8.7 Potential Migration Risks

1. **Razorpay Integration**
   - Risk: API changes, webhook reliability
   - Mitigation: Test thoroughly in sandbox

2. **Backblaze B2 Integration**
   - Risk: Service downtime, API limits
   - Mitigation: Implement fallback storage

3. **Video Processing**
   - Risk: FFmpeg compatibility, performance issues
   - Mitigation: Use cloud-based transcoding service

4. **AI Integration**
   - Risk: API costs, rate limits, response quality
   - Mitigation: Implement caching, fallback responses

5. **Device Tracking**
   - Risk: False positives, user experience issues
   - Mitigation: Allow admin overrides, clear messaging

---

### 8.8 Clean-up Recommendations

Before migration, consider:

1. **Remove unused dependencies:**
   - firebase-admin
   - fluent-ffmpeg
   - nodemailer

2. **Remove unused code:**
   - video-conversion.service.js
   - query() function in database.js
   - Empty directories (controllers/, utils/, validators/)

3. **Complete or remove incomplete features:**
   - Live classes (implement or remove table)
   - FCM notifications (implement or remove table)

4. **Standardize code structure:**
   - Decide on controller pattern (currently using services directly)
   - Standardize error handling
   - Standardize validation approach

---

## Summary

**Backend Stack:**
- Framework: Express.js
- Database: Supabase (PostgreSQL)
- Auth: JWT (Access + Refresh tokens)
- Storage: Backblaze B2 + CloudFront
- Payments: Razorpay
- File Processing: PDFKit (certificates)
- AI: OpenAI (configurable)

**Total API Endpoints:** 65+
**Total Database Tables:** 18
**Total Services:** 17
**Total Middlewares:** 5

**Migration Difficulty Breakdown:**
- Easy Features: 40%
- Medium Features: 35%
- Hard Features: 25%

**Estimated Migration Time:** 4-6 weeks

**Key Challenges:**
1. Payment gateway integration
2. Storage and CDN configuration
3. Video streaming implementation
4. Device tracking security
5. AI API integration

**Recommendations:**
1. Start with core features (auth, users, courses)
2. Implement payments early (critical for business)
3. Use cloud-based video processing (avoid FFmpeg complexity)
4. Implement device tracking with admin overrides
5. Consider AI as optional feature (can be added later)

---

**Report End**
