import React, { useState } from 'react';
import { KeyRound, Copy, Check, Terminal, ExternalLink, ShieldCheck, Download, AlertCircle } from 'lucide-react';

export const KeycloakGuide: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const realmJsonSample = `{
  "id": "microservices-realm",
  "realm": "microservices-realm",
  "enabled": true,
  "displayName": "Microservices Identity Realm",
  "sslRequired": "external",
  "registrationAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "accessTokenLifespan": 300,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "roles": {
    "realm": [
      {
        "name": "ROLE_USER",
        "description": "Standard microservices user role"
      },
      {
        "name": "ROLE_CLINICIAN",
        "description": "Healthcare clinician provider role"
      },
      {
        "name": "ROLE_ADMIN",
        "description": "Administrative role"
      }
    ]
  },
  "clients": [
    {
      "clientId": "user-auth-service",
      "name": "User Authentication & Profile Service",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "admin-client-secret-placeholder",
      "bearerOnly": false,
      "consentRequired": false,
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": true,
      "publicClient": false,
      "protocol": "openid-connect",
      "fullScopeAllowed": true,
      "protocolMappers": [
        {
          "name": "access_start_date_mapper",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-attribute-mapper",
          "consentRequired": false,
          "config": {
            "userinfo.token.claim": "true",
            "user.attribute": "access_start_date",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "claim.name": "access_start_date",
            "jsonType.label": "String"
          }
        },
        {
          "name": "access_end_date_mapper",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-attribute-mapper",
          "consentRequired": false,
          "config": {
            "userinfo.token.claim": "true",
            "user.attribute": "access_end_date",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "claim.name": "access_end_date",
            "jsonType.label": "String"
          }
        }
      ]
    }
  ]
}`;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-sky-950 text-sky-400 rounded-lg border border-sky-800/60">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Keycloak 24+ Production Realm Setup & Configuration</h2>
            <p className="text-xs text-slate-400">Step-by-step instructions for configuring Keycloak 24+ for OpenID Connect and Spring Security 6 Resource Server.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-xs">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">Step 1</span>
            <h4 className="font-semibold text-white mb-1">Create Realm</h4>
            <p className="text-slate-400">
              Create a realm named <code className="text-sky-300 font-mono">microservices-realm</code> (separate from <code className="text-slate-300 font-mono">master</code>).
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">Step 2</span>
            <h4 className="font-semibold text-white mb-1">Create Client</h4>
            <p className="text-slate-400">
              Create client <code className="text-sky-300 font-mono">user-auth-service</code> with Client authentication: <strong>ON</strong> and Direct access grants: <strong>ON</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">Step 3</span>
            <h4 className="font-semibold text-white mb-1">Grant Service Account Roles</h4>
            <p className="text-slate-400">
              Under <strong>Service Account roles</strong>, assign <code className="text-emerald-300 font-mono">realm-management</code> roles: <code className="text-emerald-400 font-mono">manage-users</code> and <code className="text-emerald-400 font-mono">query-users</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Realm JSON Template Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Automated Import: realm-export.json</h3>
            <p className="text-xs text-slate-400">Import this directly via Keycloak Admin Console or place in <code className="text-sky-300">/opt/keycloak/data/import/</code></p>
          </div>

          <button
            onClick={() => handleCopy('realm', realmJsonSample)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copied === 'realm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'realm' ? 'Copied to Clipboard' : 'Copy Realm JSON'}</span>
          </button>
        </div>

        <pre className="mt-3 p-4 bg-slate-950 rounded-lg text-xs font-mono text-sky-300 overflow-x-auto max-h-96 border border-slate-800/80 leading-relaxed">
          {realmJsonSample}
        </pre>
      </div>

      {/* Docker Compose Quickstart Command */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Launch Keycloak & PostgreSQL with Docker Compose
          </h3>
          <button
            onClick={() => handleCopy('docker', 'docker compose up -d')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
          >
            {copied === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'docker' ? 'Copied' : 'Copy Command'}</span>
          </button>
        </div>

        <div className="mt-3 p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 border border-slate-800">
          $ cd user-auth-service<br />
          $ docker compose up -d
        </div>
        <p className="text-xs text-slate-400 mt-2">
          This boots Keycloak 24+ on port <strong>8081</strong>, PostgreSQL on port <strong>5432</strong> with database <code className="text-emerald-300 font-mono">mydb</code>, and the <code className="text-indigo-300 font-mono">user-auth-service</code> on port <strong>8080</strong>.
        </p>
      </div>
    </div>
  );
};
