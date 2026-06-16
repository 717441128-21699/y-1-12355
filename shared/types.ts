export type UserRole = 'handler' | 'dept_head' | 'case_office' | 'leader';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type PetitionType = 'corruption' | 'dereliction' | 'malfeasance' | 'style' | 'other';
export type PetitionStatus = 'pending' | 'processing' | 'assigned' | 'converted' | 'closed';

export interface Petition {
  id: string;
  title: string;
  content: string;
  informant?: string;
  informantContact?: string;
  type: PetitionType;
  status: PetitionStatus;
  involvedPerson: string;
  involvedDepartment: string;
  amount?: number;
  createdAt: string;
  assignedTo?: string;
  assignedDepartment: string;
  relatedClueId?: string;
}

export type ViolationType = 'political' | 'economic' | 'work' | 'life' | 'other';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ClueStatus = 'pending' | 'reviewing' | 'investigating' | 'filed' | 'closed' | 'verified';

export interface Clue {
  id: string;
  petitionId?: string;
  title: string;
  description: string;
  violationType: ViolationType;
  amount?: number;
  riskLevel: RiskLevel;
  status: ClueStatus;
  involvedPerson: string;
  involvedDepartment: string;
  createdAt: string;
  deadline?: string;
  isOverdue: boolean;
  escalated: boolean;
  assignedTo?: string;
  relatedCaseId?: string;
}

export type CaseStatus = 'pending_approval' | 'approved' | 'investigating' | 'trial' | 'closed' | 'pending_trial' | 'trialing' | 'pending_decision' | 'pending_execution' | 'executed' | 'archived';
export type CaseStage = 'petition' | 'clue' | 'approval' | 'investigation' | 'trial' | 'execution' | 'archived' | 'closed';

export interface Case {
  id: string;
  clueId?: string;
  caseNumber: string;
  title: string;
  description: string;
  violationType: ViolationType;
  status: CaseStatus;
  involvedPerson: string;
  involvedDepartment: string;
  amount?: number;
  createdAt: string;
  assignedTo: string;
  handlerId: string;
  department: string;
  currentStage: CaseStage;
  approvalHistory: ApprovalRecord[];
  talkRecords: TalkRecord[];
  trialRecord?: TrialRecord;
  deadline?: string;
  isOverdue?: boolean;
}

export type ApprovalStage = 'department' | 'case_office' | 'leader';

export interface ApprovalRecord {
  id: string;
  caseId: string;
  stage: ApprovalStage;
  approver: string;
  approverRole: string;
  opinion: string;
  result: 'approved' | 'rejected' | 'escalated';
  signature?: string;
  createdAt: string;
  deadline: string;
  isOverdue: boolean;
}

export type TalkStatus = 'scheduled' | 'in_progress' | 'completed' | 'pending';
export type TalkType = 'reminder' | 'interrogation' | 'inquiry';
export type RecordingType = 'video' | 'audio';

export interface TalkRecord {
  id: string;
  caseId: string;
  title: string;
  type: TalkType;
  interviewee: string;
  interviewer?: string;
  scheduledTime?: string;
  actualTime?: string;
  startTime: string;
  endTime?: string;
  location: string;
  recorder: string;
  content: string;
  transcript?: string;
  audioUrl?: string;
  videoUrl?: string;
  recordingUrl?: string;
  recordingType?: RecordingType;
  status: TalkStatus;
  isOverdue: boolean;
  reminderSent: boolean;
}

export type DisciplineType = 'warning' | 'serious_warning' | 'demerit' | 'demotion' | 'expulsion';

export interface TrialRecord {
  id: string;
  caseId: string;
  reviewer: string;
  opinion: string;
  reviewOpinion?: string;
  decisionDocument: string;
  decisionContent?: string;
  disciplineType?: DisciplineType;
  signature?: string;
  signedAt?: string;
  createdAt: string;
  executionPushed?: boolean;
  executionPushedAt?: string;
}

export interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  completedCases: number;
  overdueCases: number;
  closingRate: number;
  distributionEfficiency: number;
  casesByType: Record<ViolationType, number>;
  casesByDepartment: Record<string, number>;
  trendData: { date: string; count: number }[];
  overdueClues: number;
  pendingApprovals: number;
  pendingTalks: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const PETITION_TYPE_LABELS: Record<PetitionType, string> = {
  corruption: '贪污贿赂',
  dereliction: '失职渎职',
  malfeasance: '滥用职权',
  style: '作风问题',
  other: '其他问题',
};

export const PETITION_STATUS_LABELS: Record<PetitionStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  assigned: '已分配',
  converted: '已转线索',
  closed: '已办结',
};

export const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  political: '政治纪律',
  economic: '经济问题',
  work: '工作纪律',
  life: '生活作风',
  other: '其他问题',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export const CLUE_STATUS_LABELS: Record<ClueStatus, string> = {
  pending: '待研判',
  reviewing: '研判中',
  investigating: '调查中',
  filed: '已立案',
  closed: '已办结',
  verified: '已核实',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  pending_approval: '待审批',
  approved: '已批准',
  investigating: '审查中',
  trial: '审理中',
  closed: '已结案',
  pending_trial: '待审理',
  trialing: '审理中',
  pending_decision: '待决定',
  pending_execution: '待执行',
  executed: '已执行',
  archived: '已归档',
};

export const CASE_STAGE_LABELS: Record<CaseStage, string> = {
  petition: '信访举报',
  clue: '线索研判',
  approval: '立案审批',
  investigation: '案件审查',
  trial: '审理结案',
  execution: '处分执行',
  archived: '已归档',
  closed: '已结案',
};

export const APPROVAL_STAGE_LABELS: Record<ApprovalStage, string> = {
  department: '承办部门',
  case_office: '案管室',
  leader: '分管领导',
};

export const TALK_STATUS_LABELS: Record<TalkStatus, string> = {
  scheduled: '已安排',
  in_progress: '进行中',
  completed: '已完成',
  pending: '待谈话',
};

export const TALK_TYPE_LABELS: Record<TalkType, string> = {
  reminder: '谈话提醒',
  interrogation: '讯问',
  inquiry: '询问',
};

export const DISCIPLINE_TYPE_LABELS: Record<DisciplineType, string> = {
  warning: '警告',
  serious_warning: '严重警告',
  demerit: '记过',
  demotion: '降级',
  expulsion: '开除党籍',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  handler: '承办人',
  dept_head: '部门负责人',
  case_office: '案管室',
  leader: '分管领导',
};

export const DEPARTMENTS = [
  '第一纪检监察室',
  '第二纪检监察室',
  '第三纪检监察室',
  '案件监督管理室',
  '案件审理室',
  '信访室',
  '党风政风监督室',
];

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  converted: 'bg-indigo-100 text-indigo-800',
  closed: 'bg-green-100 text-green-800',
  pending_approval: 'bg-orange-100 text-orange-800',
  approved: 'bg-blue-100 text-blue-800',
  investigating: 'bg-navy-100 text-navy-800',
  trial: 'bg-purple-100 text-purple-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};
