import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { TalkRecord, UserRole } from '../../shared/types.js';

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
    const { caseId, status } = req.query;
    const { userId, role } = extractUserFromHeader(req);

    const filters = {
      caseId: caseId as string | undefined,
      status: status as string | undefined,
      userId,
      role,
    };

    const talks = dataStore.getTalks(filters);
    
    res.json({
      success: true,
      data: talks as TalkRecord[],
    });
  } catch (error) {
    console.error('Get talks error:', error);
    res.status(500).json({
      success: false,
      error: '获取谈话列表失败',
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const talk = dataStore.getTalkById(id);
    
    if (!talk) {
      return res.status(404).json({
        success: false,
        error: '谈话记录不存在',
      });
    }

    res.json({
      success: true,
      data: talk as TalkRecord,
    });
  } catch (error) {
    console.error('Get talk error:', error);
    res.status(500).json({
      success: false,
      error: '获取谈话详情失败',
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { caseId, title, interviewee, startTime, location, recorder } = req.body;

    if (!caseId || !title || !interviewee || !startTime || !location || !recorder) {
      return res.status(400).json({
        success: false,
        error: '必填字段不能为空',
      });
    }

    const talk = dataStore.createTalk({
      caseId,
      title,
      interviewee,
      startTime,
      location,
      recorder,
      content: '',
    });

    res.status(201).json({
      success: true,
      data: talk as TalkRecord,
      message: '谈话安排成功',
    });
  } catch (error) {
    console.error('Create talk error:', error);
    res.status(500).json({
      success: false,
      error: '创建谈话失败',
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const talk = dataStore.updateTalk(id, updates);
    
    if (!talk) {
      return res.status(404).json({
        success: false,
        error: '谈话记录不存在',
      });
    }

    res.json({
      success: true,
      data: talk as TalkRecord,
      message: '谈话记录更新成功',
    });
  } catch (error) {
    console.error('Update talk error:', error);
    res.status(500).json({
      success: false,
      error: '更新谈话记录失败',
    });
  }
});

router.post('/:id/upload', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { audioUrl, videoUrl } = req.body;

    if (!audioUrl && !videoUrl) {
      return res.status(400).json({
        success: false,
        error: '请上传音频或视频文件',
      });
    }

    const talk = dataStore.updateTalk(id, {
      audioUrl: audioUrl || undefined,
      videoUrl: videoUrl || undefined,
    });
    
    if (!talk) {
      return res.status(404).json({
        success: false,
        error: '谈话记录不存在',
      });
    }

    res.json({
      success: true,
      data: talk as TalkRecord,
      message: '音视频上传成功',
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      error: '上传失败',
    });
  }
});

export default router;
