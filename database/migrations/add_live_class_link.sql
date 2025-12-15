-- Add live_class_link column to courses table
-- This allows teachers to add a permanent live class link (Zoom, Google Meet, etc.)

ALTER TABLE courses 
ADD COLUMN live_class_link TEXT;

COMMENT ON COLUMN courses.live_class_link IS 'Permanent live class meeting link (Zoom, Google Meet, etc.)';
