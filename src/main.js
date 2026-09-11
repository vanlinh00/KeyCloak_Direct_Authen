import './index.css';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      <!-- Top Navigation Header -->
      <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gradient-to-br from-indigo-600 to-sky-600 rounded-xl text-white shadow-md shadow-indigo-500/20 font-bold text-lg">
              ☕
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-base sm:text-lg font-bold tracking-tight text-white">user-auth-service</h1>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                  Java 21 • Spring Boot 3.4.2
                </span>
              </div>
              <p class="text-xs text-slate-400">
                Keycloak 24+ IAM & PostgreSQL Dual-Store Saga Architecture (Pure Java Backend)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <span class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Port: 8080
            </span>
            <span class="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
              Keycloak: 8081
            </span>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        <!-- Status Notification -->
        <div class="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-emerald-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="font-semibold">Pure Java Microservice Repository:</span>
            <span>All TypeScript files removed (0.0% TypeScript). Production Spring Boot service resides in <code>/user-auth-service/</code>.</span>
          </div>
        </div>

        <!-- Quick Tabs -->
        <div class="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button id="tab-btn-arch" class="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition-all">
            Dual-Store Architecture
          </button>
          <button id="tab-btn-endpoints" class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all">
            API Endpoints (/api/v1)
          </button>
          <button id="tab-btn-docker" class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all">
            Docker & Keycloak Setup
          </button>
        </div>

        <!-- Tab 1: Architecture -->
        <section id="tab-content-arch" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Keycloak IAM Store -->
            <div class="bg-slate-900 border border-sky-900/50 rounded-xl p-5">
              <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 class="text-sm font-bold text-sky-400 flex items-center gap-2">
                  🔐 Keycloak 24+ IAM Identity Store
                </h3>
                <span class="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">OIDC Provider</span>
              </div>
              <ul class="text-xs space-y-2 text-slate-300">
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">login_id</span>
                  <span class="text-sky-300 font-mono">username</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">initial_password</span>
                  <span class="text-sky-300 font-mono">credentials (temporary = true)</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">is_confirmed</span>
                  <span class="text-sky-300 font-mono">emailVerified</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">is_deleted</span>
                  <span class="text-sky-300 font-mono">enabled (!is_deleted)</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-emerald-800/60 bg-emerald-950/20 flex justify-between">
                  <span class="font-mono text-emerald-300 font-bold">id</span>
                  <span class="text-emerald-400 font-mono font-bold">sub (UUID Primary Key)</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">full_name</span>
                  <span class="text-sky-300 font-mono">firstName & lastName</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">access_start / end_date</span>
                  <span class="text-amber-300 font-mono">user.attributes</span>
                </li>
              </ul>
            </div>

            <!-- PostgreSQL Store -->
            <div class="bg-slate-900 border border-emerald-900/50 rounded-xl p-5">
              <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  🗄️ PostgreSQL (mydb.user_profiles)
                </h3>
                <span class="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">Spring Data JPA</span>
              </div>
              <ul class="text-xs space-y-2 text-slate-300">
                <li class="p-2 bg-slate-950 rounded border border-emerald-800/60 bg-emerald-950/20 flex justify-between">
                  <span class="font-mono text-emerald-300 font-bold">id</span>
                  <span class="text-emerald-400 font-mono font-bold">UUID PK (= Keycloak sub)</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">Health / Biometrics</span>
                  <span class="text-emerald-300 font-mono">gender, date_of_birth, height_cm</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">Insurance Card</span>
                  <span class="text-emerald-300 font-mono">insured_card_number, expiration</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">App Context</span>
                  <span class="text-emerald-300 font-mono">group_id, nick_name</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">Loyalty Rewards</span>
                  <span class="text-emerald-300 font-mono">point, point_received_date</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">Lifecycle State</span>
                  <span class="text-emerald-300 font-mono">reg_verify_status, previous_state</span>
                </li>
                <li class="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span class="font-mono text-slate-400">Audit Timestamps</span>
                  <span class="text-slate-400 font-mono">created_at, updated_at (TIMESTAMPTZ)</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Distributed Saga Box -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              🔄 Distributed Saga with Compensation Rollback
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed mb-3">
              When a user registers (<code>POST /api/v1/users/register</code>), the service first provisions the identity in Keycloak. If saving the extended profile into PostgreSQL fails (e.g., unique insurance card constraint or timeout), <code>UserService.java</code> catches the exception and immediately invokes a <strong>compensating rollback</strong>: <code>usersResource.get(userId).remove()</code>, preventing zombie IAM accounts.
            </p>
          </div>
        </section>

        <!-- Tab 2: Endpoints -->
        <section id="tab-content-endpoints" class="hidden space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-white mb-3">REST API Endpoints Specification</h3>
            <div class="space-y-3 text-xs font-mono">
              <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-sky-900 text-sky-300 font-bold mr-2">POST</span>
                  <span class="text-white">/api/v1/auth/login</span>
                </div>
                <span class="text-slate-400 text-[11px] font-sans">Direct Access Grant -> Access + Refresh JWT</span>
              </div>
              <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-sky-900 text-sky-300 font-bold mr-2">POST</span>
                  <span class="text-white">/api/v1/auth/refresh</span>
                </div>
                <span class="text-slate-400 text-[11px] font-sans">Exchanges refresh token for new access token</span>
              </div>
              <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-sky-900 text-sky-300 font-bold mr-2">POST</span>
                  <span class="text-white">/api/v1/auth/logout</span>
                </div>
                <span class="text-slate-400 text-[11px] font-sans">Revokes active Keycloak IAM session</span>
              </div>
              <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold mr-2">POST</span>
                  <span class="text-white">/api/v1/users/register</span>
                </div>
                <span class="text-slate-400 text-[11px] font-sans">Dual-store registration with Saga rollback</span>
              </div>
              <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 font-bold mr-2">GET</span>
                  <span class="text-white">/api/v1/users/me</span>
                </div>
                <span class="text-slate-400 text-[11px] font-sans">Protected (Bearer JWT) -> Returns enriched profile</span>
              </div>
              <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-amber-900 text-amber-300 font-bold mr-2">PUT</span>
                  <span class="text-white">/api/v1/users/me</span>
                </div>
                <span class="text-slate-400 text-[11px] font-sans">Protected (Bearer JWT) -> Updates PostgreSQL profile</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Tab 3: Docker -->
        <section id="tab-content-docker" class="hidden space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-white mb-2">Run with Docker Compose</h3>
            <p class="text-xs text-slate-300 mb-3">
              Spins up PostgreSQL 16 (<code>mydb</code>), Keycloak 24+ (port 8081), and <code>user-auth-service</code> (port 8080):
            </p>
            <pre class="p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 border border-slate-800">
cd user-auth-service
docker compose up -d
            </pre>
            <div class="mt-4 text-xs text-slate-400 space-y-1">
              <p>• Service API & Swagger: <a href="http://localhost:8080/swagger-ui.html" target="_blank" class="text-indigo-400 hover:underline">http://localhost:8080/swagger-ui.html</a></p>
              <p>• Keycloak Admin: <a href="http://localhost:8081" target="_blank" class="text-sky-400 hover:underline">http://localhost:8081</a> (admin / adminpassword)</p>
            </div>
          </div>
        </section>
      </main>

      <footer class="max-w-7xl mx-auto px-4 lg:px-8 mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        user-auth-service • Spring Boot 3.4.2 & Keycloak 24+ • Production Java Microservice
      </footer>
    </div>
  `;

  // Tab switching logic
  const tabArch = document.getElementById('tab-btn-arch');
  const tabEndpoints = document.getElementById('tab-btn-endpoints');
  const tabDocker = document.getElementById('tab-btn-docker');

  const contentArch = document.getElementById('tab-content-arch');
  const contentEndpoints = document.getElementById('tab-content-endpoints');
  const contentDocker = document.getElementById('tab-content-docker');

  const setTab = (tab) => {
    [tabArch, tabEndpoints, tabDocker].forEach(btn => {
      btn.className = 'px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all';
    });
    [contentArch, contentEndpoints, contentDocker].forEach(c => c.classList.add('hidden'));

    if (tab === 'arch') {
      tabArch.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition-all';
      contentArch.classList.remove('hidden');
    } else if (tab === 'endpoints') {
      tabEndpoints.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition-all';
      contentEndpoints.classList.remove('hidden');
    } else if (tab === 'docker') {
      tabDocker.className = 'px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition-all';
      contentDocker.classList.remove('hidden');
    }
  };

  tabArch.addEventListener('click', () => setTab('arch'));
  tabEndpoints.addEventListener('click', () => setTab('endpoints'));
  tabDocker.addEventListener('click', () => setTab('docker'));
});
