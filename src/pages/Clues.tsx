import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Edit, Play, AlertTriangle, FileText, TrendingUp, Clock, User, Building2, Zap } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  Column,
  Button,
  Input,
  Select,
  Modal,
  Textarea,
  Pagination,
  Badge,
  Alert,
  StatCard,
} from '@/components/ui'
import { ClueStatusBadge, RiskLevelBadge, ViolationTypeBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatMoney, truncateText, getTimeRemaining } from '@/utils/format'
import {
  Clue,
  ViolationType,
  RiskLevel,
  ClueStatus,
  VIOLATION_TYPE_LABELS,
  DEPARTMENTS,
} from '../../shared/types'
import { clueApi } from '@/api/client'

const Clues = () => {
  const { clues, loading, fetchClues, createClue, updateClue, startClue } = useDataStore()
  const user = useAuthStore((state) => state.user)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [currentClue, setCurrentClue] = useState<Clue | null>(null)
  const [formData, setFormData] = useState<Partial<Clue>>({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [page, statusFilter, riskFilter])

  const loadData = () => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (riskFilter) params.riskLevel = riskFilter
    fetchClues(params)
  }

  const filteredClues = clues.filter((c) =>
    !searchText ||
    c.title.toLowerCase().includes(searchText.toLowerCase()) ||
    c.involvedPerson.toLowerCase().includes(searchText.toLowerCase()) ||
    c.description.toLowerCase().includes(searchText.toLowerCase())
  )

  const paginatedClues = filteredClues.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const calculateRisk = (type: string, amount?: number): RiskLevel => {
    const highAmount = 1000000
    const mediumAmount = 100000
    
    if (type === 'political' || type === 'economic') {
      if (amount && amount >= highAmount) return 'high'
      if (amount && amount >= mediumAmount) return 'medium'
      return 'medium'
    }
    if (amount && amount >= highAmount) return 'high'
    if (amount && amount >= mediumAmount) return 'medium'
    return 'low'
  }

  const handleCreate = () => {
    setCurrentClue(null)
    setFormData({
      title: '',
      description: '',
      violationType: 'economic' as ViolationType,
      riskLevel: 'medium' as RiskLevel,
      status: 'pending' as ClueStatus,
      involvedPerson: '',
      involvedDepartment: '',
      assignedTo: user?.id,
      isOverdue: false,
      escalated: false,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (clue: Clue) => {
    setCurrentClue(clue)
    setFormData({ ...clue })
    setIsModalOpen(true)
  }

  const handleView = (clue: Clue) => {
    setCurrentClue(clue)
    setIsDetailModalOpen(true)
  }

  const handleStart = async (clue: Clue) => {
    if (!confirm('确定要启动此线索的调查工作吗？')) return

    const result = await startClue(clue.id)
    if (result) {
      setSuccessMessage('调查已启动，请及时开展谈话核实工作')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const handleEscalate = (clue: Clue) => {
    setCurrentClue(clue)
    setIsEscalateModalOpen(true)
  }

  const handleEscalateSubmit = async () => {
    if (!currentClue) return

    setSubmitLoading(true)
    try {
      const response = await clueApi.escalate(currentClue.id)
      if (response.success) {
        loadData()
        setIsEscalateModalOpen(false)
        setSuccessMessage('线索已升级，将推送至分管领导')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.involvedPerson) {
      return
    }

    const autoRisk = calculateRisk(formData.violationType || 'other', formData.amount)
    const dataToSubmit = { ...formData, riskLevel: autoRisk }

    setSubmitLoading(true)
    try {
      let result
      if (currentClue) {
        result = await updateClue(currentClue.id, dataToSubmit)
      } else {
        result = await createClue(dataToSubmit)
      }

      if (result) {
        setIsModalOpen(false)
        setSuccessMessage(currentClue ? '更新成功！' : '创建成功！系统已自动完成风险分级')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleConvertToCase = async (clue: Clue) => {
    if (!confirm('确定要将此线索转为立案审批吗？')) return

    try {
      const response = await clueApi.update(clue.id, {
        status: 'filed' as ClueStatus,
      })
      if (response.success) {
        loadData()
        setSuccessMessage('已成功提交立案审批，将进入三级审批流程')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('Convert to case error:', error)
    }
  }

  const getDeadlineInfo = (clue: Clue) => {
    if (!clue.deadline) return null
    const remaining = getTimeRemaining(clue.deadline)
    if (remaining.isOverdue) {
      return <span className="text-red-600 font-medium">已超期</span>
    }
    return (
      <span className={remaining.hours < 24 ? 'text-orange-600' : 'text-gray-500'}>
        剩余 {remaining.hours}小时{remaining.minutes}分
      </span>
    )
  }

  const columns: Column<Clue>[] = [
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 90,
      align: 'center',
      render: (record) => (
        <div className="flex flex-col items-center gap-1">
          <RiskLevelBadge level={record.riskLevel} />
          {record.escalated && (
            <Badge variant="danger" size="sm" className="animate-pulse">
              已升级
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      title: '线索标题',
      render: (record) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-1">
            {record.isOverdue && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
            <p className="font-medium text-gray-900 truncate" title={record.title}>
              {record.title}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate" title={record.description}>
            {truncateText(record.description, 50)}
          </p>
        </div>
      ),
    },
    {
      key: 'violationType',
      title: '违纪类型',
      width: 90,
      render: (record) => <ViolationTypeBadge type={record.violationType} />,
    },
    {
      key: 'involvedPerson',
      title: '涉事人员',
      width: 100,
      render: (record) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-gray-400" />
          <span>{record.involvedPerson}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '涉及金额',
      width: 120,
      align: 'right',
      render: (record) => (
        <span className={record.amount && record.amount >= 1000000 ? 'text-red-600 font-bold' : ''}>
          {formatMoney(record.amount)}
        </span>
      ),
    },
    {
      key: 'deadline',
      title: '办理时限',
      width: 130,
      align: 'center',
      render: (record) => (
        <div className="text-sm">
          {record.status === 'pending' && getDeadlineInfo(record)}
          {record.status !== 'pending' && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: (record) => <ClueStatusBadge status={record.status} />,
    },
    {
      key: 'involvedDepartment',
      title: '所属单位',
      width: 120,
      render: (record) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="truncate text-sm" title={record.involvedDepartment}>
            {record.involvedDepartment}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '登记时间',
      width: 150,
      render: (record) => (
        <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 240,
      align: 'center',
      render: (record) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleView(record)}>
            <Eye className="h-4 w-4" />
          </Button>
          {user?.role !== 'handler' && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {record.status === 'pending' && !record.isOverdue && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStart(record)}
            >
              <Play className="h-4 w-4 mr-1" />
              启动调查
            </Button>
          )}
          {record.status === 'pending' && record.isOverdue && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleEscalate(record)}
            >
              <Zap className="h-4 w-4 mr-1" />
              升级
            </Button>
          )}
          {record.status === 'verified' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleConvertToCase(record)}
            >
              <FileText className="h-4 w-4 mr-1" />
              立案
            </Button>
          )}
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待研判' },
    { value: 'reviewing', label: '研判中' },
    { value: 'investigating', label: '调查中' },
    { value: 'filed', label: '已立案' },
    { value: 'closed', label: '已办结' },
  ]

  const riskOptions = [
    { value: '', label: '全部风险' },
    { value: 'high', label: '高风险' },
    { value: 'medium', label: '中风险' },
    { value: 'low', label: '低风险' },
  ]

  const highRiskCount = clues.filter(c => c.riskLevel === 'high').length
  const overdueCount = clues.filter(c => c.isOverdue).length
  const investigatingCount = clues.filter(c => c.status === 'investigating').length
  const filedCount = clues.filter(c => c.status === 'filed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">线索研判管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            智能风险分级，高风险线索48小时内未启动自动升级
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增线索
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      {overdueCount > 0 && (
        <Alert
          variant="danger"
          title="超期预警"
          message={`有 ${overdueCount} 条线索已超期未启动调查，高风险线索将自动升级！`}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="高风险线索"
          value={highRiskCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          subtitle="需重点关注"
          className={highRiskCount > 0 ? 'animate-pulse-slow' : ''}
        />
        <StatCard
          title="待研判"
          value={clues.filter(c => c.status === 'pending').length}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle="48小时限时办理"
        />
        <StatCard
          title="调查中"
          value={investigatingCount}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
          subtitle="正在核实取证"
        />
        <StatCard
          title="已立案"
          value={filedCount}
          icon={<FileText className="h-5 w-5" />}
          variant="navy"
          subtitle="进入审批流程"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">筛选：</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索标题、涉事人员、内容..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                options={statusOptions}
                className="w-32"
              />
              <Select
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setPage(1) }}
                options={riskOptions}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={paginatedClues}
            loading={loading}
            emptyText="暂无线索数据"
          />
          <div className="px-6 border-t">
            <Pagination
              current={page}
              total={filteredClues.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-navy-50 to-primary-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-dark-900 mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary-700" />
          智能风险分级规则
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded p-3">
            <p className="font-medium text-red-600 mb-1">高风险</p>
            <ul className="text-gray-600 space-y-1">
              <li>• 政治/经济类 + 金额≥100万</li>
              <li>• 其他类型 + 金额≥100万</li>
              <li>• 48小时内未启动自动升级</li>
            </ul>
          </div>
          <div className="bg-white rounded p-3">
            <p className="font-medium text-yellow-600 mb-1">中风险</p>
            <ul className="text-gray-600 space-y-1">
              <li>• 政治/经济类 + 金额10万-100万</li>
              <li>• 其他类型 + 金额10万-100万</li>
              <li>• 政治/经济类（无金额）</li>
            </ul>
          </div>
          <div className="bg-white rounded p-3">
            <p className="font-medium text-green-600 mb-1">低风险</p>
            <ul className="text-gray-600 space-y-1">
              <li>• 其他类型 + 金额＜10万</li>
              <li>• 一般作风问题</li>
              <li>• 情节轻微的违规行为</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentClue ? '编辑线索' : '新增线索'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={submitLoading}>
              {currentClue ? '保存修改' : '提交登记'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="info"
            message="系统将根据违纪类型和涉及金额自动计算风险等级。"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="线索标题"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入线索标题"
                required
              />
            </div>
            <Select
              label="违纪类型"
              value={formData.violationType || ''}
              onChange={(e) => {
                const type = e.target.value as ViolationType
                const newRisk = calculateRisk(type, formData.amount)
                setFormData({ ...formData, violationType: type, riskLevel: newRisk })
              }}
              options={Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              required
            />
            <Select
              label="风险等级（自动计算）"
              value={formData.riskLevel || ''}
              disabled
              options={[
                { value: 'low', label: '低风险' },
                { value: 'medium', label: '中风险' },
                { value: 'high', label: '高风险' },
              ]}
            />
            <Input
              label="涉事人员姓名"
              value={formData.involvedPerson || ''}
              onChange={(e) => setFormData({ ...formData, involvedPerson: e.target.value })}
              placeholder="请输入涉事人员姓名"
              required
            />
            <Input
              label="涉事人员单位"
              value={formData.involvedDepartment || ''}
              onChange={(e) => setFormData({ ...formData, involvedDepartment: e.target.value })}
              placeholder="请输入涉事人员单位"
              required
            />
            <Input
              label="涉及金额（元）"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => {
                const amount = Number(e.target.value)
                const newRisk = calculateRisk(formData.violationType || 'other', amount)
                setFormData({ ...formData, amount, riskLevel: newRisk })
              }}
              placeholder="请输入涉及金额"
            />
            <Select
              label="当前状态"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClueStatus })}
              options={statusOptions.filter(o => o.value !== '')}
              required
            />
          </div>
          <Textarea
            label="线索描述"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请详细描述线索内容..."
            rows={6}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="线索详情"
        size="lg"
      >
        {currentClue && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentClue.title}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <ClueStatusBadge status={currentClue.status} />
                  <RiskLevelBadge level={currentClue.riskLevel} />
                  <ViolationTypeBadge type={currentClue.violationType} />
                  {currentClue.escalated && (
                    <Badge variant="danger" className="animate-pulse">已升级</Badge>
                  )}
                  {currentClue.isOverdue && (
                    <Badge variant="danger" className="animate-pulse">已超期</Badge>
                  )}
                </div>
              </div>
              {currentClue.amount && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">涉及金额</p>
                  <p className="text-xl font-bold text-red-600">{formatMoney(currentClue.amount)}</p>
                </div>
              )}
            </div>

            {currentClue.deadline && currentClue.status === 'pending' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">办理时限</p>
                    <p className="text-sm text-orange-700">
                      截止时间：{formatDate(currentClue.deadline)}
                      {' · '}
                      {getDeadlineInfo(currentClue)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <p className="text-sm text-gray-500">涉事人员</p>
                <p className="font-medium mt-1">{currentClue.involvedPerson}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">所属单位</p>
                <p className="font-medium mt-1">{currentClue.involvedDepartment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">登记时间</p>
                <p className="font-medium mt-1">{formatDate(currentClue.createdAt)}</p>
              </div>
              {currentClue.relatedCaseId && (
                <div>
                  <p className="text-sm text-gray-500">关联案件</p>
                  <p className="font-medium mt-1 text-primary-700">{currentClue.relatedCaseId}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">线索描述</p>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {currentClue.description}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        title="线索升级确认"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEscalateModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleEscalateSubmit} loading={submitLoading}>
              确认升级
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="danger"
            title="重要提示"
            message="此线索已超过48小时未启动调查，根据规定需要自动升级。升级后将推送至分管领导督办。"
          />
          {currentClue && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{currentClue.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <RiskLevelBadge level={currentClue.riskLevel} />
                <span className="text-sm text-red-600">已超期未处理</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Clues
