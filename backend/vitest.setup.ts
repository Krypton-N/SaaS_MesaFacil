// Valores por defecto para que config/env.ts valide correctamente durante los
// tests sin requerir un archivo .env real. No sobrescribe variables ya definidas.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ||= 'test-secret-key-please-ignore-1234567890';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-1234567890';
process.env.LM_STUDIO_URL ||= 'http://localhost:1234/v1';
