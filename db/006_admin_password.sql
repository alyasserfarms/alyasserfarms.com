-- Migration 006: Add admin_password_hash column to farm.settings
-- Enables self-serve admin password change stored securely as scrypt hash.

alter table if exists farm.settings 
  add column if not exists admin_password_hash text;
