import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { Case, UserRole } from '../../shared/types.js';

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

router.get('/', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { status, stage, violationType, department } = req.query;

    const filters = {
      status: status as string | undefined,
      stage: stage as string | undefined,
      violationType: violationType as string | undefined,
      department: department as string | undefined,
      userId,
      role,
    };

    const cases = dataStore.getCases(filters);
    
    res.json({
      success: true,
      data: cases as Case[],
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      error: '获取案件列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { id } = req.params;
    const caseItem = dataStore.getCaseById(id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        error: '案件不存在',
      });
    }

    res.json({
      success: true,
      data: caseItem as Case,
    });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      error: '获取案件详情失败',
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { title, description, violationType, involvedPerson, involvedDepartment, amount, clueId, assignedTo } = req.body;

    if (!title || !description || !violationType || !involvedPerson || !involvedDepartment || !assignedTo) {
      return res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
    }

    const assignedUser = dataStore.getUserById(assignedTo);
    const department = assignedUser?.department || involvedDepartment;

    const caseItem = dataStore.createCase({
      title,
      description,
      violationType,
      involvedPerson,
      involvedDepartment,
      amount: amount ? Number(amount) : undefined,
      clueId,
      assignedTo,
      department,
      handlerId: assignedTo,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isOverdue: false,
    });

    if (clueId) {
      dataStore.updateClue(clueId, {
        status: 'filed',
        relatedCaseId: caseItem.id,
      });
    }

    res.status(201).json({
      success: true,
      data: caseItem as Case,
      message: '立案申请提交成功',
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      error: '创建案件失败',
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const caseItem = dataStore.updateCase(id, updates);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        error: '案件不存在',
      });
    }

    res.json({
      success: true,
      data: caseItem as Case,
      message: '案件更新成功',
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      error: '更新案件失败',
    });
  }
});

router.post('/:id/submit-trial', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { id } = req.params;
    const caseItem = dataStore.getCaseById(id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        error: '案件不存在',
      });
    }

    const updatedCase = dataStore.updateCase(id, {
      status: 'pending_trial',
      currentStage: 'trial',
    });

    if (updatedCase) {
      dataStore.createTrial({
        caseId: id,
        reviewer: userId,
        opinion: '',
      });
    }

    res.json({
      success: true,
      data: updatedCase as Case,
      message: '案件已提交审理',
    });
  } catch (error) {
    console.error('Submit trial error:', error);
    res.status(500).json({
      success: false,
      error: '提交审理失败',
    });
  }
});

export default router;
