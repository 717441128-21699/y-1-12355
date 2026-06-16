import type {
  User,
  Petition,
  Clue,
  Case,
  ApprovalRecord,
  TalkRecord,
  TrialRecord,
  DashboardStats,
  LoginRequest,
  LoginResponse,
  ApiResponse,
} from '../../shared/types';

const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  return data as ApiResponse<T>;
};

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<User>('/auth/me'),

  getUsers: () => request<User[]>('/auth/users'),

  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const petitionApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Petition[]>(`/petitions${query}`);
  },

  get: (id: string) => request<Petition>(`/petitions/${id}`),

  create: (data: Partial<Petition>) =>
    request<Petition>('/petitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Petition>) =>
    request<Petition>(`/petitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  assign: (id: string, data: { assignedTo?: string; assignedDepartment: string }) =>
    request<Petition>(`/petitions/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  convertToClue: (id: string) =>
    request<Clue>(`/petitions/${id}/convert`, {
      method: 'PUT',
    }),
};

export const clueApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Clue[]>(`/clues${query}`);
  },

  get: (id: string) => request<Clue>(`/clues/${id}`),

  create: (data: Partial<Clue>) =>
    request<Clue>('/clues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Clue>) =>
    request<Clue>(`/clues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  start: (id: string) =>
    request<Clue>(`/clues/${id}/start`, {
      method: 'PUT',
    }),

  escalate: (id: string) =>
    request<Clue>(`/clues/${id}/escalate`, {
      method: 'PUT',
    }),
};

export const caseApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Case[]>(`/cases${query}`);
  },

  get: (id: string) => request<Case>(`/cases/${id}`),

  create: (data: Partial<Case>) =>
    request<Case>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Case>) =>
    request<Case>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  submitTrial: (id: string) =>
    request<Case>(`/cases/${id}/submit-trial`, {
      method: 'POST',
    }),
};

export const approvalApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<ApprovalRecord[]>(`/approvals${query}`);
  },

  get: (id: string) => request<ApprovalRecord>(`/approvals/${id}`),

  approve: (id: string, data: { opinion: string; signature: string }) =>
    request<ApprovalRecord>(`/approvals/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  reject: (id: string, data: { opinion: string; signature: string }) =>
    request<ApprovalRecord>(`/approvals/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const talkApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<TalkRecord[]>(`/talks${query}`);
  },

  get: (id: string) => request<TalkRecord>(`/talks/${id}`),

  create: (data: Partial<TalkRecord>) =>
    request<TalkRecord>('/talks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<TalkRecord>) =>
    request<TalkRecord>(`/talks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  upload: (id: string, data: { audioUrl?: string; videoUrl?: string }) =>
    request<TalkRecord>(`/talks/${id}/upload`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const trialApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<TrialRecord[]>(`/trials${query}`);
  },

  review: (id: string, data: { opinion: string; reviewOpinion?: string }) =>
    request<TrialRecord>(`/trials/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sign: (id: string, data: { signature: string }) =>
    request<TrialRecord>(`/trials/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateDecision: (id: string, data: { disciplineType: string; decisionContent: string }) =>
    request<TrialRecord>(`/trials/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  pushExecution: (id: string) =>
    request<TrialRecord>(`/trials/${id}/execute`, {
      method: 'POST',
    }),

  getDecision: (id: string) =>
    request<{ document: string; signature?: string }>(`/trials/${id}/decision`),
};

const requestBlob = async (
  url: string,
  options: RequestInit = {}
): Promise<Blob> => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...options.headers,
    },
  });
  return response.blob();
};

export const statsApi = {
  getDashboard: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<DashboardStats>(`/stats/dashboard${query}`);
  },

  getTrend: (months?: number) => {
    const query = months ? `?months=${months}` : '';
    return request<{ date: string; newCases: number; closedCases: number }[]>(
      `/stats/trend${query}`
    );
  },

  export: (params?: { month?: number; year?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    window.open(`${API_BASE}/stats/export${query}`, '_blank');
  },

  exportMonthly: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return requestBlob(`/stats/export${query}`);
  },
};
