import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const signup = (data) => client.post('/auth/signup', data).then(r => r.data);
export const login = (data) => client.post('/auth/login', data).then(r => r.data);
export const getMe = () => client.get('/auth/me').then(r => r.data);

export const getAgentConfig = (orgId) => client.get(`/orgs/${orgId}/agent-config`).then(r => r.data);
export const updateAgentConfig = (orgId, data) => client.patch(`/orgs/${orgId}/agent-config`, data).then(r => r.data);

export const createCheckout = (orgId, plan) =>
  client.post(`/orgs/${orgId}/billing/checkout`, { plan }).then(r => r.data);

export const sendChatMessage = (orgId, payload) =>
  client.post(`/orgs/${orgId}/chat`, payload).then(r => r.data);

export default client;