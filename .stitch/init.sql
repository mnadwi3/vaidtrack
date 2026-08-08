-- VaidTrack PostgreSQL initialization script
-- Creates tables for syncing with Stitch/BigQuery

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads/Submissions table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    treatment_type VARCHAR(100),
    message TEXT,
    source VARCHAR(50), -- 'website', 'whatsapp', 'phone', etc.
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'lost'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- Create index for incremental sync (Stitch looks for updated_at)
CREATE INDEX idx_leads_updated_at ON leads(updated_at);

-- Doctors table (if syncing from database instead of API)
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    experience_years INTEGER,
    hospital VARCHAR(255),
    qualification VARCHAR(255),
    image_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctors_updated_at ON doctors(updated_at);

-- Treatment types reference table
CREATE TABLE IF NOT EXISTS treatments (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals reference table
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    accreditations TEXT, -- JSON array
    is_partner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data (optional)
INSERT INTO treatments (id, name, slug) VALUES
    ('breast-cancer', 'Breast Cancer', 'breast-cancer'),
    ('lung-cancer', 'Lung Cancer', 'lung-cancer'),
    ('colorectal-cancer', 'Colorectal Cancer', 'colorectal-cancer'),
    ('prostate-cancer', 'Prostate Cancer', 'prostate-cancer'),
    ('kidney-cancer', 'Kidney Cancer', 'kidney-cancer')
ON CONFLICT DO NOTHING;

-- Create a trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_update_timestamp
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER doctors_update_timestamp
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER treatments_update_timestamp
    BEFORE UPDATE ON treatments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER hospitals_update_timestamp
    BEFORE UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Verify tables created
-- Run: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
