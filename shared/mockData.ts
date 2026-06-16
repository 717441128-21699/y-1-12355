import type { User, Petition, Clue, Case, ApprovalRecord, TalkRecord, TrialRecord, DashboardStats } from './types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const formatDate = (date: Date) => date.toISOString();

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
};

const hoursAgo = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return formatDate(date);
};

const hoursLater = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return formatDate(date);
};

export const mockUsers: User[] = [
  { id: 'u1', name: '张伟', role: 'handler', department: '第一纪检监察室' },
  { id: 'u2', name: '李娜', role: 'handler', department: '第一纪检监察室' },
  { id: 'u3', name: '王强', role: 'dept_head', department: '第一纪检监察室' },
  { id: 'u4', name: '刘芳', role: 'handler', department: '第二纪检监察室' },
  { id: 'u5', name: '陈明', role: 'dept_head', department: '第二纪检监察室' },
  { id: 'u6', name: '赵丽', role: 'case_office', department: '案件监督管理室' },
  { id: 'u7', name: '孙涛', role: 'case_office', department: '案件审理室' },
  { id: 'u8', name: '周建国', role: 'leader', department: '纪委监委' },
];

export const mockPetitions: Petition[] = [
  {
    id: 'p1',
    title: '关于某单位领导违规收受礼品礼金的举报',
    content: '举报人反映某单位主要负责人在春节期间收受管理服务对象赠送的高档烟酒、购物卡等，价值约5万元。',
    informant: '匿名',
    type: 'corruption',
    status: 'assigned',
    involvedPerson: '吴某',
    involvedDepartment: '发改委',
    amount: 50000,
    createdAt: daysAgo(3),
    assignedDepartment: '第一纪检监察室',
    assignedTo: 'u1',
  },
  {
    id: 'p2',
    title: '某工程项目存在暗箱操作问题',
    content: '某市政工程项目招标过程中，存在内定中标单位、泄露招标信息等问题，涉及金额约2000万元。',
    informant: '知情人士',
    informantContact: '138****5678',
    type: 'malfeasance',
    status: 'processing',
    involvedPerson: '郑某',
    involvedDepartment: '住建局',
    amount: 20000000,
    createdAt: daysAgo(5),
    assignedDepartment: '第二纪检监察室',
    assignedTo: 'u4',
  },
  {
    id: 'p3',
    title: '反映某干部作风散漫、不作为',
    content: '某街道办事处工作人员上班时间迟到早退、玩游戏，对待群众态度恶劣，多次被投诉。',
    informant: '群众代表',
    type: 'style',
    status: 'converted',
    involvedPerson: '王某',
    involvedDepartment: '街道办事处',
    createdAt: daysAgo(7),
    assignedDepartment: '党风政风监督室',
    relatedClueId: 'c1',
  },
  {
    id: 'p4',
    title: '某国企领导失职渎职造成国有资产流失',
    content: '某国有企业负责人在对外投资决策中严重失职，造成国有资产损失约500万元。',
    informant: '企业职工',
    type: 'dereliction',
    status: 'pending',
    involvedPerson: '李某',
    involvedDepartment: '某国企',
    amount: 5000000,
    createdAt: daysAgo(2),
    assignedDepartment: '第三纪检监察室',
  },
  {
    id: 'p5',
    title: '关于违规发放津补贴的举报',
    content: '某单位违反中央八项规定精神，以各种名义违规发放津补贴、奖金，涉及金额约100万元。',
    informant: '单位职工',
    type: 'style',
    status: 'closed',
    involvedPerson: '张某',
    involvedDepartment: '某局',
    amount: 1000000,
    createdAt: daysAgo(30),
    assignedDepartment: '党风政风监督室',
  },
  {
    id: 'p6',
    title: '反映某领导利用职权为亲属谋利',
    content: '某部门领导利用职务便利，为其亲属经营的企业承揽工程项目，谋取不正当利益。',
    informant: '匿名',
    type: 'corruption',
    status: 'assigned',
    involvedPerson: '赵某',
    involvedDepartment: '财政局',
    createdAt: daysAgo(1),
    assignedDepartment: '第一纪检监察室',
    assignedTo: 'u2',
  },
  {
    id: 'p7',
    title: '某单位公车私用问题严重',
    content: '某单位长期存在公车私用现象，领导干部上下班、办理私事都使用单位公车。',
    informant: '群众',
    type: 'style',
    status: 'processing',
    involvedPerson: '孙某',
    involvedDepartment: '交通局',
    createdAt: daysAgo(4),
    assignedDepartment: '党风政风监督室',
  },
  {
    id: 'p8',
    title: '反映某干部大操大办婚丧喜庆事宜',
    content: '某单位领导为其子举办婚礼，大操大办，宴请管理服务对象，收受礼金。',
    informant: '匿名',
    type: 'style',
    status: 'pending',
    involvedPerson: '周某',
    involvedDepartment: '教育局',
    amount: 200000,
    createdAt: hoursAgo(12),
    assignedDepartment: '党风政风监督室',
  },
];

export const mockClues: Clue[] = [
  {
    id: 'c1',
    petitionId: 'p3',
    title: '王某作风问题线索',
    description: '王某作为街道办事处工作人员，存在作风散漫、不作为等问题，需进一步核实。',
    violationType: 'work',
    riskLevel: 'low',
    status: 'investigating',
    involvedPerson: '王某',
    involvedDepartment: '街道办事处',
    createdAt: daysAgo(6),
    deadline: hoursLater(24),
    isOverdue: false,
    escalated: false,
    assignedTo: 'u1',
  },
  {
    id: 'c2',
    title: '吴某涉嫌受贿线索',
    description: '吴某在任职期间，利用职务便利为他人谋取利益，收受他人财物，数额较大。',
    violationType: 'economic',
    amount: 500000,
    riskLevel: 'high',
    status: 'reviewing',
    involvedPerson: '吴某',
    involvedDepartment: '发改委',
    createdAt: daysAgo(10),
    deadline: hoursLater(12),
    isOverdue: false,
    escalated: false,
    assignedTo: 'u1',
  },
  {
    id: 'c3',
    title: '郑某工程招标舞弊线索',
    description: '郑某在市政工程项目招标过程中，涉嫌泄露招标信息、暗箱操作，涉及金额巨大。',
    violationType: 'economic',
    amount: 20000000,
    riskLevel: 'high',
    status: 'pending',
    involvedPerson: '郑某',
    involvedDepartment: '住建局',
    createdAt: hoursAgo(36),
    deadline: hoursLater(-12),
    isOverdue: true,
    escalated: true,
    assignedTo: 'u4',
  },
  {
    id: 'c4',
    title: '李某失职渎职线索',
    description: '李某在国企任职期间，投资决策严重失误，造成国有资产重大损失。',
    violationType: 'work',
    amount: 5000000,
    riskLevel: 'high',
    status: 'filed',
    involvedPerson: '李某',
    involvedDepartment: '某国企',
    createdAt: daysAgo(15),
    isOverdue: false,
    escalated: false,
    assignedTo: 'u4',
    relatedCaseId: 'case1',
  },
  {
    id: 'c5',
    title: '张某违规发放津补贴线索',
    description: '张某任某局局长期间，违反规定发放津补贴，已查实并处理完毕。',
    violationType: 'work',
    amount: 1000000,
    riskLevel: 'medium',
    status: 'closed',
    involvedPerson: '张某',
    involvedDepartment: '某局',
    createdAt: daysAgo(45),
    isOverdue: false,
    escalated: false,
  },
  {
    id: 'c6',
    title: '赵某利用职权谋私线索',
    description: '赵某利用职务便利，为其亲属经营活动提供帮助，谋取不正当利益。',
    violationType: 'economic',
    riskLevel: 'medium',
    status: 'reviewing',
    involvedPerson: '赵某',
    involvedDepartment: '财政局',
    createdAt: daysAgo(5),
    deadline: hoursLater(36),
    isOverdue: false,
    escalated: false,
    assignedTo: 'u2',
  },
  {
    id: 'c7',
    title: '孙某公车私用线索',
    description: '孙某任交通局副局长期间，长期公车私用，违反中央八项规定精神。',
    violationType: 'life',
    riskLevel: 'low',
    status: 'investigating',
    involvedPerson: '孙某',
    involvedDepartment: '交通局',
    createdAt: daysAgo(3),
    deadline: hoursLater(60),
    isOverdue: false,
    escalated: false,
    assignedTo: 'u2',
  },
];

export const mockApprovals: ApprovalRecord[] = [
  {
    id: 'a1',
    caseId: 'case1',
    stage: 'department',
    approver: 'u3',
    approverRole: 'dept_head',
    opinion: '经初步核实，李某失职渎职问题线索清晰，建议立案审查。',
    result: 'approved',
    signature: '王强',
    createdAt: daysAgo(12),
    deadline: daysAgo(11),
    isOverdue: false,
  },
  {
    id: 'a2',
    caseId: 'case1',
    stage: 'case_office',
    approver: 'u6',
    approverRole: 'case_office',
    opinion: '同意立案，材料齐全，程序合规，请领导审批。',
    result: 'approved',
    signature: '赵丽',
    createdAt: daysAgo(11),
    deadline: daysAgo(10),
    isOverdue: false,
  },
  {
    id: 'a3',
    caseId: 'case1',
    stage: 'leader',
    approver: 'u8',
    approverRole: 'leader',
    opinion: '批准立案，由第一纪检监察室负责调查。',
    result: 'approved',
    signature: '周建国',
    createdAt: daysAgo(10),
    deadline: daysAgo(9),
    isOverdue: false,
  },
  {
    id: 'a4',
    caseId: 'case2',
    stage: 'department',
    approver: 'u5',
    approverRole: 'dept_head',
    opinion: '郑某涉嫌工程舞弊问题严重，建议立案审查。',
    result: 'escalated',
    createdAt: hoursAgo(26),
    deadline: hoursAgo(2),
    isOverdue: true,
  },
];

export const mockTalks: TalkRecord[] = [
  {
    id: 't1',
    caseId: 'case1',
    title: '与李某初次谈话',
    interviewee: '李某',
    startTime: daysAgo(8),
    endTime: daysAgo(8),
    location: '谈话室1号',
    recorder: 'u1',
    content: '已对李某进行初步谈话，其对投资决策失误的事实供认不讳，但对主观故意性予以否认。',
    audioUrl: '/mock/audio/t1.mp3',
    videoUrl: '/mock/video/t1.mp4',
    status: 'completed',
    isOverdue: false,
    reminderSent: true,
  },
  {
    id: 't2',
    caseId: 'case1',
    title: '与证人王某谈话',
    interviewee: '王某',
    startTime: daysAgo(5),
    endTime: daysAgo(5),
    location: '谈话室2号',
    recorder: 'u2',
    content: '证人王某证实了李某在投资决策过程中独断专行，未经过集体研究。',
    audioUrl: '/mock/audio/t2.mp3',
    videoUrl: '/mock/video/t2.mp4',
    status: 'completed',
    isOverdue: false,
    reminderSent: true,
  },
  {
    id: 't3',
    caseId: 'case1',
    title: '与李某第二次谈话',
    interviewee: '李某',
    startTime: hoursLater(24),
    location: '谈话室1号',
    recorder: 'u1',
    content: '',
    status: 'scheduled',
    isOverdue: false,
    reminderSent: false,
  },
  {
    id: 't4',
    caseId: 'case2',
    title: '与郑某初次谈话',
    interviewee: '郑某',
    startTime: hoursAgo(-48),
    location: '谈话室1号',
    recorder: 'u4',
    content: '',
    status: 'scheduled',
    isOverdue: true,
    reminderSent: true,
  },
];

export const mockTrials: TrialRecord[] = [
  {
    id: 'tr1',
    caseId: 'case3',
    reviewer: 'u7',
    opinion: '经审理，张某违规发放津补贴的事实清楚、证据确凿，根据《中国共产党纪律处分条例》相关规定，建议给予党内警告处分。',
    decisionDocument: '关于给予张某同志党内警告处分的决定',
    signature: '孙涛',
    createdAt: daysAgo(20),
  },
];

export const mockCases: Case[] = [
  {
    id: 'case1',
    clueId: 'c4',
    caseNumber: 'JJ-2024-001',
    title: '李某失职渎职案',
    description: '李某在担任某国有企业董事长期间，在对外投资项目决策中，严重不负责任，不履行或者不正确履行职责，造成国有资产损失约500万元。',
    violationType: 'work',
    status: 'investigating',
    involvedPerson: '李某',
    involvedDepartment: '某国企',
    amount: 5000000,
    createdAt: daysAgo(10),
    assignedTo: 'u1',
    currentStage: 'investigation',
    approvalHistory: mockApprovals.filter(a => a.caseId === 'case1'),
    talkRecords: mockTalks.filter(t => t.caseId === 'case1'),
  },
  {
    id: 'case2',
    clueId: 'c3',
    caseNumber: 'JJ-2024-002',
    title: '郑某工程舞弊案',
    description: '郑某在担任住建局副局长期间，利用负责市政工程项目招标的职务便利，泄露招标信息，帮助特定关系人中标，涉嫌受贿。',
    violationType: 'economic',
    status: 'pending_approval',
    involvedPerson: '郑某',
    involvedDepartment: '住建局',
    amount: 20000000,
    createdAt: daysAgo(1),
    assignedTo: 'u4',
    currentStage: 'approval',
    approvalHistory: mockApprovals.filter(a => a.caseId === 'case2'),
    talkRecords: mockTalks.filter(t => t.caseId === 'case2'),
  },
  {
    id: 'case3',
    caseNumber: 'JJ-2023-045',
    title: '张某违规发放津补贴案',
    description: '张某在担任某局局长期间，违反中央八项规定精神，以各种名义违规发放津补贴共计100万元。',
    violationType: 'work',
    status: 'closed',
    involvedPerson: '张某',
    involvedDepartment: '某局',
    amount: 1000000,
    createdAt: daysAgo(60),
    assignedTo: 'u2',
    currentStage: 'archived',
    approvalHistory: [],
    talkRecords: [],
    trialRecord: mockTrials[0],
  },
  {
    id: 'case4',
    clueId: 'c2',
    caseNumber: 'JJ-2024-003',
    title: '吴某受贿案',
    description: '吴某在担任发改委主任期间，利用项目审批职权，为他人谋取利益，收受他人贿赂。',
    violationType: 'economic',
    status: 'approved',
    involvedPerson: '吴某',
    involvedDepartment: '发改委',
    amount: 500000,
    createdAt: daysAgo(8),
    assignedTo: 'u1',
    currentStage: 'investigation',
    approvalHistory: [],
    talkRecords: [],
  },
  {
    id: 'case5',
    caseNumber: 'JJ-2024-004',
    title: '赵某利用职权谋私案',
    description: '赵某利用担任财政局副局长的职务便利，为其亲属经营的企业承揽工程项目，谋取不正当利益。',
    violationType: 'economic',
    status: 'trial',
    involvedPerson: '赵某',
    involvedDepartment: '财政局',
    createdAt: daysAgo(25),
    assignedTo: 'u2',
    currentStage: 'trial',
    approvalHistory: [],
    talkRecords: [],
  },
];

export const getDashboardStats = (): DashboardStats => {
  const totalCases = mockCases.length;
  const pendingCases = mockCases.filter(c => c.status !== 'closed').length;
  const completedCases = mockCases.filter(c => c.status === 'closed').length;
  const overdueCases = mockCases.filter(c => 
    c.approvalHistory.some(a => a.isOverdue) || 
    c.talkRecords.some(t => t.isOverdue)
  ).length;
  const closingRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;
  const distributionEfficiency = 85;

  const casesByType = mockCases.reduce((acc, c) => {
    acc[c.violationType] = (acc[c.violationType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const casesByDepartment = mockCases.reduce((acc, c) => {
    acc[c.involvedDepartment] = (acc[c.involvedDepartment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 8) + 2,
    };
  });

  const overdueClues = mockClues.filter(c => c.isOverdue).length;
  const pendingApprovals = mockCases.filter(c => c.status === 'pending_approval').length;
  const pendingTalks = mockTalks.filter(t => t.isOverdue).length;

  return {
    totalCases,
    pendingCases,
    completedCases,
    overdueCases,
    closingRate,
    distributionEfficiency,
    casesByType: {
      political: casesByType.political || 0,
      economic: casesByType.economic || 0,
      work: casesByType.work || 0,
      life: casesByType.life || 0,
      other: casesByType.other || 0,
    },
    casesByDepartment,
    trendData,
    overdueClues,
    pendingApprovals,
    pendingTalks,
  };
};

export const generateCaseNumber = () => {
  const year = new Date().getFullYear();
  const num = String(mockCases.length + 1).padStart(3, '0');
  return `JJ-${year}-${num}`;
};

export { generateId, formatDate, daysAgo, hoursAgo, hoursLater };
