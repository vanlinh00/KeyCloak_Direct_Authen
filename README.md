# user-auth-service

Production-ready **Authentication and User Management Microservice** built with **Spring Boot 3.4.2**, **Java 17**, **Keycloak 24+**, and **PostgreSQL** (`mydb`).

---

## 1. Architectural Overview & Split-Database Strategy

To ensure zero lock-in to IAM credentials while maintaining full regulatory and domain flexibility, the service strictly divides identity and profile records across two distinct persistence tiers:

```
                      [ Client Applications ]
                                 |
                                 v
                     [ user-auth-service (8080) ]
                     /                         \
         (OAuth2 / Admin API)             (JDBC / JPA)
                   /                             \
                  v                               v
        +-------------------+           +-----------------------+
        |   Keycloak 24+    |           |  PostgreSQL (mydb)    |
        | (Identity Store)  |           | (Domain User Profile) |
        +-------------------+           +-----------------------+
```

### Data Split Mapping Matrix
| Field Name | Storage Location | Keycloak / DB Column | Rationale & Handling |
|---|---|---|---|
| `login_id` | Keycloak DB | `username` | Unique identity login credential |
| `initial_password` | Keycloak DB | `credentials.password` | Stored with `temporary = true` (forces password update on 1st login) |
| `is_confirmed` | Keycloak DB | `emailVerified` (Boolean) | Standard OIDC claim |
| `is_deleted` | Keycloak DB | `enabled` (`!is_deleted`) | Disabling identity locks session without deleting audit records |
| `id` | Keycloak DB & PostgreSQL | `sub` (UUID) / `id` (PK) | Shared UUID primary key linking IAM identity to domain profile |
| `full_name` | Keycloak DB | `firstName` / `lastName` | Standard OpenID Connect profile claims |
| `email` | Keycloak DB | `email` | Identity communication & reset anchor |
| `created_at` | Keycloak DB | `createdTimestamp` | Identity registration timestamp |
| `access_start_date` | Keycloak DB | Custom attribute `user.attributes` | Time-bounded role / system access start |
| `access_end_date` | Keycloak DB | Custom attribute `user.attributes` | Time-bounded role / system access end |
| **Health Profile Data** | PostgreSQL `mydb.user_profiles` | `gender`, `date_of_birth`, `height_cm`, `insured_card_number`, `insured_card_expiration` | Sensitive domain data kept isolated from IAM directory |
| **App & Rewards Data** | PostgreSQL `mydb.user_profiles` | `group_id`, `point`, `point_received_date`, `reg_verify_status`, `previous_state`, `nick_name` | Domain business state and loyalty tracking |
| **Audit Metadata** | PostgreSQL `mydb.user_profiles` | `created_at`, `updated_at` | Audited via Spring Data JPA `@CreatedDate` / `@LastModifiedDate` |

---

## 2. Distributed Saga & Compensation Rollback

During `POST /api/v1/users/register`, the service coordinates between Keycloak's Admin API and PostgreSQL:
1. **Step 1**: Identity created in Keycloak -> extracts generated UUID (`sub`).
2. **Step 2**: Domain profile saved into `mydb.user_profiles` with matching UUID.
3. **Rollback**: If PostgreSQL persistence fails (e.g., constraint error or network timeout), an automatic compensation handler invokes `keycloakAdminClient.realm().users().get(userId).remove()`. This eliminates orphaned "zombie" IAM accounts.

---

## 3. Endpoints Specification

### Authentication
- `POST /api/v1/auth/login`: Direct Access Grant -> Returns `access_token`, `refresh_token`, `expires_in`.
- `POST /api/v1/auth/refresh`: Exchanges valid `refresh_token` for renewed tokens.
- `POST /api/v1/auth/logout`: Revokes active user session in Keycloak.

### User Management
- `POST /api/v1/users/register`: Executes dual-store onboarding with compensation rollback.
- `GET /api/v1/users/me`: Enriched profile combining JWT claims + PostgreSQL profile attributes.
- `PUT /api/v1/users/me`: Updates domain fields in PostgreSQL `mydb.user_profiles`.
- `PUT /api/v1/users/me/password`: Changes authenticated user's password (verifies current password).
- `PUT /api/v1/users/me/account`: Updates user full name (`firstName`, `lastName`) and email / Gmail in Keycloak IAM.

### Fine-Grained Authorization (FGA) - Admin & RBAC
- `GET /api/v1/admin/roles`: Lists all registered system roles and their permissions.
- `GET /api/v1/admin/roles/{roleName}`: Retrieves a single role with its permissions.
- `POST /api/v1/admin/roles`: Creates a new role.
- `GET /api/v1/admin/permissions`: Lists all fine-grained action permissions.
- `POST /api/v1/admin/permissions`: Creates a new fine-grained action permission (e.g. `invoice:export-pdf`).
- `POST /api/v1/admin/roles/{roleName}/permissions`: Appends permission codes to a role (auto-invalidates Redis cache).
- `DELETE /api/v1/admin/roles/{roleName}/permissions`: Removes permission codes from a role (auto-invalidates Redis cache).
- `PUT /api/v1/admin/roles/{roleName}/permissions`: Overwrites role permissions (auto-invalidates Redis cache).
- `POST /api/v1/admin/roles/{roleName}/cache/invalidate`: Explicitly invalidates Redis role cache.
- `GET /api/v1/admin/my-permissions`: Retrieves current user's aggregated effective action permissions.

---

## 4. Fine-Grained Authorization (FGA) Architecture (Hybrid DB + Redis)

To support **1,000+ custom action permissions** without bloating JWT header sizes or exceeding HTTP 8KB cookie/header limits:
1. **JWT Kept Lean**: Keycloak issues JWTs containing only high-level coarse roles (e.g. `realm_access.roles: ["MANAGER"]`).
2. **PostgreSQL Relational Storage**: `roles`, `permissions`, and `role_permissions` store detailed granular permissions.
3. **Redis Cache (SUNION Aggregation)**:
   - Cache key format: `role:permissions:{ROLE_NAME}` stored as a **Redis Set** with a 24h TTL.
   - When a user performs an action, `PermissionChecker` extracts user roles from the JWT and calls `SUNION` across all active roles in Redis in O(1) time.
   - On cache miss, permissions are loaded from PostgreSQL, cached into Redis, and aggregated.
   - Any permission mutation via `RolePermissionController` instantly evicts the affected role cache key.
4. **Method Security Evaluator**:
   Controllers or services protect sensitive business logic with:
   ```java
   @PreAuthorize("@permissionChecker.hasPermission('invoice:export-pdf')")
   public ResponseEntity<?> exportInvoicePdf(...) { ... }
   ```

---

## 5. Keycloak 24+ Configuration Checklist

1. **Realm**: Create `microservices-realm`.
2. **Client**: Create client `user-auth-service`:
   - Client authentication: **ON** (Confidential).
   - Standard flow: **ON**.
   - Direct access grants: **ON** (enables `/api/v1/auth/login`).
   - Service accounts roles: **ON** (allows backend to manage users).
3. **Service Account Roles**:
   - Assign `realm-management` client roles: `manage-users`, `query-users`, `view-users`.

---

## 5. Quickstart with Docker Compose

```bash
cd user-auth-service
docker compose up -d
```

Access Swagger UI: `http://localhost:8080/swagger-ui.html`
Keycloak Admin Console: `http://localhost:8081` (admin / adminpassword)
