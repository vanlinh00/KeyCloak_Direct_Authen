# user-auth-service — Architecture Specification

This service implements two foundational architectures: a **Split-Database Strategy with Distributed Saga Compensation** for identity/profile decoupling, and a **Hybrid DB + Redis Fine-Grained Authorization (FGA)** engine to support 1,000+ dynamic permissions without JWT token bloat.

---

## 1. Split-Database Strategy & Distributed Saga

### 1.1 Architectural Separation
To prevent IAM vendor lock-in and isolate sensitive domain data from the auth directory, persistence is partitioned into two distinct tiers:

```
                      ┌───────────────────────────┐
                      │    user-auth-service      │
                      └─────────────┬─────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │ (OAuth2 / Admin API)                          │ (JPA / JDBC)
            ▼                                               ▼
┌───────────────────────┐                       ┌───────────────────────┐
│     Keycloak 24+      │                       │   PostgreSQL (mydb)   │
│    (Identity Store)   │                       │ (Domain User Profile) │
├───────────────────────┤                       ├───────────────────────┤
│ • username (login_id) │                       │ • id (UUID from IAM)  │
│ • credentials (hash)  │                       │ • gender, DOB, height │
│ • email & verified    │                       │ • insurance card info │
│ • enabled (!deleted)  │                       │ • group_id, points    │
│ • access date ranges  │                       │ • audit timestamps    │
└───────────────────────┘                       └───────────────────────┘
```

- **Shared UUID Linkage**: Keycloak generates the user's immutable UUID (`sub` claim). This exact UUID is assigned as the primary key (`@Id private UUID id`) in PostgreSQL `mydb.user_profiles`. There are no surrogate auto-increment IDs in the domain profile, ensuring deterministic, zero-overhead 1:1 entity resolution.

### 1.2 Registration Saga & Compensation Rollback
User registration (`POST /api/v1/users/register`) spans Keycloak REST API calls and relational database transactions. Because distributed two-phase commit (2PC) is unavailable across heterogeneous systems, the service executes a **Saga pattern with compensating transactions**:

```
[Client] ──> RegisterRequest
                  │
                  ▼
          ┌───────────────┐
          │ Step 1: IAM   │ ──> Keycloak Admin API creates user
          └───────┬───────┘
                  │ (Extracts generated UUID)
                  ▼
          ┌───────────────┐
          │ Step 2: DB    │ ──> Save UserProfile in PostgreSQL
          └───────┬───────┘
                  ├─── Success ──> Commit & Return 201 Created
                  │
                  └─── Failure (DB constraint / timeout / error)
                          │
                          ▼
                  ┌───────────────┐
                  │ Compensate    │ ──> keycloakAdminClient.users().get(uuid).remove()
                  └───────────────┘     (Purges orphaned Keycloak identity)
```

1. **Forward Action (Keycloak)**: The service creates the Keycloak user representation with credentials and temporary password flags, parsing the new user's UUID from the HTTP `Location` response header.
2. **Forward Action (PostgreSQL)**: The domain profile entity is assembled using the extracted UUID and saved to `user_profiles` via Spring Data JPA.
3. **Compensating Action (Rollback)**: If PostgreSQL persistence fails (e.g., unique constraint violation, connectivity loss, or data validation failure), a catch block immediately triggers a compensating API call:
   ```java
   keycloakAdminClient.realm(realm).users().get(userId.toString()).remove();
   ```
   This prevents orphaned "zombie" accounts from polluting Keycloak when the profile cannot be committed.

---

## 2. Fine-Grained Authorization (FGA) — Hybrid DB + Redis

### 2.1 The JWT Token Bloat Problem
Encoding hundreds or thousands of granular action permissions (e.g., `invoice:export-pdf`, `report:view-sensitive`) directly into JWT claims introduces severe limitations:
- Causes HTTP headers to exceed proxy/load balancer size limits (typically 4KB–8KB).
- Requires revoking and re-issuing tokens whenever permissions are modified.

### 2.2 Hybrid Architecture & Data Flow

```
1. Client sends Bearer JWT (contains coarse roles: ["MANAGER"])
        │
        ▼
2. @PreAuthorize("@permissionChecker.hasPermission('invoice:export-pdf')")
        │
        ▼
3. PermissionChecker extracts roles -> ["MANAGER"]
        │
        ▼
4. PermissionCacheService evaluates permissions
        │
        ├── [Cache Hit] ──> Redis SUNION across role sets (O(1))
        │
        └── [Cache Miss] ─> Query PostgreSQL (role_permissions)
                                 │
                                 ├──> Populate Redis Set with 24h TTL
                                 └──> Return aggregated permissions
```

### 2.3 Storage & Caching Model
1. **PostgreSQL Relational Schema**:
   - `roles`: High-level roles matching Keycloak realm/client role names (`name`, e.g., `MANAGER`, `ADMIN`).
   - `permissions`: Granular action codes (`code`, `module`, e.g., `invoice:export-pdf`, `module="invoice"`).
   - `role_permissions`: Many-to-many mapping table linking roles to permissions.
2. **Redis Set Caching**:
   - **Key Format**: `role:permissions:{ROLE_NAME}` (e.g., `role:permissions:MANAGER`).
   - **Data Structure**: Redis **Set** storing raw permission code strings.
   - **Time-to-Live (TTL)**: Configured with a 24-hour expiration.
   - **Anti-Penetration Sentinel**: Roles with zero assigned permissions store an `__EMPTY__` sentinel to prevent repeated database lookups.
   - **Resilience Fallback**: If Redis becomes unavailable, the system automatically falls back to direct database joins without blocking authorization.

### 2.4 O(1) Evaluation & Dynamic Method Security
- **Multi-Role Aggregation via `SUNION`**: When a user possesses multiple roles (e.g., `["MANAGER", "FINANCE"]`), permissions are evaluated in a single round-trip by computing the union directly on the Redis server:
  ```java
  redisTemplate.opsForSet().union("role:permissions:MANAGER", List.of("role:permissions:FINANCE"));
  ```
- **Declarative Enforcement**: Protected endpoints use Spring Security expressions evaluated at runtime:
  ```java
  @PreAuthorize("@permissionChecker.hasPermission('invoice:export-pdf')")
  @GetMapping("/invoices/{id}/export")
  public ResponseEntity<byte[]> exportInvoice(@PathVariable Long id) { ... }
  ```
- **Super-Admin Bypass**: The `ADMIN` role is recognized by `PermissionChecker` to automatically grant access without cache or database overhead.

### 2.5 Cache Invalidation on Mutation
Whenever permissions are assigned, removed, or overwritten via the Admin API (`RolePermissionController`), the mutation service updates the database and immediately evicts the affected Redis key:
```java
permissionCacheService.invalidateRoleCache(roleName);
```
Subsequent requests trigger a fresh read from PostgreSQL and re-populate the cache, guaranteeing immediate consistency across all microservice instances without requiring token re-issuance.
