// src/api/config.js
// 상대경로로 호출 → Vite dev 서버의 proxy가 /api 를 백엔드(localhost:8001)로 전달.
// localhost, 로컬 IP, Cloudflare Tunnel URL 어디서든 동일하게 작동.
export const API_BASE_URL = '/api/v1';