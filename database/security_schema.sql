-- Security Violations Table
-- Logs security violations from mobile app (root detection, emulator detection, etc.)

CREATE TABLE IF NOT EXISTS security_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL, -- 'root_detected', 'emulator_detected', 'usb_debugging', 'screenshot_attempt'
    device_info JSONB, -- Store device details
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_violations_user ON security_violations(user_id);
CREATE INDEX idx_security_violations_type ON security_violations(violation_type);
CREATE INDEX idx_security_violations_created ON security_violations(created_at DESC);

-- Update user_devices table with security fields
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(64);
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS os_version VARCHAR(50);
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS app_version VARCHAR(20);
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS is_rooted BOOLEAN DEFAULT FALSE;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS is_emulator BOOLEAN DEFAULT FALSE;

-- System settings table (if not exists)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
    ('student_device_limit', '1', 'Maximum devices allowed per student'),
    ('video_watermark_enabled', 'true', 'Enable watermark on videos'),
    ('pdf_watermark_enabled', 'true', 'Enable watermark on PDFs'),
    ('security_checks_enabled', 'true', 'Enable root/emulator detection')
ON CONFLICT (setting_key) DO NOTHING;
