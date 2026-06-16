import { create } from 'zustand';
import type {
  Petition,
  Clue,
  Case,
  ApprovalRecord,
  TalkRecord,
  TrialRecord,
  DashboardStats,
  User,
} from '../../shared/types';
import {
  petitionApi,
  clueApi,
  caseApi,
  approvalApi,
  talkApi,
  trialApi,
  statsApi,
  authApi,
} from '../api/client';

interface DataState {
  petitions: Petition[];
  clues: Clue[];
  cases: Case[];
  approvals: ApprovalRecord[];
  talks: TalkRecord[];
  trials: TrialRecord[];
  users: User[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;

  fetchPetitions: (params?: Record<string, string>) => Promise<void>;
  fetchClues: (params?: Record<string, string>) => Promise<void>;
  fetchCases: (params?: Record<string, string>) => Promise<void>;
  fetchApprovals: (params?: Record<string, string>) => Promise<void>;
  fetchTalks: (params?: Record<string, string>) => Promise<void>;
  fetchTrials: (params?: Record<string, string>) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchDashboardStats: (params?: Record<string, string>) => Promise<void>;
  getDashboardStats: () => Promise<DashboardStats | null>;

  createPetition: (data: Partial<Petition>) => Promise<Petition | null>;
  updatePetition: (id: string, data: Partial<Petition>) => Promise<Petition | null>;
  
  createClue: (data: Partial<Clue>) => Promise<Clue | null>;
  updateClue: (id: string, data: Partial<Clue>) => Promise<Clue | null>;
  startClue: (id: string) => Promise<Clue | null>;
  
  createCase: (data: Partial<Case>) => Promise<Case | null>;
  
  approveApproval: (id: string, data: { opinion: string; signature: string }) => Promise<ApprovalRecord | null>;
  rejectApproval: (id: string, data: { opinion: string; signature: string }) => Promise<ApprovalRecord | null>;
  
  createTalk: (data: Partial<TalkRecord>) => Promise<TalkRecord | null>;
  updateTalk: (id: string, data: Partial<TalkRecord>) => Promise<TalkRecord | null>;
  
  createTrial: (caseId: string, opinion: string) => Promise<TrialRecord | null>;
  signTrial: (id: string, signature: string) => Promise<TrialRecord | null>;
  completeTrial: (id: string, data: { reviewOpinion: string }) => Promise<TrialRecord | null>;
  generateDecision: (id: string, data: { disciplineType: string; decisionContent: string }) => Promise<TrialRecord | null>;
  pushExecution: (id: string) => Promise<TrialRecord | null>;

  exportMonthlyReport: (params?: Record<string, string>) => Promise<Blob | null>;

  clearError: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  petitions: [],
  clues: [],
  cases: [],
  approvals: [],
  talks: [],
  trials: [],
  users: [],
  dashboardStats: null,
  loading: false,
  error: null,

  fetchPetitions: async (params?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const response = await petitionApi.list(params);
      if (response.success && response.data) {
        set({ petitions: response.data });
      } else {
        set({ error: response.error || '获取信访举报列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchClues: async (params?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const response = await clueApi.list(params);
      if (response.success && response.data) {
        set({ clues: response.data });
      } else {
        set({ error: response.error || '获取线索列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCases: async (params?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const response = await caseApi.list(params);
      if (response.success && response.data) {
        set({ cases: response.data });
      } else {
        set({ error: response.error || '获取案件列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchApprovals: async (params?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const response = await approvalApi.list(params);
      if (response.success && response.data) {
        set({ approvals: response.data });
      } else {
        set({ error: response.error || '获取审批列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTalks: async (params?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const response = await talkApi.list(params);
      if (response.success && response.data) {
        set({ talks: response.data });
      } else {
        set({ error: response.error || '获取谈话列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTrials: async (params?: Record<string, string>) => {
    set({ loading: true, error: null });
    try {
      const response = await trialApi.list(params);
      if (response.success && response.data) {
        set({ trials: response.data });
      } else {
        set({ error: response.error || '获取审理列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchUsers: async () => {
    try {
      const response = await authApi.getUsers();
      if (response.success && response.data) {
        set({ users: response.data });
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  },

  fetchDashboardStats: async (params?: Record<string, string>) => {
    try {
      const response = await statsApi.getDashboard(params);
      if (response.success && response.data) {
        set({ dashboardStats: response.data });
      }
    } catch (error) {
      console.error('Fetch dashboard stats error:', error);
    }
  },

  createPetition: async (data: Partial<Petition>) => {
    try {
      const response = await petitionApi.create(data);
      if (response.success && response.data) {
        set(state => ({ petitions: [response.data!, ...state.petitions] }));
        return response.data;
      } else {
        set({ error: response.error || '创建失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  updatePetition: async (id: string, data: Partial<Petition>) => {
    try {
      const response = await petitionApi.update(id, data);
      if (response.success && response.data) {
        set(state => ({
          petitions: state.petitions.map(p =>
            p.id === id ? response.data! : p
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  createClue: async (data: Partial<Clue>) => {
    try {
      const response = await clueApi.create(data);
      if (response.success && response.data) {
        set(state => ({ clues: [response.data!, ...state.clues] }));
        return response.data;
      } else {
        set({ error: response.error || '创建失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  updateClue: async (id: string, data: Partial<Clue>) => {
    try {
      const response = await clueApi.update(id, data);
      if (response.success && response.data) {
        set(state => ({
          clues: state.clues.map(c =>
            c.id === id ? response.data! : c
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  startClue: async (id: string) => {
    try {
      const response = await clueApi.start(id);
      if (response.success && response.data) {
        set(state => ({
          clues: state.clues.map(c =>
            c.id === id ? response.data! : c
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '操作失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  createCase: async (data: Partial<Case>) => {
    try {
      const response = await caseApi.create(data);
      if (response.success && response.data) {
        set(state => ({ cases: [response.data!, ...state.cases] }));
        return response.data;
      } else {
        set({ error: response.error || '创建失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  approveApproval: async (id: string, data: { opinion: string; signature: string }) => {
    try {
      const response = await approvalApi.approve(id, data);
      if (response.success && response.data) {
        set(state => ({
          approvals: state.approvals.map(a =>
            a.id === id ? response.data! : a
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '审批失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  rejectApproval: async (id: string, data: { opinion: string; signature: string }) => {
    try {
      const response = await approvalApi.reject(id, data);
      if (response.success && response.data) {
        set(state => ({
          approvals: state.approvals.map(a =>
            a.id === id ? response.data! : a
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '操作失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  createTalk: async (data: Partial<TalkRecord>) => {
    try {
      const response = await talkApi.create(data);
      if (response.success && response.data) {
        set(state => ({ talks: [response.data!, ...state.talks] }));
        return response.data;
      } else {
        set({ error: response.error || '创建失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  updateTalk: async (id: string, data: Partial<TalkRecord>) => {
    try {
      const response = await talkApi.update(id, data);
      if (response.success && response.data) {
        set(state => ({
          talks: state.talks.map(t =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  createTrial: async (caseId: string, opinion: string) => {
    try {
      const response = await trialApi.review(caseId, { opinion });
      if (response.success && response.data) {
        set(state => ({ trials: [response.data!, ...state.trials] }));
        return response.data;
      } else {
        set({ error: response.error || '审理失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  signTrial: async (id: string, signature: string) => {
    try {
      const response = await trialApi.sign(id, { signature });
      if (response.success && response.data) {
        set(state => ({
          trials: state.trials.map(t =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '签名失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await statsApi.getDashboard();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return null;
    }
  },

  completeTrial: async (id: string, data: { reviewOpinion: string }) => {
    try {
      const response = await trialApi.review(id, data);
      if (response.success && response.data) {
        set(state => ({
          trials: state.trials.map(t =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '审理失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  generateDecision: async (id: string, data: { disciplineType: string; decisionContent: string }) => {
    try {
      const response = await trialApi.generateDecision(id, data);
      if (response.success && response.data) {
        set(state => ({
          trials: state.trials.map(t =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '生成决定书失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  pushExecution: async (id: string) => {
    try {
      const response = await trialApi.pushExecution(id);
      if (response.success && response.data) {
        set(state => ({
          trials: state.trials.map(t =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      } else {
        set({ error: response.error || '推送执行失败' });
        return null;
      }
    } catch (error) {
      set({ error: '网络错误' });
      return null;
    }
  },

  exportMonthlyReport: async (params?: Record<string, string>) => {
    try {
      const response = await statsApi.exportMonthly(params);
      if (response) {
        return response as Blob;
      }
      return null;
    } catch (error) {
      set({ error: '导出失败' });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
