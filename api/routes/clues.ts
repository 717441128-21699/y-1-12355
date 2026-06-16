import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { Clue, UserRole } from '../../shared/types.js';

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

const calculateRiskLevel = (violationType: string, amount?: number): 'low' | 'medium' | 'high' => {
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

    const { status, riskLevel, department } = req.query;

    const filters = {
      status: status as string | undefined,
      riskLevel: riskLevel as string | undefined,
      department: department as string | undefined,
      userId,
      role,
    };

    const clues = dataStore.getClues(filters);
    
    res.json({
      success: true,
      data: clues as Clue[],
    });
  } catch (error) {
    console.error('Get clues error:', error);
    res.status(500).json({
      success: false,
      error: '获取线索列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clue = dataStore.getClueById(id);
    
    if (!clue) {
      return res.status(404).json({
        success: false,
        error: '线索不存在',
      });
    }

    res.json({
      success: true,
      data: clue as Clue,
    });
  } catch (error) {
    console.error('Get clue error:', error);
    res.status(500).json({
      success: false,
      error: '获取线索详情失败',
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, violationType, involvedPerson, involvedDepartment, amount, petitionId, assignedTo } = req.body;

    if (!title || !description || !violationType || !involvedPerson || !involvedDepartment) {
      return res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
    }

    const riskLevel = calculateRiskLevel(violationType, amount ? Number(amount) : undefined);

    const clue = dataStore.createClue({
      title,
      description,
      violationType,
      involvedPerson,
      involvedDepartment,
      amount: amount ? Number(amount) : undefined,
      petitionId,
      riskLevel,
      assignedTo,
    });

    if (petitionId) {
      dataStore.updatePetition(petitionId, {
        status: 'converted',
        relatedClueId: clue.id,
      });
    }

    res.status(201).json({
      success: true,
      data: clue as Clue,
      message: '线索创建成功',
    });
  } catch (error) {
    console.error('Create clue error:', error);
    res.status(500).json({
      success: false,
      error: '创建线索失败',
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.violationType || updates.amount) {
      const existing = dataStore.getClueById(id);
      if (existing) {
        updates.riskLevel = calculateRiskLevel(
          updates.violationType || existing.violationType,
          updates.amount !== undefined ? Number(updates.amount) : existing.amount
        );
      }
    }

    const clue = dataStore.updateClue(id, updates);
    
    if (!clue) {
      return res.status(404).json({
        success: false,
        error: '线索不存在',
      });
    }

    res.json({
      success: true,
      data: clue as Clue,
      message: '线索更新成功',
    });
  } catch (error) {
    console.error('Update clue error:', error);
    res.status(500).json({
      success: false,
      error: '更新线索失败',
    });
  }
});

router.put('/:id/start', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clue = dataStore.startClueInvestigation(id);
    
    if (!clue) {
      return res.status(404).json({
        success: false,
        error: '线索不存在或状态不正确',
      });
    }

    res.json({
      success: true,
      data: clue as Clue,
      message: '调查已启动',
    });
  } catch (error) {
    console.error('Start investigation error:', error);
    res.status(500).json({
      success: false,
      error: '启动调查失败',
    });
  }
});

router.put('/:id/escalate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clue = dataStore.updateClue(id, { escalated: true });
    
    if (!clue) {
      return res.status(404).json({
        success: false,
        error: '线索不存在',
      });
    }

    res.json({
      success: true,
      data: clue as Clue,
      message: '线索已升级',
    });
  } catch (error) {
    console.error('Escalate clue error:', error);
    res.status(500).json({
      success: false,
      error: '升级线索失败',
    });
  }
});

export default router;
