import type {
  User,
  Petition,
  Clue,
  Case,
  ApprovalRecord,
  TalkRecord,
  TrialRecord,
  UserRole,
} from '../shared/types.js';
import {
  mockUsers,
  mockPetitions,
  mockClues,
  mockCases,
  mockApprovals,
  mockTalks,
  mockTrials,
  generateId,
} from '../shared/mockData.js';
import { PETITION_TYPE_TO_DEPARTMENT } from '../shared/types.js';

let memoryStorage: Record<string, string> = {};

const storage = {
  getItem: (key: string): string | null => {
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string): void => {
    memoryStorage[key] = value;
  },
};

class DataStore {
  private users: User[] = [...mockUsers];
  private petitions: Petition[] = [...mockPetitions];
  private clues: Clue[] = [...mockClues];
  private cases: Case[] = [...mockCases];
  private approvals: ApprovalRecord[] = [...mockApprovals];
  private talks: TalkRecord[] = [...mockTalks];
  private trials: TrialRecord[] = [...mockTrials];

  constructor() {
    this.loadFromStorage();
    this.startAutoCheck();
  }

  private loadFromStorage() {
    try {
      const stored = storage.getItem('jjjc_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.users = data.users || this.users;
        this.petitions = data.petitions || this.petitions;
        this.clues = data.clues || this.clues;
        this.cases = data.cases || this.cases;
        this.approvals = data.approvals || this.approvals;
        this.talks = data.talks || this.talks;
        this.trials = data.trials || this.trials;
      }
    } catch (e) {
      console.log('No stored data found, using defaults');
    }
  }

  private saveToStorage() {
    try {
      const data = {
        users: this.users,
        petitions: this.petitions,
        clues: this.clues,
        cases: this.cases,
        approvals: this.approvals,
        talks: this.talks,
        trials: this.trials,
      };
      storage.setItem('jjjc_data', JSON.stringify(data));
    } catch (e) {
      // Silent fail for memory storage
    }
  }

  private startAutoCheck() {
    setInterval(() => {
      this.checkOverdue();
      this.saveToStorage();
    }, 5000);
  }

  calculateRiskLevel(violationType: string, amount?: number): 'low' | 'medium' | 'high' {
    const highAmount = 1000000;
    const mediumAmount = 100000;

    if (violationType === 'political' || violationType === 'economic') {
      if (amount && amount >= highAmount) return 'high';
      if (amount && amount >= mediumAmount) return 'medium';
      return 'medium';
    }
    
    if (amount && amount >= highAmount) return 'high';
    if (amount && amount >= mediumAmount) return 'medium';
    return 'low';
  }

  private checkOverdue() {
    const now = new Date();

    this.clues.forEach(clue => {
      if (clue.deadline && !clue.isOverdue && clue.status === 'pending') {
        const deadline = new Date(clue.deadline);
        if (now > deadline) {
          clue.isOverdue = true;
          if (clue.riskLevel === 'high' && !clue.escalated) {
            clue.escalated = true;
          }
        }
      }
    });

    this.approvals.forEach(approval => {
      if (!approval.isOverdue && approval.result !== 'approved' && approval.result !== 'rejected') {
        const deadline = new Date(approval.deadline);
        if (now > deadline) {
          approval.isOverdue = true;
          approval.result = 'escalated';
          this.autoEscalateApproval(approval);
        }
      }
    });

    this.talks.forEach(talk => {
      if (!talk.isOverdue && talk.status !== 'completed') {
        const startTime = new Date(talk.startTime);
        const diffHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (diffHours > 48) {
          talk.isOverdue = true;
        }
      }
    });
  }

  private autoEscalateApproval(approval: ApprovalRecord) {
    const caseItem = this.cases.find(c => c.id === approval.caseId);
    if (!caseItem) return;

    const stages: ApprovalRecord['stage'][] = ['department', 'case_office', 'leader'];
    const currentIndex = stages.indexOf(approval.stage);

    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      const existingApproval = this.approvals.find(
        a => a.caseId === approval.caseId && a.stage === nextStage
      );

      if (!existingApproval) {
        const newApproval: ApprovalRecord = {
          id: generateId(),
          caseId: approval.caseId,
          stage: nextStage,
          approver: '',
          approverRole: nextStage === 'case_office' ? 'case_office' : 'leader',
          opinion: '',
          result: 'escalated',
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isOverdue: false,
        };
        this.approvals.push(newApproval);
        caseItem.approvalHistory.push(newApproval);
      }
    } else {
      caseItem.status = 'approved';
      caseItem.currentStage = 'investigation';
    }
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByRole(role: UserRole): User | undefined {
    return this.users.find(u => u.role === role);
  }

  login(username: string, password: string): User | null {
    const user = this.users.find(u => u.name === username);
    if (user && password === '123456') {
      return user;
    }
    return null;
  }

  updatePassword(userId: string, oldPassword: string, newPassword: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user || oldPassword !== '123456') {
      return false;
    }
    return true;
  }

  getPetitions(filters?: { status?: string; type?: string; department?: string; userId?: string; role?: UserRole }): Petition[] {
    let result = [...this.petitions];
    
    if (filters) {
      if (filters.status) result = result.filter(p => p.status === filters.status);
      if (filters.type) result = result.filter(p => p.type === filters.type);
      if (filters.department) result = result.filter(p => p.assignedDepartment === filters.department);
      if (filters.role === 'handler' && filters.userId) {
        result = result.filter(p => p.assignedTo === filters.userId);
      } else if (filters.role === 'dept_head') {
        const user = this.getUserById(filters.userId!);
        if (user) {
          result = result.filter(p => p.assignedDepartment === user.department);
        }
      }
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPetitionById(id: string): Petition | undefined {
    return this.petitions.find(p => p.id === id);
  }

  createPetition(data: Omit<Petition, 'id' | 'createdAt' | 'status' | 'assignedDepartment'>): Petition {
    const assignedDepartment = PETITION_TYPE_TO_DEPARTMENT[data.type] || '信访室';
    const petition: Petition = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'processing',
      assignedDepartment,
    };
    this.petitions.push(petition);
    this.saveToStorage();
    return petition;
  }

  convertPetitionToClue(petitionId: string): Clue | undefined {
    const petition = this.getPetitionById(petitionId);
    if (!petition) return undefined;

    const violationTypeMap: Record<string, string> = {
      corruption: 'economic',
      dereliction: 'work',
      malfeasance: 'work',
      style: 'life',
      other: 'other',
    };

    const violationType = violationTypeMap[petition.type] || 'other';
    const riskLevel = this.calculateRiskLevel(violationType, petition.amount);

    const clue = this.createClue({
      title: petition.title,
      description: petition.content,
      violationType: violationType as any,
      involvedPerson: petition.involvedPerson,
      involvedDepartment: petition.involvedDepartment,
      amount: petition.amount,
      petitionId: petition.id,
      riskLevel,
      assignedTo: petition.assignedTo,
    });

    this.updatePetition(petitionId, {
      status: 'converted',
      relatedClueId: clue.id,
    });

    return clue;
  }

  updatePetition(id: string, data: Partial<Petition>): Petition | undefined {
    const index = this.petitions.findIndex(p => p.id === id);
    if (index !== -1) {
      this.petitions[index] = { ...this.petitions[index], ...data };
      this.saveToStorage();
      return this.petitions[index];
    }
    return undefined;
  }

  getClues(filters?: { status?: string; riskLevel?: string; department?: string; userId?: string; role?: UserRole }): Clue[] {
    let result = [...this.clues];
    
    if (filters) {
      if (filters.status) result = result.filter(c => c.status === filters.status);
      if (filters.riskLevel) result = result.filter(c => c.riskLevel === filters.riskLevel);
      if (filters.department) result = result.filter(c => c.involvedDepartment === filters.department);
      if (filters.role === 'handler' && filters.userId) {
        result = result.filter(c => c.assignedTo === filters.userId);
      } else if (filters.role === 'dept_head') {
        const user = this.getUserById(filters.userId!);
        if (user) {
          result = result.filter(c => c.assignedTo && this.getUserById(c.assignedTo)?.department === user.department);
        }
      }
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getClueById(id: string): Clue | undefined {
    return this.clues.find(c => c.id === id);
  }

  createClue(data: Omit<Clue, 'id' | 'createdAt' | 'isOverdue' | 'escalated' | 'status'>): Clue {
    const riskLevel = data.riskLevel || this.calculateRiskLevel(data.violationType, data.amount);
    const clue: Clue = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      isOverdue: false,
      escalated: false,
      riskLevel,
      deadline: riskLevel === 'high' 
        ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() 
        : undefined,
    };
    this.clues.push(clue);
    this.saveToStorage();
    return clue;
  }

  updateClue(id: string, data: Partial<Clue>): Clue | undefined {
    const index = this.clues.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clues[index] = { ...this.clues[index], ...data };
      this.saveToStorage();
      return this.clues[index];
    }
    return undefined;
  }

  startClueInvestigation(id: string): Clue | undefined {
    const clue = this.clues.find(c => c.id === id);
    if (clue && clue.status === 'pending') {
      clue.status = 'investigating';
      clue.deadline = undefined;
      this.saveToStorage();
      return clue;
    }
    return undefined;
  }

  getCases(filters?: { status?: string; stage?: string; violationType?: string; department?: string; userId?: string; role?: UserRole }): Case[] {
    let result = [...this.cases];
    
    if (filters) {
      if (filters.status) result = result.filter(c => c.status === filters.status);
      if (filters.stage) result = result.filter(c => c.currentStage === filters.stage);
      if (filters.violationType) result = result.filter(c => c.violationType === filters.violationType);
      if (filters.department) result = result.filter(c => c.involvedDepartment === filters.department);
      if (filters.role === 'handler' && filters.userId) {
        result = result.filter(c => c.assignedTo === filters.userId);
      } else if (filters.role === 'dept_head') {
        const user = this.getUserById(filters.userId!);
        if (user) {
          result = result.filter(c => this.getUserById(c.assignedTo)?.department === user.department);
        }
      }
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getCaseById(id: string): Case | undefined {
    return this.cases.find(c => c.id === id);
  }

  createCase(data: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'status' | 'currentStage' | 'approvalHistory' | 'talkRecords'>): Case {
    const caseNumber = `JJ-${new Date().getFullYear()}-${String(this.cases.length + 1).padStart(3, '0')}`;
    
    const firstApproval: ApprovalRecord = {
      id: generateId(),
      caseId: '',
      stage: 'department',
      approver: '',
      approverRole: 'dept_head',
      opinion: '',
      result: 'escalated',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
    };

    const caseItem: Case = {
      ...data,
      id: generateId(),
      caseNumber,
      createdAt: new Date().toISOString(),
      status: 'pending_approval',
      currentStage: 'approval',
      approvalHistory: [firstApproval],
      talkRecords: [],
    };

    firstApproval.caseId = caseItem.id;
    this.approvals.push(firstApproval);
    this.cases.push(caseItem);
    this.saveToStorage();
    return caseItem;
  }

  updateCase(id: string, data: Partial<Case>): Case | undefined {
    const index = this.cases.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cases[index] = { ...this.cases[index], ...data };
      this.saveToStorage();
      return this.cases[index];
    }
    return undefined;
  }

  getApprovals(filters?: { caseId?: string; stage?: string; userId?: string; role?: UserRole }): ApprovalRecord[] {
    let result = [...this.approvals];
    
    if (filters) {
      if (filters.caseId) result = result.filter(a => a.caseId === filters.caseId);
      if (filters.stage) result = result.filter(a => a.stage === filters.stage);
      if (filters.role) {
        result = result.filter(a => {
          if (filters.role === 'dept_head') return a.stage === 'department';
          if (filters.role === 'case_office') return a.stage === 'case_office';
          if (filters.role === 'leader') return a.stage === 'leader';
          return false;
        });
        result = result.filter(a => a.result !== 'approved' && a.result !== 'rejected');
      }
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  approveApproval(id: string, data: { opinion: string; signature: string; approver: string; approverRole: string }): ApprovalRecord | undefined {
    const approval = this.approvals.find(a => a.id === id);
    if (approval) {
      approval.opinion = data.opinion;
      approval.signature = data.signature;
      approval.approver = data.approver;
      approval.approverRole = data.approverRole;
      approval.result = 'approved';
      approval.createdAt = new Date().toISOString();

      const caseItem = this.cases.find(c => c.id === approval.caseId);
      if (caseItem) {
        const stages: ApprovalRecord['stage'][] = ['department', 'case_office', 'leader'];
        const currentIndex = stages.indexOf(approval.stage);

        if (currentIndex < stages.length - 1) {
          const nextStage = stages[currentIndex + 1];
          const newApproval: ApprovalRecord = {
            id: generateId(),
            caseId: caseItem.id,
            stage: nextStage,
            approver: '',
            approverRole: nextStage === 'case_office' ? 'case_office' : 'leader',
            opinion: '',
            result: 'escalated',
            createdAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isOverdue: false,
          };
          this.approvals.push(newApproval);
          caseItem.approvalHistory.push(newApproval);
        } else {
          caseItem.status = 'approved';
          caseItem.currentStage = 'investigation';
        }
      }

      this.saveToStorage();
      return approval;
    }
    return undefined;
  }

  rejectApproval(id: string, data: { opinion: string; signature: string; approver: string; approverRole: string }): ApprovalRecord | undefined {
    const approval = this.approvals.find(a => a.id === id);
    if (approval) {
      approval.opinion = data.opinion;
      approval.signature = data.signature;
      approval.approver = data.approver;
      approval.approverRole = data.approverRole;
      approval.result = 'rejected';
      approval.createdAt = new Date().toISOString();

      const caseItem = this.cases.find(c => c.id === approval.caseId);
      if (caseItem) {
        caseItem.status = 'closed';
        caseItem.currentStage = 'archived';
      }

      this.saveToStorage();
      return approval;
    }
    return undefined;
  }

  getTalks(filters?: { caseId?: string; status?: string; userId?: string; role?: UserRole }): TalkRecord[] {
    let result = [...this.talks];
    
    if (filters) {
      if (filters.caseId) result = result.filter(t => t.caseId === filters.caseId);
      if (filters.status) result = result.filter(t => t.status === filters.status);
      if (filters.role === 'handler' && filters.userId) {
        result = result.filter(t => t.recorder === filters.userId);
      }
    }
    
    return result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getTalkById(id: string): TalkRecord | undefined {
    return this.talks.find(t => t.id === id);
  }

  createTalk(data: Omit<TalkRecord, 'id' | 'status' | 'isOverdue' | 'reminderSent'>): TalkRecord {
    const talk: TalkRecord = {
      ...data,
      id: generateId(),
      status: 'scheduled',
      isOverdue: false,
      reminderSent: false,
    };
    this.talks.push(talk);
    
    const caseItem = this.cases.find(c => c.id === data.caseId);
    if (caseItem) {
      caseItem.talkRecords.push(talk);
    }
    
    this.saveToStorage();
    return talk;
  }

  updateTalk(id: string, data: Partial<TalkRecord>): TalkRecord | undefined {
    const index = this.talks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.talks[index] = { ...this.talks[index], ...data };
      
      const talk = this.talks[index];
      const caseItem = this.cases.find(c => c.id === talk.caseId);
      if (caseItem) {
        const talkIndex = caseItem.talkRecords.findIndex(t => t.id === id);
        if (talkIndex !== -1) {
          caseItem.talkRecords[talkIndex] = talk;
        }
      }
      
      this.saveToStorage();
      return this.talks[index];
    }
    return undefined;
  }

  getTrials(filters?: { caseId?: string; reviewer?: string; userId?: string; role?: UserRole }): TrialRecord[] {
    let result = [...this.trials];
    
    if (filters) {
      if (filters.caseId) result = result.filter(t => t.caseId === filters.caseId);
      if (filters.reviewer) result = result.filter(t => t.reviewer === filters.reviewer);
      if (filters.role === 'handler' && filters.userId) {
        result = result.filter(t => {
          const caseItem = this.cases.find(c => c.id === t.caseId);
          return caseItem?.assignedTo === filters.userId;
        });
      } else if (filters.role === 'dept_head' && filters.userId) {
        const user = this.getUserById(filters.userId);
        if (user) {
          result = result.filter(t => {
            const caseItem = this.cases.find(c => c.id === t.caseId);
            const handler = caseItem?.assignedTo && this.getUserById(caseItem.assignedTo);
            return handler?.department === user.department;
          });
        }
      }
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createTrial(data: Omit<TrialRecord, 'id' | 'createdAt'>): TrialRecord {
    const trial: TrialRecord = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.trials.push(trial);
    
    const caseItem = this.cases.find(c => c.id === data.caseId);
    if (caseItem) {
      caseItem.trialRecord = trial;
      caseItem.status = 'trialing';
      caseItem.currentStage = 'trial';
    }
    
    this.saveToStorage();
    return trial;
  }

  updateTrial(id: string, data: Partial<TrialRecord>): TrialRecord | undefined {
    const index = this.trials.findIndex(t => t.id === id);
    if (index !== -1) {
      this.trials[index] = { ...this.trials[index], ...data };
      
      const trial = this.trials[index];
      const caseItem = this.cases.find(c => c.id === trial.caseId);
      if (caseItem) {
        caseItem.trialRecord = trial;
      }
      
      this.saveToStorage();
      return this.trials[index];
    }
    return undefined;
  }

  resetData() {
    this.users = [...mockUsers];
    this.petitions = [...mockPetitions];
    this.clues = [...mockClues];
    this.cases = [...mockCases];
    this.approvals = [...mockApprovals];
    this.talks = [...mockTalks];
    this.trials = [...mockTrials];
    this.saveToStorage();
  }
}

export const dataStore = new DataStore();
export default DataStore;
