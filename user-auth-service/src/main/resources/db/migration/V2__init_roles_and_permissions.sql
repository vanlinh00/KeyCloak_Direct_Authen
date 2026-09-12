-- V2__init_roles_and_permissions.sql
-- Supports Fine-Grained Authorization (FGA) via Hybrid DB + Redis Cache

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Seed Baseline Roles matching Keycloak realm/client roles
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Full system administrative access with all privileges'),
('MANAGER', 'Operations management with invoice and report capabilities'),
('USER', 'Standard end-user with basic read capabilities')
ON CONFLICT (name) DO NOTHING;

-- Seed Baseline Fine-Grained Permissions
INSERT INTO permissions (code, module, description) VALUES
('user:read', 'user', 'View user identities and profiles'),
('user:create', 'user', 'Create new user accounts'),
('user:update', 'user', 'Modify existing user accounts and profiles'),
('user:delete', 'user', 'Delete or disable user accounts'),
('invoice:read', 'invoice', 'View billing invoices and line items'),
('invoice:create', 'invoice', 'Create new billing invoices'),
('invoice:export-pdf', 'invoice', 'Export invoice documents as PDF'),
('report:view', 'report', 'View analytics and performance dashboards'),
('report:export', 'report', 'Export aggregate reports and telemetry')
ON CONFLICT (code) DO NOTHING;

-- Seed Baseline Role-Permission Mappings
-- ADMIN has all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER' AND p.code IN ('user:read', 'invoice:read', 'invoice:create', 'invoice:export-pdf', 'report:view')
ON CONFLICT DO NOTHING;

-- USER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'USER' AND p.code IN ('user:read', 'invoice:read')
ON CONFLICT DO NOTHING;
