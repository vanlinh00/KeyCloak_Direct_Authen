import React, { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Database, KeyRound, UserPlus, LogIn, RefreshCw, LogOut, User, Edit3, ShieldAlert } from 'lucide-react';

interface KeycloakUserRecord {
  id: string; // UUID
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  enabled: boolean;
  createdTimestamp: number;
  attributes: Record<string, string[]>;
  roles: string[];
}

interface PostgresProfileRecord {
  id: string; // UUID
  gender: string;
  date_of_birth: string;
  height_cm: number;
  insured_card_number: string;
  insured_card_expiration: string;
  group_id: string;
  point: number;
  point_received_date: string;
  reg_verify_status: string;
  previous_state: string;
  nick_name: string;
  created_at: string;
  updated_at: string;
}

export const ApiSimulator: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('login');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatePgFailure, setSimulatePgFailure] = useState<boolean>(false);
  const [activeToken, setActiveToken] = useState<string | null>('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.simulated_access_token');
  const [refreshToken, setRefreshToken] = useState<string>('eyJhbGciOiJSUzI1NiJ9.simulated_refresh_token');

  // Simulated in-memory database states
  const [keycloakUsers, setKeycloakUsers] = useState<KeycloakUserRecord[]>([
    {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      username: 'doctor_smith',
      email: 'alex.smith@hospital.org',
      firstName: 'Alexander',
      lastName: 'Smith',
      emailVerified: true,
      enabled: true,
      createdTimestamp: 1715423400000,
      attributes: {
        access_start_date: ['2026-01-01'],
        access_end_date: ['2026-12-31']
      },
      roles: ['ROLE_USER', 'ROLE_CLINICIAN']
    }
  ]);

  const [postgresProfiles, setPostgresProfiles] = useState<PostgresProfileRecord[]>([
    {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      gender: 'MALE',
      date_of_birth: '1988-06-15',
      height_cm: 178.5,
      insured_card_number: 'INS-987654321',
      insured_card_expiration: '2028-12-31',
      group_id: 'CLINICAL_GRP_01',
      point: 250,
      point_received_date: '2026-02-15T08:30:00Z',
      reg_verify_status: 'VERIFIED',
      previous_state: 'INITIAL_ONBOARDING',
      nick_name: 'DrAlex',
      created_at: '2026-01-02T10:00:00Z',
      updated_at: '2026-02-15T08:30:00Z'
    }
  ]);

  // Request Forms State
  const [loginForm, setLoginForm] = useState({ loginId: 'doctor_smith', password: 'Password123!' });
  const [registerForm, setRegisterForm] = useState({
    loginId: 'nurse_sarah',
    initialPassword: 'SarahInitialPass99!',
    email: 'sarah.j@clinic.org',
    fullName: 'Sarah Jenkins',
    isConfirmed: true,
    isDeleted: false,
    accessStartDate: '2026-03-01',
    accessEndDate: '2027-03-01',
    gender: 'FEMALE',
    dateOfBirth: '1992-04-20',
    heightCm: 165.0,
    insuredCardNumber: 'INS-554433221',
    insuredCardExpiration: '2029-05-15',
    groupId: 'NURSING_DEPT',
    point: 100,
    nickName: 'SarahJ'
  });
  const [updateProfileForm, setUpdateProfileForm] = useState({
    gender: 'MALE',
    dateOfBirth: '1988-06-15',
    heightCm: 179.0,
    insuredCardNumber: 'INS-987654321',
    insuredCardExpiration: '2029-12-31',
    groupId: 'CLINICAL_LEAD',
    nickName: 'ChiefAlex'
  });

  // Execution Output
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<any>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setExecutionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Execution Handlers
  const executeLogin = () => {
    addLog(`POST /api/v1/auth/login with loginId: ${loginForm.loginId}`);
    const user = keycloakUsers.find(u => u.username === loginForm.loginId);
    if (!user || !user.enabled) {
      setResponseStatus(401);
      setResponsePayload({
        success: false,
        message: 'Invalid login ID or password',
        data: null,
        timestamp: new Date().toISOString()
      });
      addLog(`Keycloak rejected credentials: 401 Unauthorized`);
      return;
    }

    const mockAccessToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
      sub: user.id,
      preferred_username: user.username,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      email_verified: user.emailVerified,
      realm_access: { roles: user.roles },
      resource_access: { 'user-auth-service': { roles: user.roles } },
      exp: Math.floor(Date.now() / 1000) + 300
    }))}.signature`;

    const mockRefreshToken = `eyJhbGciOiJSUzI1NiJ9.${btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 1800 }))}.refresh_sig`;

    setActiveToken(mockAccessToken);
    setRefreshToken(mockRefreshToken);
    setResponseStatus(200);
    setResponsePayload({
      success: true,
      message: 'Authentication successful',
      data: {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 300,
        refresh_expires_in: 1800,
        token_type: 'Bearer',
        scope: 'openid profile email'
      },
      timestamp: new Date().toISOString()
    });
    addLog(`Keycloak Direct Access Grant successful. Issued new Bearer JWT.`);
  };

  const executeRefresh = () => {
    addLog(`POST /api/v1/auth/refresh`);
    const newAccess = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
      sub: keycloakUsers[0]?.id || 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      preferred_username: keycloakUsers[0]?.username || 'doctor_smith',
      exp: Math.floor(Date.now() / 1000) + 300
    }))}.renewed_token`;

    setActiveToken(newAccess);
    setResponseStatus(200);
    setResponsePayload({
      success: true,
      message: 'Token refreshed',
      data: {
        access_token: newAccess,
        refresh_token: refreshToken,
        expires_in: 300,
        refresh_expires_in: 1800,
        token_type: 'Bearer',
        scope: 'openid profile email'
      },
      timestamp: new Date().toISOString()
    });
    addLog(`Token refreshed via Keycloak token endpoint.`);
  };

  const executeLogout = () => {
    addLog(`POST /api/v1/auth/logout with refresh_token`);
    setActiveToken(null);
    setResponseStatus(200);
    setResponsePayload({
      success: true,
      message: 'Session revoked successfully in Keycloak IAM',
      data: null,
      timestamp: new Date().toISOString()
    });
    addLog(`Revoked session on Keycloak end-session endpoint.`);
  };

  const executeRegister = () => {
    addLog(`POST /api/v1/users/register for loginId: ${registerForm.loginId}`);

    // Check duplicate
    if (keycloakUsers.some(u => u.username === registerForm.loginId)) {
      setResponseStatus(409);
      setResponsePayload({
        success: false,
        message: 'Username or email is already registered in Keycloak',
        data: null,
        timestamp: new Date().toISOString()
      });
      addLog(`Conflict: Username '${registerForm.loginId}' already exists in Keycloak.`);
      return;
    }

    // Step 1: Create in Keycloak
    const generatedUuid = crypto.randomUUID();
    const [firstName, ...rest] = registerForm.fullName.split(' ');
    const lastName = rest.join(' ') || '';

    const newKeycloakUser: KeycloakUserRecord = {
      id: generatedUuid,
      username: registerForm.loginId,
      email: registerForm.email,
      firstName,
      lastName,
      emailVerified: registerForm.isConfirmed,
      enabled: !registerForm.isDeleted,
      createdTimestamp: Date.now(),
      attributes: {
        access_start_date: [registerForm.accessStartDate],
        access_end_date: [registerForm.accessEndDate]
      },
      roles: ['ROLE_USER']
    };

    addLog(`Step 1: Created Keycloak User with UUID: ${generatedUuid}`);

    // Step 2: Persist in PostgreSQL (or simulate failure)
    if (simulatePgFailure) {
      addLog(`Step 2: PostgreSQL insert failed! [Simulated DB constraint / timeout]`);
      addLog(`Saga Compensation Triggered: Executing Keycloak usersResource.get(${generatedUuid}).remove()...`);
      addLog(`Compensation Succeeded: Keycloak user ${generatedUuid} removed. System remains consistent.`);

      setResponseStatus(500);
      setResponsePayload({
        success: false,
        message: 'Database error occurred while persisting user profile. Transaction compensated (Keycloak user deleted).',
        data: null,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Normal Success
    const newProfile: PostgresProfileRecord = {
      id: generatedUuid,
      gender: registerForm.gender,
      date_of_birth: registerForm.dateOfBirth,
      height_cm: Number(registerForm.heightCm),
      insured_card_number: registerForm.insuredCardNumber,
      insured_card_expiration: registerForm.insuredCardExpiration,
      group_id: registerForm.groupId,
      point: Number(registerForm.point),
      point_received_date: new Date().toISOString(),
      reg_verify_status: 'PENDING',
      previous_state: 'REGISTERED',
      nick_name: registerForm.nickName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setKeycloakUsers(prev => [...prev, newKeycloakUser]);
    setPostgresProfiles(prev => [...prev, newProfile]);

    addLog(`Step 2: Persisted profile in PostgreSQL mydb.user_profiles under UUID: ${generatedUuid}`);

    setResponseStatus(201);
    setResponsePayload({
      success: true,
      message: 'User registered successfully across Keycloak and PostgreSQL',
      data: {
        id: generatedUuid,
        loginId: newKeycloakUser.username,
        email: newKeycloakUser.email,
        firstName: newKeycloakUser.firstName,
        lastName: newKeycloakUser.lastName,
        fullName: `${newKeycloakUser.firstName} ${newKeycloakUser.lastName}`,
        isConfirmed: newKeycloakUser.emailVerified,
        isDeleted: !newKeycloakUser.enabled,
        roles: newKeycloakUser.roles,
        accessStartDate: registerForm.accessStartDate,
        accessEndDate: registerForm.accessEndDate,
        gender: newProfile.gender,
        dateOfBirth: newProfile.date_of_birth,
        heightCm: newProfile.height_cm,
        insuredCardNumber: newProfile.insured_card_number,
        insuredCardExpiration: newProfile.insured_card_expiration,
        groupId: newProfile.group_id,
        point: newProfile.point,
        regVerifyStatus: newProfile.reg_verify_status,
        nickName: newProfile.nick_name,
        profileCreatedAt: newProfile.created_at,
        profileUpdatedAt: newProfile.updated_at
      },
      timestamp: new Date().toISOString()
    });
  };

  const executeGetMe = () => {
    addLog(`GET /api/v1/users/me with Bearer JWT`);
    if (!activeToken) {
      setResponseStatus(401);
      setResponsePayload({
        success: false,
        message: 'Full authentication is required to access this resource',
        data: null,
        timestamp: new Date().toISOString()
      });
      addLog(`Spring Security 6 rejected request: 401 Unauthorized (Missing/invalid Bearer token)`);
      return;
    }

    const firstUser = keycloakUsers[0];
    const profile = postgresProfiles.find(p => p.id === firstUser.id);

    if (!profile) {
      setResponseStatus(404);
      setResponsePayload({
        success: false,
        message: 'User profile not found in PostgreSQL',
        data: null,
        timestamp: new Date().toISOString()
      });
      return;
    }

    setResponseStatus(200);
    setResponsePayload({
      success: true,
      message: 'User profile fetched successfully',
      data: {
        id: profile.id,
        loginId: firstUser.username,
        email: firstUser.email,
        firstName: firstUser.firstName,
        lastName: firstUser.lastName,
        fullName: `${firstUser.firstName} ${firstUser.lastName}`,
        isConfirmed: firstUser.emailVerified,
        isDeleted: !firstUser.enabled,
        roles: firstUser.roles,
        accessStartDate: firstUser.attributes.access_start_date?.[0],
        accessEndDate: firstUser.attributes.access_end_date?.[0],
        keycloakCreatedTimestamp: firstUser.createdTimestamp,
        gender: profile.gender,
        dateOfBirth: profile.date_of_birth,
        heightCm: profile.height_cm,
        insuredCardNumber: profile.insured_card_number,
        insuredCardExpiration: profile.insured_card_expiration,
        groupId: profile.group_id,
        point: profile.point,
        pointReceivedDate: profile.point_received_date,
        regVerifyStatus: profile.reg_verify_status,
        previousState: profile.previous_state,
        nickName: profile.nick_name,
        profileCreatedAt: profile.created_at,
        profileUpdatedAt: profile.updated_at
      },
      timestamp: new Date().toISOString()
    });
    addLog(`Successfully combined Keycloak JWT claims with PostgreSQL profile.`);
  };

  const executeUpdateMe = () => {
    addLog(`PUT /api/v1/users/me with Bearer JWT`);
    if (!activeToken) {
      setResponseStatus(401);
      setResponsePayload({
        success: false,
        message: 'Full authentication is required to access this resource',
        data: null,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const targetId = keycloakUsers[0].id;
    setPostgresProfiles(prev =>
      prev.map(p => {
        if (p.id === targetId) {
          return {
            ...p,
            gender: updateProfileForm.gender,
            date_of_birth: updateProfileForm.dateOfBirth,
            height_cm: Number(updateProfileForm.heightCm),
            insured_card_number: updateProfileForm.insuredCardNumber,
            insured_card_expiration: updateProfileForm.insuredCardExpiration,
            group_id: updateProfileForm.groupId,
            nick_name: updateProfileForm.nickName,
            updated_at: new Date().toISOString()
          };
        }
        return p;
      })
    );

    addLog(`Updated PostgreSQL record in mydb.user_profiles for ID: ${targetId}`);
    executeGetMe();
  };

  const getCurlCommand = () => {
    switch (selectedEndpoint) {
      case 'login':
        return `curl -X POST http://localhost:8080/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"loginId":"${loginForm.loginId}","password":"${loginForm.password}"}'`;
      case 'refresh':
        return `curl -X POST http://localhost:8080/api/v1/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"${refreshToken}"}'`;
      case 'logout':
        return `curl -X POST http://localhost:8080/api/v1/auth/logout \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"${refreshToken}"}'`;
      case 'register':
        return `curl -X POST http://localhost:8080/api/v1/users/register \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(registerForm, null, 2)}'`;
      case 'getMe':
        return `curl -X GET http://localhost:8080/api/v1/users/me \\
  -H "Authorization: Bearer ${activeToken || '<ACCESS_TOKEN>'}"`;
      case 'putMe':
        return `curl -X PUT http://localhost:8080/api/v1/users/me \\
  -H "Authorization: Bearer ${activeToken || '<ACCESS_TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(updateProfileForm, null, 2)}'`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoint Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedEndpoint('login')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEndpoint === 'login' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>POST /auth/login</span>
          </button>
          <button
            onClick={() => setSelectedEndpoint('refresh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEndpoint === 'refresh' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>POST /auth/refresh</span>
          </button>
          <button
            onClick={() => setSelectedEndpoint('logout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEndpoint === 'logout' ? 'bg-sky-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>POST /auth/logout</span>
          </button>
          <button
            onClick={() => setSelectedEndpoint('register')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEndpoint === 'register' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>POST /users/register</span>
          </button>
          <button
            onClick={() => setSelectedEndpoint('getMe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEndpoint === 'getMe' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>GET /users/me</span>
          </button>
          <button
            onClick={() => setSelectedEndpoint('putMe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEndpoint === 'putMe' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>PUT /users/me</span>
          </button>
        </div>

        {/* Active Session Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Security Session:</span>
          {activeToken ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Authenticated (Bearer)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
              Anonymous / Logged Out
            </span>
          )}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Panel: 5 columns */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Request Parameters
              </h3>
              <button
                onClick={() => {
                  if (selectedEndpoint === 'login') executeLogin();
                  if (selectedEndpoint === 'refresh') executeRefresh();
                  if (selectedEndpoint === 'logout') executeLogout();
                  if (selectedEndpoint === 'register') executeRegister();
                  if (selectedEndpoint === 'getMe') executeGetMe();
                  if (selectedEndpoint === 'putMe') executeUpdateMe();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                Send Request
              </button>
            </div>

            {/* Form for Login */}
            {selectedEndpoint === 'login' && (
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Login ID (Keycloak username)</label>
                  <input
                    type="text"
                    value={loginForm.loginId}
                    onChange={e => setLoginForm({ ...loginForm, loginId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  Calls Keycloak Token Endpoint with <code className="text-sky-400">grant_type=password</code>. Returns <code className="text-emerald-400">access_token</code> and <code className="text-emerald-400">refresh_token</code>.
                </div>
              </div>
            )}

            {/* Form for Refresh */}
            {selectedEndpoint === 'refresh' && (
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Refresh Token</label>
                  <textarea
                    rows={3}
                    value={refreshToken}
                    onChange={e => setRefreshToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Exchanges the active Keycloak refresh token for a newly minted access token without asking the user for re-authentication.
                </p>
              </div>
            )}

            {/* Form for Logout */}
            {selectedEndpoint === 'logout' && (
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Refresh Token to Invalidate</label>
                  <textarea
                    rows={3}
                    value={refreshToken}
                    onChange={e => setRefreshToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Invalidates the refresh token and ends the active Keycloak session via <code className="text-sky-400">/protocol/openid-connect/logout</code>.
                </p>
              </div>
            )}

            {/* Form for Register (Dual Store) */}
            {selectedEndpoint === 'register' && (
              <div className="space-y-3 mt-4 text-xs max-h-[460px] overflow-y-auto pr-1">
                {/* Failure simulation toggle */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-amber-200 block text-[11px]">Simulate PostgreSQL Failure</span>
                      <span className="text-[10px] text-amber-300/80">Triggers Saga compensation to rollback Keycloak user</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulatePgFailure}
                    onChange={e => setSimulatePgFailure(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-2">1. Keycloak IAM Fields</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Login ID (username)</label>
                      <input
                        type="text"
                        value={registerForm.loginId}
                        onChange={e => setRegisterForm({ ...registerForm, loginId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Initial Password (temp=true)</label>
                      <input
                        type="password"
                        value={registerForm.initialPassword}
                        onChange={e => setRegisterForm({ ...registerForm, initialPassword: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Email</label>
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Full Name</label>
                      <input
                        type="text"
                        value={registerForm.fullName}
                        onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Access Start Date (Attribute)</label>
                      <input
                        type="date"
                        value={registerForm.accessStartDate}
                        onChange={e => setRegisterForm({ ...registerForm, accessStartDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Access End Date (Attribute)</label>
                      <input
                        type="date"
                        value={registerForm.accessEndDate}
                        onChange={e => setRegisterForm({ ...registerForm, accessEndDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">2. PostgreSQL Profile Fields</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Gender</label>
                      <select
                        value={registerForm.gender}
                        onChange={e => setRegisterForm({ ...registerForm, gender: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100"
                      >
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={registerForm.dateOfBirth}
                        onChange={e => setRegisterForm({ ...registerForm, dateOfBirth: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={registerForm.heightCm}
                        onChange={e => setRegisterForm({ ...registerForm, heightCm: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Insured Card No</label>
                      <input
                        type="text"
                        value={registerForm.insuredCardNumber}
                        onChange={e => setRegisterForm({ ...registerForm, insuredCardNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Group ID</label>
                      <input
                        type="text"
                        value={registerForm.groupId}
                        onChange={e => setRegisterForm({ ...registerForm, groupId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form for GET /me */}
            {selectedEndpoint === 'getMe' && (
              <div className="space-y-3 mt-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-1">Authorization Header:</span>
                  <div className="font-mono text-[11px] text-emerald-400 truncate">
                    Bearer {activeToken ? `${activeToken.substring(0, 32)}...` : '(null - will result in 401)'}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Extracts <code className="text-sky-400">sub</code>, <code className="text-sky-400">preferred_username</code>, and roles from the Bearer JWT, fetches extended profile records from PostgreSQL <code className="text-emerald-400">mydb.user_profiles</code>, and returns the aggregated profile.
                </p>
              </div>
            )}

            {/* Form for PUT /me */}
            {selectedEndpoint === 'putMe' && (
              <div className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={updateProfileForm.heightCm}
                      onChange={e => setUpdateProfileForm({ ...updateProfileForm, heightCm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Nick Name</label>
                    <input
                      type="text"
                      value={updateProfileForm.nickName}
                      onChange={e => setUpdateProfileForm({ ...updateProfileForm, nickName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Group ID</label>
                  <input
                    type="text"
                    value={updateProfileForm.groupId}
                    onChange={e => setUpdateProfileForm({ ...updateProfileForm, groupId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Generated cURL command */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> cURL Command
                </span>
                <button
                  onClick={() => handleCopy(getCurlCommand())}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2 bg-slate-950 rounded text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800/80">
                {getCurlCommand()}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Output & State Panel: 7 columns */}
        <div className="lg:col-span-7 space-y-4">
          {/* Response Payload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">HTTP Response Envelope</span>
                {responseStatus && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : responseStatus >= 400 && responseStatus < 500
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'CREATED' : responseStatus === 401 ? 'UNAUTHORIZED' : responseStatus === 409 ? 'CONFLICT' : 'INTERNAL ERROR'}
                  </span>
                )}
              </div>
              {responsePayload && (
                <button
                  onClick={() => handleCopy(JSON.stringify(responsePayload, null, 2))}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              )}
            </div>

            <div className="mt-3">
              {responsePayload ? (
                <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 border border-slate-800/80 leading-relaxed">
                  {JSON.stringify(responsePayload, null, 2)}
                </pre>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Select an endpoint on the left and click "Send Request" to simulate real-time Keycloak and PostgreSQL interactions.
                </div>
              )}
            </div>
          </div>

          {/* Dual Store State Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Live Dual-Store In-Memory Records ({keycloakUsers.length} Users Registered)
              </h4>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Keycloak State */}
              <div className="p-3 bg-slate-950 rounded-lg border border-sky-900/40">
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Keycloak User Directory ({keycloakUsers.length})</span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {keycloakUsers.map(u => (
                    <div key={u.id} className="p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px]">
                      <div className="font-mono text-white font-medium flex justify-between">
                        <span>{u.username}</span>
                        <span className={u.enabled ? 'text-emerald-400' : 'text-rose-400'}>{u.enabled ? 'ENABLED' : 'DISABLED'}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] truncate mt-0.5">UUID: {u.id}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">Roles: {u.roles.join(', ')}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PostgreSQL State */}
              <div className="p-3 bg-slate-950 rounded-lg border border-emerald-900/40">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>PostgreSQL: mydb.user_profiles ({postgresProfiles.length})</span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {postgresProfiles.map(p => (
                    <div key={p.id} className="p-2 bg-slate-900/90 rounded border border-slate-800 text-[11px]">
                      <div className="font-mono text-emerald-300 font-medium flex justify-between">
                        <span>Card: {p.insured_card_number}</span>
                        <span className="text-slate-300">{p.point} pts</span>
                      </div>
                      <div className="text-slate-400 text-[10px] truncate mt-0.5">PK id: {p.id}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">Group: {p.group_id} | Status: {p.reg_verify_status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
