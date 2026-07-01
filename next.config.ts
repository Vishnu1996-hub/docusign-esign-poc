import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['docusign-esign'],
  // docusign-esign is an old Swagger-Codegen SDK: every file under src/ ships a
  // UMD wrapper with an AMD define() branch that is dead code in Node.js (no AMD
  // loader is ever present), but Turbopack still statically parses it while
  // tracing this external package's files and fails on its unsupported forms.
  turbopack: {
    ignoreIssue: [
      { path: '**/docusign-esign/src/**', title: /unsupported AMD define/ },
    ],
  },
};

export default nextConfig;
