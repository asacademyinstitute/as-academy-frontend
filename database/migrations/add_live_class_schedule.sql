-- Add live_class_scheduled_at column to courses table
-- This allows teachers to set when the live class will start

ALTER TABLE courses 
ADD COLUMN live_class_scheduled_at TIMESTAMP;

COMMENT ON COLUMN courses.live_class_scheduled_at IS 'Scheduled date and time for the live class';
