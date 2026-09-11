import React, { useState } from 'react';
import { Database, KeyRound, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, Server, FileText, Layers, Lock, Cpu } from 'lucide-react';

interface MappingItem {
  field: string;
  target: string;
  store: 'keycloak' | 'postgres' | 'both';
  type: string;
  description: string;
}

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'split' | 'saga' | 'security'>('split');
  const [selectedField, setSelectedField] = useState<string | null>('id');

  const mappings: MappingItem[] = [
    { field: 'id', target: 'Keycloak sub (UUID) == PostgreSQL id (PK)', store: 'both', type: 'UUID', description: 'Deterministic foreign identity anchor linking Keycloak IAM account with PostgreSQL profile record.' },
    { field: 'login_id', target: 'Keycloak username', store: 'keycloak', type: 'VARCHAR(50)', description: 'Unique user login identifier used in Direct Access Grant and password authentication.' },
    { field: 'initial_password', target: 'Keycloak credentials (temporary = true)', store: 'keycloak', type: 'CredentialRepresentation', description: 'Initial credential configured with temporary=true, requiring user to reset password upon first login.' },
    { field: 'is_confirmed', target: 'Keycloak emailVerified', store: 'keycloak', type: 'Boolean', description: 'Standard OIDC identity claim indicating whether user email ownership has been validated.' },
    { field: 'is_deleted', target: 'Keycloak enabled (!is_deleted)', store: 'keycloak', type: 'Boolean', description: 'Soft-deletion strategy: Setting is_deleted=true disables the Keycloak account immediately, revoking access without dropping audit records.' },
    { field: 'full_name', target: 'Keycloak firstName & lastName', store: 'keycloak', type: 'String', description: 'Standard OpenID Connect profile claim split into firstName and lastName for token propagation.' },
    { field: 'email', target: 'Keycloak email', store: 'keycloak', type: 'String', description: 'Primary email used for communications, notifications, and account recovery.' },
    { field: 'created_at (IAM)', target: 'Keycloak createdTimestamp', store: 'keycloak', type: 'Long (Epoch ms)', description: 'Built-in Keycloak timestamp recording when the identity credential was established.' },
    { field: 'access_start_date', target: 'Keycloak custom attribute (user.attributes)', store: 'keycloak', type: 'List<String>', description: 'Custom time-window claim for access authorization policies.' },
    { field: 'access_end_date', target: 'Keycloak custom attribute (user.attributes)', store: 'keycloak', type: 'List<String>', description: 'Expiration date of user system access privileges.' },
    { field: 'gender', target: 'mydb.user_profiles.gender', store: 'postgres', type: 'VARCHAR(20)', description: 'Health profile attribute kept strictly segregated from the central IAM directory.' },
    { field: 'date_of_birth', target: 'mydb.user_profiles.date_of_birth', store: 'postgres', type: 'DATE', description: 'Domain business date used for age verification and eligibility workflows.' },
    { field: 'height_cm', target: 'mydb.user_profiles.height_cm', store: 'postgres', type: 'NUMERIC(5,2)', description: 'Biometric metric stored in PostgreSQL.' },
    { field: 'insured_card_number', target: 'mydb.user_profiles.insured_card_number', store: 'postgres', type: 'VARCHAR(50)', description: 'Insurance identification identifier indexed for fast domain lookups.' },
    { field: 'insured_card_expiration', target: 'mydb.user_profiles.insured_card_expiration', store: 'postgres', type: 'DATE', description: 'Card validity expiration timestamp.' },
    { field: 'group_id', target: 'mydb.user_profiles.group_id', store: 'postgres', type: 'VARCHAR(50)', description: 'Application group / organization affiliation identifier.' },
    { field: 'point', target: 'mydb.user_profiles.point', store: 'postgres', type: 'BIGINT', description: 'Application loyalty rewards point balance.' },
    { field: 'point_received_date', target: 'mydb.user_profiles.point_received_date', store: 'postgres', type: 'TIMESTAMPTZ', description: 'Timestamp when rewards points were credited.' },
    { field: 'reg_verify_status', target: 'mydb.user_profiles.reg_verify_status', store: 'postgres', type: 'VARCHAR(50)', description: 'Domain verification lifecycle state (e.g. PENDING, VERIFIED, REJECTED).' },
    { field: 'previous_state', target: 'mydb.user_profiles.previous_state', store: 'postgres', type: 'VARCHAR(50)', description: 'Historical state tracking for audit and lifecycle migration.' },
    { field: 'nick_name', target: 'mydb.user_profiles.nick_name', store: 'postgres', type: 'VARCHAR(100)', description: 'User-customized display alias.' },
    { field: 'created_at / updated_at', target: 'mydb.user_profiles.created_at, updated_at', store: 'postgres', type: 'TIMESTAMPTZ', description: 'Audited timestamps managed automatically by Spring Data JPA @CreatedDate and @LastModifiedDate.' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Architecture Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Spring Boot 3.4.2 & Java 21
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-sky-950 text-sky-400 border border-sky-800/60">
                Keycloak 24+ IAM
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                PostgreSQL (mydb)
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2 text-white">Dual-Database Architecture & Security Topology</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Clean separation of concerns: Authentication credentials and OIDC claims reside in Keycloak 24+, while sensitive health and domain business attributes are isolated in PostgreSQL (<code className="text-emerald-300">mydb.user_profiles</code>) linked via a shared UUID.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Split Database Mapping
            </button>
            <button
              onClick={() => setActiveTab('saga')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'saga' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Distributed Saga & Rollback
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'security' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spring Security 6 Resource Server
            </button>
          </div>
        </div>

        {/* Tab 1: Split Database Visualizer */}
        {activeTab === 'split' && (
          <div className="mt-6 space-y-6">
            {/* Split Visual Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Keycloak Container */}
              <div className="bg-slate-950/70 border border-sky-900/50 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-950 text-sky-400 rounded-lg border border-sky-800/60">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Keycloak 24+ IAM Store</h3>
                      <p className="text-xs text-slate-400">OAuth2 / OpenID Connect Provider Database</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-sky-950/80 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">
                    Admin REST API
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">login_id</span>
                    <span className="text-sky-400 font-mono">username</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">initial_password</span>
                    <span className="text-sky-400 font-mono">credentials (temporary = true)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">is_confirmed</span>
                    <span className="text-sky-400 font-mono">emailVerified (Boolean)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">is_deleted</span>
                    <span className="text-sky-400 font-mono">enabled (!is_deleted)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-emerald-800/60 bg-emerald-950/20 flex justify-between items-center">
                    <span className="font-mono text-emerald-300 font-bold">id</span>
                    <span className="text-emerald-400 font-mono font-bold">Keycloak sub (UUID)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">full_name</span>
                    <span className="text-sky-400 font-mono">firstName & lastName</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">email</span>
                    <span className="text-sky-400 font-mono">email</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">access_start / end_date</span>
                    <span className="text-amber-400 font-mono">user.attributes</span>
                  </div>
                </div>
              </div>

              {/* PostgreSQL Container */}
              <div className="bg-slate-950/70 border border-emerald-900/50 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/60">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">PostgreSQL Store</h3>
                      <p className="text-xs text-slate-400">Database: <code className="text-emerald-300 font-mono">mydb.user_profiles</code></p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                    Spring Data JPA
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-emerald-800/60 bg-emerald-950/20 flex justify-between items-center">
                    <span className="font-mono text-emerald-300 font-bold">id</span>
                    <span className="text-emerald-400 font-mono font-bold">UUID PRIMARY KEY (= Keycloak sub)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">Health Data</span>
                    <span className="text-emerald-400 font-mono">gender, date_of_birth, height_cm</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">Health Insurance</span>
                    <span className="text-emerald-400 font-mono">insured_card_number, expiration</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">Application Context</span>
                    <span className="text-emerald-400 font-mono">group_id, nick_name</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">Rewards & Points</span>
                    <span className="text-emerald-400 font-mono">point, point_received_date</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">Lifecycle State</span>
                    <span className="text-emerald-400 font-mono">reg_verify_status, previous_state</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="font-mono text-slate-300 font-medium">Audit Metadata</span>
                    <span className="text-slate-400 font-mono">created_at, updated_at (TIMESTAMPTZ)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Interactive Mapping Matrix */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-semibold text-white">Full Field Mapping Matrix & Architectural Rationale</h4>
                </div>
                <span className="text-xs text-slate-400">Click any row to view architect notes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                      <th className="p-3 font-semibold">Field Name</th>
                      <th className="p-3 font-semibold">Target Location</th>
                      <th className="p-3 font-semibold">Storage Engine</th>
                      <th className="p-3 font-semibold">Data Type</th>
                      <th className="p-3 font-semibold">Architectural Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {mappings.map((item) => (
                      <tr
                        key={item.field}
                        onClick={() => setSelectedField(item.field)}
                        className={`cursor-pointer transition-colors ${
                          selectedField === item.field ? 'bg-indigo-950/40 text-white' : 'hover:bg-slate-900/50 text-slate-300'
                        }`}
                      >
                        <td className="p-3 font-mono font-medium text-indigo-300">{item.field}</td>
                        <td className="p-3 font-mono text-slate-200">{item.target}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              item.store === 'keycloak'
                                ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                : item.store === 'postgres'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                            }`}
                          >
                            {item.store}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{item.type}</td>
                        <td className="p-3 text-slate-400 max-w-md truncate">{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Saga & Compensation Rollback */}
        {activeTab === 'saga' && (
          <div className="mt-6 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Distributed Consistency: The Split-Store Dual-Write Problem</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Because Keycloak IAM and PostgreSQL are distinct persistence engines without a 2-Phase Commit (XA) coordinator, user registration must follow the <strong>Saga Pattern with Backward Recovery (Compensation)</strong>.
                If PostgreSQL fails to persist the domain profile (e.g. database network partition, unique constraint on health insurance card), the service immediately issues an automated compensation call to Keycloak to delete the freshly created user identity.
              </p>
            </div>

            {/* Step-by-step Saga flow visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Step 1
                  </span>
                  <h4 className="font-semibold text-white mt-2 text-sm">Create IAM Identity</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Invokes Keycloak Admin REST API <code className="text-sky-300">POST /admin/realms/{'{realm}'}/users</code> with credentials, attributes, and roles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-emerald-400 gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Returns Keycloak UUID (sub)</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                    Step 2
                  </span>
                  <h4 className="font-semibold text-white mt-2 text-sm">Persist Domain Profile</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Inserts domain profile into PostgreSQL <code className="text-emerald-300">mydb.user_profiles</code> using the exact same UUID as Primary Key.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-indigo-400 gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>JPA save(profile)</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-rose-900/60 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Failure Branch
                  </span>
                  <h4 className="font-semibold text-rose-200 mt-2 text-sm">DB Failure Detected</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    If PostgreSQL fails (SQL timeout, unique constraint failure, disk full), an exception is caught in <code className="text-rose-300">UserService.java</code>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-rose-400 gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Catches Exception</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-amber-900/60 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Compensation
                  </span>
                  <h4 className="font-semibold text-amber-200 mt-2 text-sm">Keycloak Rollback</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Calls <code className="text-amber-300">usersResource.get(userId).remove()</code> to delete the orphaned Keycloak identity, preventing zombie accounts.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-amber-400 gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  <span>Zero Orphaned IAM State</span>
                </div>
              </div>
            </div>

            {/* Code Snippet Demonstration */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-300">Spring Boot Saga Compensation Implementation in UserService.java</span>
              <pre className="mt-2 p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`try {
    profile = userProfileRepository.save(profile);
} catch (Exception ex) {
    log.error("Postgres insert failed for userId {}. Compensating Keycloak user rollback...", userId, ex);
    try {
        usersResource.get(createdUserIdStr).remove(); // Compensating transaction
        log.info("Keycloak compensation rollback successful: Deleted orphaned user {}", createdUserIdStr);
    } catch (Exception rollbackEx) {
        log.error("CRITICAL: Failed to rollback Keycloak user {}", createdUserIdStr, rollbackEx);
    }
    throw new RuntimeException("Database error persisting profile. Transaction compensated.", ex);
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Spring Security 6 Resource Server */}
        {activeTab === 'security' && (
          <div className="mt-6 space-y-5">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <h4 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Modern Spring Security 6 Resource Server vs Deprecated Adapters
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Red Hat deprecated the legacy <code className="text-rose-400">keycloak-spring-boot-starter</code> in Keycloak 18+. In Keycloak 24+ and Spring Boot 3.4.2, the industry standard is to use pure <strong>Spring Security 6.x OAuth2 Resource Server</strong> with standard OIDC / JWT validation and a custom <code className="text-indigo-400">JwtAuthConverter</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="font-semibold text-white mb-1">1. Stateless Validation</div>
                  <p className="text-slate-400">
                    The service validates JWT signatures locally using Keycloak's public JWKS endpoint (<code className="text-sky-400 font-mono">/protocol/openid-connect/certs</code>) with zero runtime network calls per request.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="font-semibold text-white mb-1">2. Role Hierarchy Extraction</div>
                  <p className="text-slate-400">
                    <code className="text-indigo-400 font-mono">JwtAuthConverter</code> maps both Keycloak <code className="text-sky-300">realm_access.roles</code> and client-specific <code className="text-sky-300">resource_access.{'{clientId}'}.roles</code> to Spring Security <code className="text-emerald-300">ROLE_*</code> authorities.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="font-semibold text-white mb-1">3. Direct Access Grant</div>
                  <p className="text-slate-400">
                    <code className="text-emerald-400 font-mono">/api/v1/auth/login</code> proxies resource owner password credentials securely to Keycloak's token endpoint and returns full OAuth2 tokens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
