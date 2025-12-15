-- Add live_class_title column to courses table
-- This allows teachers to give a descriptive title to the live class

ALTER TABLE courses 
ADD COLUMN live_class_title VARCHAR(255);

COMMENT ON COLUMN courses.live_class_title IS 'Title/topic of the live class session';
