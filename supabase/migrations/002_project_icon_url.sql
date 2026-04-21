-- Migration: Add icon_url column to projects table
-- Run this in your Supabase SQL editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Also create the project-assets storage bucket if it doesn't exist
-- (Run this once via Supabase dashboard → Storage → New bucket)
-- Bucket name: project-assets
-- Public: true
