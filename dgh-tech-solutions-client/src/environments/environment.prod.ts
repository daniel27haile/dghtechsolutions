// Production environment
// Used automatically by `ng build --configuration production`
// In Docker: nginx proxies /api → backend container (same origin, no CORS needed)
// Direct subdomain deploy: change apiUrl to 'https://api.dghtechsolutions.com/api'
export const environment = {
  production: true,
  apiUrl: '/api',
};
