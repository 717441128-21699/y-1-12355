import { useState } from 'react'
import {
  User,
  Shield,
  Bell,
  Database,
  Key,
  Save,
  Check,
  Users,
  Building,
  FileCode,
  Info,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Switch,
  Alert,
  Badge,
  Table,
  Column,
} from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const Settings = () => {
  const user = useAuthStore((state) => state.user)
  const { updatePassword } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'notifications' | 'system'>('profile')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    phone: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    overdue: true,
    approval: true,
    talk: true,
  })

  const tabs = [
    { key: 'profile', label: '个人设置', icon: <User className="h-4 w-4" /> },
    { key: 'permissions', label: '权限管理', icon: <Shield className="h-4 w-4" /> },
    { key: 'notifications', label: '通知设置', icon: <Bell className="h-4 w-4" /> },
    { key: 'system', label: '系统设置', icon: <Database className="h-4 w-4" /> },
  ] as const

  const handleSaveProfile = () => {
    setSuccessMessage('个人信息保存成功')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致')
      return
    }
    setSubmitLoading(true)
    try {
      const result = await updatePassword(
        passwordForm.oldPassword,
        passwordForm.newPassword
      )
      if (result) {
        setSuccessMessage('密码修改成功')
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        alert('原密码错误')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const users = [
    { id: '1', name: '张伟', role: 'handler', department: '第一纪检监察室', status: 'active' },
    { id: '2', name: '李静', role: 'handler', department: '第一纪检监察室', status: 'active' },
    { id: '3', name: '王强', role: 'dept_head', department: '第一纪检监察室', status: 'active' },
    { id: '4', name: '刘芳', role: 'handler', department: '第二纪检监察室', status: 'active' },
    { id: '5', name: '陈明', role: 'dept_head', department: '第二纪检监察室', status: 'active' },
    { id: '6', name: '赵刚', role: 'case_office', department: '案件监督管理室', status: 'active' },
    { id: '7', name: '孙丽', role: 'handler', department: '案件审理室', status: 'active' },
    { id: '8', name: '周涛', role: 'leader', department: '纪委领导', status: 'active' },
  ]

  const roleLabel: Record<string, string> = {
    handler: '承办人',
    dept_head: '部门负责人',
    case_office: '案管室',
    leader: '领导',
  }

  const userColumns: Column<typeof users[0]>[] = [
    {
      key: 'name',
      title: '姓名',
      width: 100,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
            {r.name.charAt(0)}
          </div>
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: 'department', title: '所属部门', width: 150 },
    {
      key: 'role',
      title: '角色',
      width: 120,
      render: (r) => (
        <Badge variant={
          r.role === 'leader' ? 'primary' :
          r.role === 'case_office' ? 'navy' :
          r.role === 'dept_head' ? 'warning' : 'default'
        } size="sm">
          {roleLabel[r.role]}
        </Badge>
      ),
    },
    {
      key: 'permissions',
      title: '权限范围',
      render: (r) => (
        <span className="text-sm text-gray-600">
          {r.role === 'handler' && '仅查看本人案件'}
          {r.role === 'dept_head' && '查看本部门案件'}
          {r.role === 'case_office' && '查看全局案件'}
          {r.role === 'leader' && '审批重大案件'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 80,
      align: 'center',
      render: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'default'} size="sm">
          {r.status === 'active' ? '正常' : '禁用'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">
          个人信息、权限管理、通知设置及系统配置
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      <div className="bg-white rounded-lg border">
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-700" />
                  个人信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="姓名"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    disabled
                  />
                  <Input
                    label="部门"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    disabled
                  />
                  <Input
                    label="角色"
                    value={user?.role ? roleLabel[user.role] : ''}
                    disabled
                  />
                  <Input
                    label="联系电话"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="请输入联系电话"
                  />
                  <Input
                    label="电子邮箱"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="请输入电子邮箱"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    保存信息
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary-700" />
                  修改密码
                </h3>
                <div className="space-y-4">
                  <Input
                    label="原密码"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="请输入原密码"
                  />
                  <Input
                    label="新密码"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="请输入新密码（至少6位）"
                  />
                  <Input
                    label="确认新密码"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="请再次输入新密码"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleChangePassword} loading={submitLoading}>
                    <Key className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary-700" />
                  四级权限体系说明
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { role: 'handler', name: '承办人', desc: '仅查看本人案件，可进行信访、线索、谈话等具体操作', color: 'gray' },
                    { role: 'dept_head', name: '部门负责人', desc: '查看本部门所有案件，可审核本部门案件', color: 'warning' },
                    { role: 'case_office', name: '案管室', desc: '查看全局所有案件，监督办案流程，管理数据统计', color: 'navy' },
                    { role: 'leader', name: '领导', desc: '审批重大案件，查看全局数据和统计分析', color: 'primary' },
                  ].map(item => (
                    <div key={item.role} className="bg-gray-50 rounded-lg p-4 border">
                      <Badge variant={item.color as any} size="sm" className="mb-2">
                        {item.name}
                      </Badge>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-700" />
                  用户列表
                </h3>
                <Table
                  columns={userColumns}
                  data={users}
                  emptyText="暂无用户"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-700" />
                通知设置
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'overdue', label: '超期预警通知', desc: '当案件、线索、谈话超期时发送通知' },
                  { key: 'approval', label: '审批通知', desc: '当有新的审批待处理时发送通知' },
                  { key: 'talk', label: '谈话提醒', desc: '当有新的谈话任务时发送通知' },
                  { key: 'email', label: '邮件通知', desc: '通过邮件发送系统通知' },
                  { key: 'sms', label: '短信通知', desc: '通过短信发送重要通知' },
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => { setSuccessMessage('通知设置已保存'); setTimeout(() => setSuccessMessage(''), 3000) }}>
                  <Save className="h-4 w-4 mr-2" />
                  保存设置
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary-700" />
                系统信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        <FileCode className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">系统版本</p>
                        <p className="font-semibold">v1.0.0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Check className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">系统状态</p>
                        <p className="font-semibold text-green-600">正常运行</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 text-navy-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">在线用户</p>
                        <p className="font-semibold">8 人</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">部署单位</p>
                        <p className="font-semibold">中共XX市纪律检查委员会</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary-700" />
                  关于系统
                </h3>
                <div className="bg-gradient-to-r from-primary-50 to-navy-50 rounded-lg p-6 border">
                  <h4 className="text-xl font-bold text-dark-900 mb-2">智慧纪检监察综合管理平台</h4>
                  <p className="text-gray-600 mb-4">
                    本平台整合信访举报、线索研判、立案审批、案件审查、审理结案全流程，
                    实现纪检监察工作的数字化、智能化管理。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">技术支持</p>
                      <p className="font-medium">信息技术保障室</p>
                    </div>
                    <div>
                      <p className="text-gray-500">联系电话</p>
                      <p className="font-medium">0XXX-XXXXXXX</p>
                    </div>
                    <div>
                      <p className="text-gray-500">上线时间</p>
                      <p className="font-medium">2024年1月</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
