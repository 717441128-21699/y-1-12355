import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button, Input, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

const demoAccounts = [
  { username: 'handler', password: '123456', role: '承办人', name: '张明' },
  { username: 'dept_head', password: '123456', role: '部门负责人', name: '李华' },
  { username: 'case_office', password: '123456', role: '案管室', name: '王芳' },
  { username: 'leader', password: '123456', role: '领导', name: '赵刚' },
]

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  
  const { login, loading, error, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string })?.from || '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    const success = await login(username, password)
    if (success) {
      navigate(from, { replace: true })
    }
  }

  const handleQuickLogin = (index: number) => {
    const account = demoAccounts[index]
    setUsername(account.username)
    setPassword(account.password)
    setSelectedAccount(index)
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="mb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-6 mx-auto">
              <Shield className="h-14 w-14" />
            </div>
            <h1 className="text-4xl font-bold text-center mb-4">
              智慧纪检监察
              <br />
              综合管理平台
            </h1>
            <p className="text-lg text-white/80 text-center max-w-md">
              整合信访举报、线索研判、立案审批、案件审查、审理结案全流程
              <br />
              实现纪检监察工作数字化、智能化管理
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
            {[
              { title: '智能分级', desc: '线索自动风险评估' },
              { title: '流程管控', desc: '审批限时自动越级' },
              { title: '实时预警', desc: '超期自动提醒升级' },
              { title: '全程留痕', desc: '操作记录可追溯' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8 text-center text-white/60 text-sm">
            <p>© 2025 智慧纪检监察平台 | 严守党的纪律 维护党的纯洁</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-700 mb-4 mx-auto">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900">智慧纪检监察综合管理平台</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-dark-900 mb-2">用户登录</h2>
            <p className="text-gray-500 mb-6">请输入您的账号信息登录系统</p>

            {error && (
              <Alert variant="danger" message={error} className="mb-6" />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  label="用户名"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  icon={<User className="h-4 w-4 text-gray-400" />}
                />
              </div>

              <div className="relative">
                <Input
                  label="密码"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-700 focus:ring-primary-500" />
                  <span className="text-gray-600">记住账号</span>
                </label>
                <a href="#" className="text-primary-700 hover:text-primary-800 font-medium">
                  忘记密码？
                </a>
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-base"
                loading={loading}
                disabled={!username || !password}
              >
                登 录
              </Button>
            </form>

            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-3 text-center">演示账号（点击快速登录）</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickLogin(index)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm transition-all duration-200',
                      selectedAccount === index
                        ? 'border-primary-700 bg-primary-50 text-primary-700 font-medium'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 text-gray-600'
                    )}
                  >
                    <div className="font-medium">{account.role}</div>
                    <div className="text-xs opacity-70">{account.name}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                所有演示账号密码均为：123456
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
