-- Add original_filename column to job_applications table
ALTER TABLE job_applications ADD COLUMN original_filename VARCHAR(255);

-- Update existing records with a placeholder filename based on application ID
UPDATE job_applications SET original_filename = 'resume_' || id || '.docx' WHERE original_filename IS NULL;