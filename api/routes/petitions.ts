import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { Petition, UserRole } from '../../shared/types.js';

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

    const { status, type, department } = req.query;

    const filters = {
      status: status as string | undefined,
      type: type as string | undefined,
      department: department as string | undefined,
      userId,
      role,
    };

    const petitions = dataStore.getPetitions(filters);
    
    res.json({
      success: true,
      data: petitions as Petition[],
    });
  } catch (error) {
    console.error('Get petitions error:', error);
    res.status(500).json({
      success: false,
      error: '获取信访举报列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const petition = dataStore.getPetitionById(id);
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: '信访举报不存在',
      });
    }

    res.json({
      success: true,
      data: petition as Petition,
    });
  } catch (error) {
    console.error('Get petition error:', error);
    res.status(500).json({
      success: false,
      error: '获取信访举报详情失败',
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, content, type, involvedPerson, involvedDepartment, informant, informantContact, amount, assignedDepartment } = req.body;

    if (!title || !content || !type || !involvedPerson || !involvedDepartment || !assignedDepartment) {
      return res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
    }

    const petition = dataStore.createPetition({
      title,
      content,
      type,
      involvedPerson,
      involvedDepartment,
      informant,
      informantContact,
      amount: amount ? Number(amount) : undefined,
    });

    res.status(201).json({
      success: true,
      data: petition as Petition,
      message: '信访举报创建成功',
    });
  } catch (error) {
    console.error('Create petition error:', error);
    res.status(500).json({
      success: false,
      error: '创建信访举报失败',
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const petition = dataStore.updatePetition(id, updates);
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: '信访举报不存在',
      });
    }

    res.json({
      success: true,
      data: petition as Petition,
      message: '信访举报更新成功',
    });
  } catch (error) {
    console.error('Update petition error:', error);
    res.status(500).json({
      success: false,
      error: '更新信访举报失败',
    });
  }
});

router.put('/:id/assign', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { id } = req.params;
    const { assignedTo, assignedDepartment } = req.body;

    const petition = dataStore.updatePetition(id, {
      assignedTo,
      assignedDepartment,
      status: 'assigned',
    });
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: '信访举报不存在',
      });
    }

    res.json({
      success: true,
      data: petition as Petition,
      message: '分配成功',
    });
  } catch (error) {
    console.error('Assign petition error:', error);
    res.status(500).json({
      success: false,
      error: '分配失败',
    });
  }
});

router.put('/:id/convert', (req: Request, res: Response) => {
  try {
    const { userId, role } = extractUserFromHeader(req);
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        error: '未授权访问',
      });
    }

    const { id } = req.params;
    const clue = dataStore.convertPetitionToClue(id);
    
    if (!clue) {
      return res.status(404).json({
        success: false,
        error: '信访举报不存在',
      });
    }

    res.json({
      success: true,
      data: clue,
      message: '已成功转为线索',
    });
  } catch (error) {
    console.error('Convert petition to clue error:', error);
    res.status(500).json({
      success: false,
      error: '转线索失败',
    });
  }
});

export default router;
