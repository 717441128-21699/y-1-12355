import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import { getDashboardStats } from '../../shared/mockData.js';
import type { DashboardStats, CaseStatus, ViolationType, UserRole } from '../../shared/types.js';

const router = express.Router();

const extractUserFromHeader = (req: Request): { userId?: string; role?: UserRole } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString();
    const userId = decoded.split(':')[0];
    const user = dataStore.getUserById(userId);
    return { userId, role: user?.role };
  } catch {
    return {};
  }
};

router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { type, department, startDate, endDate } = req.query;

    const cases = dataStore.getCases();
    const clues = dataStore.getClues();
    const petitions = dataStore.getPetitions();
    const approvals = dataStore.getApprovals();
    const talks = dataStore.getTalks();
    const users = dataStore.getUsers();

    const getCaseDepartment = (caseItem: any) => {
      const handler = users.find(u => u.id === caseItem.assignedTo);
      return handler?.department || caseItem.involvedDepartment;
    };

    let filteredCases = cases;
    let filteredClues = clues;

    if (type) {
      filteredCases = filteredCases.filter(c => c.violationType === type);
      filteredClues = filteredClues.filter(c => c.violationType === type);
    }

    if (department) {
      filteredCases = filteredCases.filter(c => getCaseDepartment(c) === department);
      filteredClues = filteredClues.filter(c => {
        const handler = users.find(u => u.id === c.assignedTo);
        return handler?.department === department;
      });
    }

    if (startDate) {
      const start = new Date(startDate as string);
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) >= start);
      filteredClues = filteredClues.filter(c => new Date(c.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) <= end);
      filteredClues = filteredClues.filter(c => new Date(c.createdAt) <= end);
    }

    const totalCases = filteredCases.length;
    const pendingCases = filteredCases.filter(c => c.status !== 'closed').length;
    const completedCases = filteredCases.filter(c => c.status === 'closed').length;
    const overdueCases = filteredCases.filter(c => 
      c.approvalHistory.some(a => a.isOverdue) || 
      c.talkRecords.some(t => t.isOverdue)
    ).length;
    const closingRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;
    const distributionEfficiency = Math.round((petitions.filter(p => p.status !== 'pending').length / Math.max(petitions.length, 1)) * 100);

    const casesByType = filteredCases.reduce((acc, c) => {
      acc[c.violationType] = (acc[c.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casesByDepartment = filteredCases.reduce((acc, c) => {
      const dept = getCaseDepartment(c);
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = new Date();
    const trendData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const count = filteredCases.filter(c => {
        const created = new Date(c.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;
      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        count,
      };
    });

    const overdueClues = filteredClues.filter(c => c.isOverdue).length;
    const pendingApprovals = approvals.filter(a => a.result !== 'approved' && a.result !== 'rejected').length;
    const pendingTalks = talks.filter(t => t.isOverdue).length;

    const stats: DashboardStats = {
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

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
    });
  }
});

router.get('/trend', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { months = '12' } = req.query;
    const numMonths = parseInt(months as string, 10);

    const cases = dataStore.getCases();
    const now = new Date();

    const trendData = Array.from({ length: numMonths }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1 - i), 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = cases.filter(c => {
        const created = new Date(c.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;

      const closed = cases.filter(c => {
        if (c.status !== 'closed') return false;
        const closedDate = c.trialRecord?.createdAt 
          ? new Date(c.trialRecord.createdAt) 
          : new Date(c.createdAt);
        return closedDate >= monthStart && closedDate <= monthEnd;
      }).length;

      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        newCases: count,
        closedCases: closed,
      };
    });

    res.json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({
      success: false,
      error: '获取趋势数据失败',
    });
  }
});

router.get('/export', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { month, year } = req.query;
    
    const now = new Date();
    const reportYear = year ? parseInt(year as string, 10) : now.getFullYear();
    const reportMonth = month ? parseInt(month as string, 10) - 1 : now.getMonth();

    const monthStart = new Date(reportYear, reportMonth, 1);
    const monthEnd = new Date(reportYear, reportMonth + 1, 0);

    const cases = dataStore.getCases();
    const clues = dataStore.getClues();
    const petitions = dataStore.getPetitions();

    const monthCases = cases.filter(c => {
      const created = new Date(c.createdAt);
      return created >= monthStart && created <= monthEnd;
    });

    const monthClues = clues.filter(c => {
      const created = new Date(c.createdAt);
      return created >= monthStart && created <= monthEnd;
    });

    const monthPetitions = petitions.filter(p => {
      const created = new Date(p.createdAt);
      return created >= monthStart && created <= monthEnd;
    });

    const report = {
      title: `${reportYear}年${reportMonth + 1}月纪检监察工作分析报告`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalPetitions: monthPetitions.length,
        totalClues: monthClues.length,
        totalCases: monthCases.length,
        closedCases: monthCases.filter(c => c.status === 'closed').length,
        pendingCases: monthCases.filter(c => c.status !== 'closed').length,
        overdueCases: monthCases.filter(c => 
          c.approvalHistory.some(a => a.isOverdue) || 
          c.talkRecords.some(t => t.isOverdue)
        ).length,
      },
      byType: monthCases.reduce((acc, c) => {
        acc[c.violationType] = (acc[c.violationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byDepartment: monthCases.reduce((acc, c) => {
        acc[c.involvedDepartment] = (acc[c.involvedDepartment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      cases: monthCases.map(c => ({
        caseNumber: c.caseNumber,
        title: c.title,
        involvedPerson: c.involvedPerson,
        involvedDepartment: c.involvedDepartment,
        status: c.status,
        amount: c.amount,
        createdAt: c.createdAt,
      })),
    };

    const csvContent = [
      ['案件编号', '案件标题', '被调查人', '涉案单位', '状态', '涉案金额', '立案日期'],
      ...report.cases.map(c => [
        c.caseNumber,
        c.title,
        c.involvedPerson,
        c.involvedDepartment,
        c.status,
        c.amount ? `¥${c.amount.toLocaleString()}` : '-',
        new Date(c.createdAt).toLocaleDateString('zh-CN'),
      ]),
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportYear}-${String(reportMonth + 1).padStart(2, '0')}-纪检监察工作分析报告.csv"`);
    
    res.write('\uFEFF');
    res.write(csvContent);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: '导出失败',
    });
  }
});

export default router;
