import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { TrialRecord, UserRole } from '../../shared/types.js';

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

const generateDecisionDocument = (caseTitle: string, involvedPerson: string, opinion: string) => {
  return `
关于给予${involvedPerson}同志纪律处分的决定

一、基本情况
${involvedPerson}，男，汉族，1975年5月出生，大学文化，1996年8月参加工作，1998年12月加入中国共产党。

二、主要违纪事实
经审理查明：${caseTitle}。

三、处分意见
${opinion}

依据《中国共产党纪律处分条例》相关规定，经纪委常委会会议研究决定：
给予${involvedPerson}同志党内警告处分。

本决定自2024年X月X日起生效。如不服本决定，可自收到本决定书之日起三十日内，向本委提出申诉。

中共XX市纪律检查委员会
2024年X月X日
  `.trim();
};

router.get('/', (req: Request, res: Response) => {
  try {
    const { caseId, reviewer } = req.query;
    const filters = {
      caseId: caseId as string | undefined,
      reviewer: reviewer as string | undefined,
    };

    const trials = dataStore.getTrials(filters);
    
    res.json({
      success: true,
      data: trials as TrialRecord[],
    });
  } catch (error) {
    console.error('Get trials error:', error);
    res.status(500).json({
      success: false,
      error: '获取审理列表失败',
    });
  }
});

router.post('/:id/review', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { opinion } = req.body;
    const { userId, userName } = extractUserFromHeader(req);

    if (!opinion) {
      return res.status(400).json({
        success: false,
        error: '请填写审理意见',
      });
    }

    if (!userId || !userName) {
      return res.status(401).json({
        success: false,
        error: '未登录',
      });
    }

    const caseItem = dataStore.getCaseById(id);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        error: '案件不存在',
      });
    }

    const decisionDocument = generateDecisionDocument(caseItem.title, caseItem.involvedPerson, opinion);

    const trial = dataStore.createTrial({
      caseId: id,
      reviewer: userId,
      opinion,
      decisionDocument,
    });

    res.status(201).json({
      success: true,
      data: trial as TrialRecord,
      message: '审理完成',
    });
  } catch (error) {
    console.error('Create trial error:', error);
    res.status(500).json({
      success: false,
      error: '审理失败',
    });
  }
});

router.post('/:id/sign', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signature } = req.body;
    const { userId } = extractUserFromHeader(req);

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: '请签名',
      });
    }

    const trials = dataStore.getTrials();
    const trial = trials.find(t => t.id === id || t.caseId === id);
    
    if (!trial) {
      return res.status(404).json({
        success: false,
        error: '审理记录不存在',
      });
    }

    const updated = dataStore.updateTrial(trial.id, { signature });

    res.json({
      success: true,
      data: updated as TrialRecord,
      message: '签名完成',
    });
  } catch (error) {
    console.error('Sign trial error:', error);
    res.status(500).json({
      success: false,
      error: '签名失败',
    });
  }
});

router.get('/:id/decision', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trials = dataStore.getTrials();
    const trial = trials.find(t => t.id === id || t.caseId === id);
    
    if (!trial || !trial.decisionDocument) {
      return res.status(404).json({
        success: false,
        error: '处分决定书不存在',
      });
    }

    res.json({
      success: true,
      data: {
        document: trial.decisionDocument,
        signature: trial.signature,
      },
    });
  } catch (error) {
    console.error('Get decision error:', error);
    res.status(500).json({
      success: false,
      error: '获取处分决定书失败',
    });
  }
});

export default router;
