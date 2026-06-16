import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { ApprovalRecord, UserRole } from '../../shared/types.js';

const router = express.Router();

const extractUserFromHeader = (req: Request): { userId?: string; role?: UserRole; userName?: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString();
    const userId = decoded.split(':')[0];
    const user = dataStore.getUserById(userId);
    return { userId, role: user?.role, userName: user?.name };
  } catch {
    return {};
  }
};

router.get('/', (req: Request, res: Response) => {
  try {
    const { caseId, stage } = req.query;
    const { role } = extractUserFromHeader(req);

    const filters = {
      caseId: caseId as string | undefined,
      stage: stage as string | undefined,
      role,
    };

    const approvals = dataStore.getApprovals(filters);
    
    res.json({
      success: true,
      data: approvals as ApprovalRecord[],
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({
      success: false,
      error: '获取审批列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approvals = dataStore.getApprovals();
    const approval = approvals.find(a => a.id === id);
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: '审批记录不存在',
      });
    }

    res.json({
      success: true,
      data: approval as ApprovalRecord,
    });
  } catch (error) {
    console.error('Get approval error:', error);
    res.status(500).json({
      success: false,
      error: '获取审批详情失败',
    });
  }
});

router.put('/:id/approve', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { opinion, signature } = req.body;
    const { userId, role, userName } = extractUserFromHeader(req);

    if (!opinion || !signature) {
      return res.status(400).json({
        success: false,
        error: '请填写审批意见并签名',
      });
    }

    if (!userId || !role || !userName) {
      return res.status(401).json({
        success: false,
        error: '未登录',
      });
    }

    const approval = dataStore.approveApproval(id, {
      opinion,
      signature,
      approver: userId,
      approverRole: role,
    });
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: '审批记录不存在',
      });
    }

    res.json({
      success: true,
      data: approval as ApprovalRecord,
      message: '审批通过',
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({
      success: false,
      error: '审批失败',
    });
  }
});

router.put('/:id/reject', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { opinion, signature } = req.body;
    const { userId, role, userName } = extractUserFromHeader(req);

    if (!opinion || !signature) {
      return res.status(400).json({
        success: false,
        error: '请填写驳回理由并签名',
      });
    }

    if (!userId || !role || !userName) {
      return res.status(401).json({
        success: false,
        error: '未登录',
      });
    }

    const approval = dataStore.rejectApproval(id, {
      opinion,
      signature,
      approver: userId,
      approverRole: role,
    });
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: '审批记录不存在',
      });
    }

    res.json({
      success: true,
      data: approval as ApprovalRecord,
      message: '已驳回',
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({
      success: false,
      error: '操作失败',
    });
  }
});

export default router;
