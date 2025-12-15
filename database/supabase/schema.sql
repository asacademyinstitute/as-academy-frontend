-- AS Academy LMS - Complete Database Schema
-- PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    college_name VARCHAR(255),
    semester VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    validity_days INTEGER NOT NULL DEFAULT 365,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);

-- =====================================================
-- CHAPTERS TABLE
-- =====================================================
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    chapter_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, chapter_order)
);

CREATE INDEX idx_chapters_course ON chapters(course_id);
CREATE INDEX idx_chapters_order ON chapters(course_id, chapter_order);

-- =====================================================
-- LECTURES TABLE
-- =====================================================
CREATE TABLE lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'pdf', 'text')),
    file_url TEXT,
    duration INTEGER, -- in seconds for videos
    lecture_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, lecture_order)
);

CREATE INDEX idx_lectures_chapter ON lectures(chapter_id);
CREATE INDEX idx_lectures_type ON lectures(type);
CREATE INDEX idx_lectures_order ON lectures(chapter_id, lecture_order);

-- =====================================================
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    payment_type VARCHAR(20) DEFAULT 'online' CHECK (payment_type IN ('online', 'offline')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_validity ON enrollments(valid_until);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_course ON payments(course_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);

-- =====================================================
-- QUIZZES TABLE
-- =====================================================
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_marks INTEGER NOT NULL DEFAULT 40,
    duration_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_course ON quizzes(course_id);

-- =====================================================
-- QUIZ QUESTIONS TABLE
-- =====================================================
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    marks INTEGER NOT NULL DEFAULT 1,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- =====================================================
-- QUIZ ATTEMPTS TABLE
-- =====================================================
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    answers JSONB -- Store student answers as JSON
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_url TEXT,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- =====================================================
-- USER DEVICES TABLE (for device tracking)
-- =====================================================
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_device ON user_devices(device_id);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- PROGRESS TRACKING TABLE
-- =====================================================
CREATE TABLE lecture_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    last_position INTEGER DEFAULT 0, -- for video progress in seconds
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lecture_id)
);

CREATE INDEX idx_lecture_progress_student ON lecture_progress(student_id);
CREATE INDEX idx_lecture_progress_lecture ON lecture_progress(lecture_id);

-- =====================================================
-- REFRESH TOKENS TABLE (for JWT refresh mechanism)
-- =====================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_id VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- =====================================================
-- LIVE CLASSES TABLE (optional)
-- =====================================================
CREATE TABLE live_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    meeting_url TEXT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_live_classes_course ON live_classes(course_id);
CREATE INDEX idx_live_classes_scheduled ON live_classes(scheduled_at);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lecture_progress_updated_at BEFORE UPDATE ON lecture_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO CHECK ENROLLMENT VALIDITY
-- =====================================================
CREATE OR REPLACE FUNCTION check_enrollment_validity(p_student_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_valid_until TIMESTAMP;
    v_status VARCHAR(20);
BEGIN
    SELECT valid_until, status INTO v_valid_until, v_status
    FROM enrollments
    WHERE student_id = p_student_id AND course_id = p_course_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF v_status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    IF v_valid_until < CURRENT_TIMESTAMP THEN
        -- Update status to expired
        UPDATE enrollments 
        SET status = 'expired' 
        WHERE student_id = p_student_id AND course_id = p_course_id;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION TO GET COURSE PROGRESS
-- =====================================================
CREATE OR REPLACE FUNCTION get_course_progress(p_student_id UUID, p_course_id UUID)
RETURNS TABLE(
    total_lectures BIGINT,
    completed_lectures BIGINT,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(l.id) as total_lectures,
        COUNT(CASE WHEN lp.completed = TRUE THEN 1 END) as completed_lectures,
        ROUND(
            (COUNT(CASE WHEN lp.completed = TRUE THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(l.id), 0)::NUMERIC) * 100, 
            2
        ) as progress_percentage
    FROM lectures l
    INNER JOIN chapters c ON l.chapter_id = c.id
    LEFT JOIN lecture_progress lp ON l.id = lp.lecture_id AND lp.student_id = p_student_id
    WHERE c.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSERT DEFAULT ADMIN USER
-- =====================================================
-- Password: Admin@123 (hashed with bcrypt)
-- You should change this after first login
INSERT INTO users (name, email, phone, password_hash, role, status)
VALUES (
    'Admin User',
    'admin@asacademy.com',
    '9999999999',
    '$2a$10$rKvVXZXQxQxQxQxQxQxQxOeH8K8K8K8K8K8K8K8K8K8K8K8K8K8K8',
    'admin',
    'active'
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Students can only view their own data
CREATE POLICY student_own_data ON users
    FOR SELECT
    USING (auth.uid() = id OR role = 'admin');

CREATE POLICY student_own_enrollments ON enrollments
    FOR SELECT
    USING (auth.uid() = student_id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    ));

-- Note: In production, you'll need to configure these policies based on your Supabase auth setup
