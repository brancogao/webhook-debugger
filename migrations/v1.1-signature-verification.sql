-- Migration v1.1: Add signature verification support
-- Run: wrangler d1 execute webhook-debugger-db --file=./migrations/v1.1-signature-verification.sql

-- Add verification_secret to endpoints table
ALTER TABLE endpoints ADD COLUMN verification_secret TEXT;

-- Add verification_method to endpoints table (stripe, github, slack, shopify, generic-hmac)
ALTER TABLE endpoints ADD COLUMN verification_method TEXT DEFAULT 'none';
