import express, { type Request, type Response } from 'express';
import { dataStore } from '../dataStore.js';
import type { LoginRequest, User } from '../../shared/types.js';

const router = express.Router();

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      });
    }

    const user = dataStore.login(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      data: {
        user,
        token,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
    });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '退出成功',
  });
});

router.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未登录',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString();
    const userId = decoded.split(':')[0];
    
    const user = dataStore.getUserById(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '认证失败',
    });
  }
});

router.get('/users', (req: Request, res: Response) => {
  try {
    const users = dataStore.getUsers();
    res.json({
      success: true,
      data: users as User[],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
    });
  }
});

router.put('/password', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未登录',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString();
    const userId = decoded.split(':')[0];

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '原密码和新密码不能为空',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: '新密码长度不能少于6位',
      });
    }

    const result = dataStore.updatePassword(userId, oldPassword, newPassword);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: '原密码错误',
      });
    }

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败',
    });
  }
});

export default router;
