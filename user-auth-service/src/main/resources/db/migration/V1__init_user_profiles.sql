-- V1__init_user_profiles.sql
-- Table: mydb.user_profiles
-- Represents extended business and domain data associated with Keycloak identities.

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    
    -- Health Profile Data
    gender VARCHAR(20),
    date_of_birth DATE,
    height_cm NUMERIC(5, 2),
    insured_card_number VARCHAR(50),
    insured_card_expiration DATE,
    
    -- Application & Rewards Data
    group_id VARCHAR(50),
    point BIGINT DEFAULT 0 NOT NULL,
    point_received_date TIMESTAMP WITH TIME ZONE,
    reg_verify_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    previous_state VARCHAR(50),
    nick_name VARCHAR(100),
    
    -- Audit Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for frequent query optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_group_id ON user_profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_reg_verify_status ON user_profiles(reg_verify_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_insured_card_number ON user_profiles(insured_card_number);

-- Comment metadata
COMMENT ON TABLE user_profiles IS 'Stores domain-specific user profile attributes, separate from Keycloak IAM credentials.';
COMMENT ON COLUMN user_profiles.id IS 'Primary Key strictly matching Keycloak User ID (sub claim UUID)';
