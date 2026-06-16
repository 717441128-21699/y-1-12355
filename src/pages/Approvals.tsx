import { useState, useEffect } from 'react'
import { Search, Eye, Check, X, Clock, AlertTriangle, User, FileText, ArrowRight, Zap } from 'lucide-react'
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
import { CaseStatusBadge, ApprovalResultBadge, ViolationTypeBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatMoney, getTimeRemaining } from '@/utils/format'
import { cn } from '@/lib/utils'
import {
  Case,
  ApprovalRecord,
  ApprovalStage,
  VIOLATION_TYPE_LABELS,
  APPROVAL_STAGE_LABELS,
} from '../../shared/types'

const Approvals = () => {
  const { approvals, cases, loading, fetchApprovals, fetchCases, approveApproval, rejectApproval } = useDataStore()
  const user = useAuthStore((state) => state.user)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [currentApproval, setCurrentApproval] = useState<ApprovalRecord | null>(null)
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [opinion, setOpinion] = useState('')
  const [signature, setSignature] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [page, stageFilter])

  const loadData = () => {
    fetchApprovals()
    fetchCases()
  }

  const getApprovalCase = (approval: ApprovalRecord) => {
    return cases.find(c => c.id === approval.caseId)
  }

  const getMyApprovals = () => {
    if (!user) return []
    return approvals.filter(a => {
      if (a.result !== 'pending') return false
      if (user.role === 'dept_head' && a.stage === 'department') return true
      if (user.role === 'case_office' && a.stage === 'case_office') return true
      if (user.role === 'leader' && a.stage === 'leader') return true
      if (user.role === 'case_office') return true
      return false
    })
  }

  const myApprovals = getMyApprovals()
  const filteredApprovals = myApprovals.filter(a => {
    if (!searchText) return true
    const caseInfo = getApprovalCase(a)
    if (!caseInfo) return false
    return caseInfo.title.toLowerCase().includes(searchText.toLowerCase()) ||
           caseInfo.involvedPerson.toLowerCase().includes(searchText.toLowerCase())
  })

  const paginatedApprovals = filteredApprovals.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const handleView = (approval: ApprovalRecord) => {
    setCurrentApproval(approval)
    setCurrentCase(getApprovalCase(approval) || null)
    setIsDetailModalOpen(true)
  }

  const handleApprove = (approval: ApprovalRecord) => {
    setCurrentApproval(approval)
    setCurrentCase(getApprovalCase(approval) || null)
    setOpinion('')
    setSignature(user?.name || '')
    setIsApproveModalOpen(true)
  }

  const handleReject = (approval: ApprovalRecord) => {
    setCurrentApproval(approval)
    setCurrentCase(getApprovalCase(approval) || null)
    setOpinion('')
    setSignature(user?.name || '')
    setIsRejectModalOpen(true)
  }

  const handleApproveSubmit = async () => {
    if (!currentApproval || !opinion || !signature) return

    setSubmitLoading(true)
    try {
      const result = await approveApproval(currentApproval.id, { opinion, signature })
      if (result) {
        setIsApproveModalOpen(false)
        const nextStage = currentApproval.stage === 'department' ? '案管室' :
                        currentApproval.stage === 'case_office' ? '分管领导' : null
        setSuccessMessage(
          nextStage
            ? `审批通过！已自动流转至${nextStage}审批`
            : '审批通过！已完成全部审批流程，案件进入审查阶段'
        )
        loadData()
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!currentApproval || !opinion || !signature) return

    setSubmitLoading(true)
    try {
      const result = await rejectApproval(currentApproval.id, { opinion, signature })
      if (result) {
        setIsRejectModalOpen(false)
        setSuccessMessage('已驳回，审批流程终止')
        loadData()
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const getNextStage = (stage: ApprovalStage): ApprovalStage | null => {
    if (stage === 'department') return 'case_office'
    if (stage === 'case_office') return 'leader'
    return null
  }

  const getCurrentStageIndex = (stage: ApprovalStage) => {
    return ['department', 'case_office', 'leader'].indexOf(stage)
  }

  const columns: Column<ApprovalRecord>[] = [
    {
      key: 'caseInfo',
      title: '案件信息',
      render: (record) => {
        const caseInfo = getApprovalCase(record)
        if (!caseInfo) return <span className="text-gray-400">-</span>
        return (
          <div className="max-w-xs">
            <p className="font-medium text-gray-900 truncate" title={caseInfo.title}>
              {caseInfo.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <ViolationTypeBadge type={caseInfo.violationType} />
              <span className="text-xs text-gray-500">{caseInfo.caseNumber}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'stage',
      title: '审批阶段',
      width: 120,
      render: (record) => (
        <div className="flex flex-col gap-1">
          <Badge variant="navy" size="sm">
            {APPROVAL_STAGE_LABELS[record.stage]}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getCurrentStageIndex(record.stage) + 1} / 3 级
          </div>
        </div>
      ),
    },
    {
      key: 'involvedPerson',
      title: '涉案人员',
      width: 100,
      render: (record) => {
        const caseInfo = getApprovalCase(record)
        if (!caseInfo) return <span className="text-gray-400">-</span>
        return (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-gray-400" />
            <span>{caseInfo.involvedPerson}</span>
          </div>
        )
      },
    },
    {
      key: 'amount',
      title: '涉及金额',
      width: 120,
      align: 'right',
      render: (record) => {
        const caseInfo = getApprovalCase(record)
        if (!caseInfo?.amount) return <span className="text-gray-400">-</span>
        return (
          <span className={caseInfo.amount >= 1000000 ? 'text-red-600 font-bold' : ''}>
            {formatMoney(caseInfo.amount)}
          </span>
        )
      },
    },
    {
      key: 'deadline',
      title: '剩余时限',
      width: 130,
      align: 'center',
      render: (record) => {
        if (record.result !== 'pending') {
          return <span className="text-gray-400">-</span>
        }
        const remaining = getTimeRemaining(record.deadline)
        if (remaining.isOverdue) {
          return (
            <div className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <span>已超时</span>
            </div>
          )
        }
        return (
          <div className={cn(
            'flex items-center gap-1',
            remaining.hours < 12 ? 'text-orange-600' : 'text-gray-600'
          )}>
            <Clock className="h-4 w-4" />
            <span>{remaining.hours}小时{remaining.minutes}分</span>
          </div>
        )
      },
    },
    {
      key: 'isOverdue',
      title: '状态',
      width: 90,
      render: (record) => {
        if (record.isOverdue && record.result === 'pending') {
          return (
            <Badge variant="danger" size="sm" className="animate-pulse">
              超时
            </Badge>
          )
        }
        return <ApprovalResultBadge result={record.result} />
      },
    },
    {
      key: 'createdAt',
      title: '申请时间',
      width: 150,
      render: (record) => (
        <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      align: 'center',
      render: (record) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleView(record)}>
            <Eye className="h-4 w-4" />
          </Button>
          {record.result === 'pending' && !record.isOverdue && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(record)}
              >
                <Check className="h-4 w-4 mr-1" />
                通过
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReject(record)}
              >
                <X className="h-4 w-4 mr-1" />
                驳回
              </Button>
            </>
          )}
          {record.result === 'pending' && record.isOverdue && (
            <Badge variant="warning" size="sm">
              已自动越级
            </Badge>
          )}
        </div>
      ),
    },
  ]

  const stageOptions = [
    { value: '', label: '全部阶段' },
    { value: 'department', label: '承办部门' },
    { value: 'case_office', label: '案管室' },
    { value: 'leader', label: '分管领导' },
  ]

  const pendingCount = myApprovals.filter(a => a.result === 'pending').length
  const overdueCount = myApprovals.filter(a => a.isOverdue && a.result === 'pending').length
  const approvedCount = approvals.filter(a => a.result === 'approved').length
  const escalatedCount = approvals.filter(a => a.result === 'escalated').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">立案审批管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            三级审批流程，每级限时24小时，超时自动越级
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      {overdueCount > 0 && (
        <Alert
          variant="danger"
          title="超时预警"
          message={`有 ${overdueCount} 项审批已超时，系统将自动越级流转！`}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="待我审批"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle="24小时限时办理"
          className={pendingCount > 0 ? 'animate-pulse-slow' : ''}
        />
        <StatCard
          title="已超时"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          subtitle="将自动越级"
          className={overdueCount > 0 ? 'animate-pulse-slow' : ''}
        />
        <StatCard
          title="已通过"
          value={approvedCount}
          icon={<Check className="h-5 w-5" />}
          variant="success"
          subtitle="审批完成"
        />
        <StatCard
          title="自动越级"
          value={escalatedCount}
          icon={<Zap className="h-5 w-5" />}
          variant="navy"
          subtitle="超时自动流转"
        />
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-navy-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary-700" />
          三级审批流程
        </h4>
        <div className="flex items-center justify-between max-w-2xl">
          {[
            { stage: 'department', label: '承办部门', desc: '24小时内审批' },
            { stage: 'case_office', label: '案管室', desc: '24小时内审核' },
            { stage: 'leader', label: '分管领导', desc: '24小时内批准' },
          ].map((item, index, arr) => (
            <div key={item.stage} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white font-bold">
                  {index + 1}
                </div>
                <p className="font-medium mt-2">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              {index < arr.length - 1 && (
                <div className="flex items-center mx-4">
                  <div className="w-16 h-1 bg-gray-300 rounded" />
                  <ArrowRight className="h-4 w-4 text-gray-400 -ml-2" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          注：每级审批限时24小时，超时未处理将自动越级流转至下一级
        </p>
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
                  placeholder="搜索案件标题、涉案人员..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={stageFilter}
                onChange={(e) => { setStageFilter(e.target.value); setPage(1) }}
                options={stageOptions}
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
            data={paginatedApprovals}
            loading={loading}
            emptyText="暂无待审批事项"
          />
          <div className="px-6 border-t">
            <Pagination
              current={page}
              total={filteredApprovals.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="审批详情"
        size="lg"
      >
        {currentCase && currentApproval && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentCase.title}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="navy">{currentCase.caseNumber}</Badge>
                <CaseStatusBadge status={currentCase.status} />
                <ViolationTypeBadge type={currentCase.violationType} />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium mb-2">审批流程进度</p>
              <div className="space-y-3">
                {currentCase.approvalHistory.map((record, index) => (
                  <div key={record.id} className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                      record.result === 'approved' ? 'bg-green-100 text-green-600' :
                      record.result === 'rejected' ? 'bg-red-100 text-red-600' :
                      record.result === 'escalated' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {record.result === 'approved' ? <Check className="h-4 w-4" /> :
                       record.result === 'rejected' ? <X className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{APPROVAL_STAGE_LABELS[record.stage]}</span>
                        <ApprovalResultBadge result={record.result} />
                      </div>
                      {record.result !== 'pending' && (
                        <>
                          <p className="text-sm text-gray-600 mt-1">
                            {record.approver} · {formatDate(record.createdAt)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">意见：{record.opinion}</p>
                        </>
                      )}
                      {record.result === 'pending' && (
                        <p className="text-sm text-gray-500 mt-1">
                          截止时间：{formatDate(record.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <p className="text-sm text-gray-500">涉案人员</p>
                <p className="font-medium mt-1">{currentCase.involvedPerson}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">所属单位</p>
                <p className="font-medium mt-1">{currentCase.involvedDepartment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">涉及金额</p>
                <p className="font-medium mt-1 text-red-600">{formatMoney(currentCase.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">立案时间</p>
                <p className="font-medium mt-1">{formatDate(currentCase.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">案件描述</p>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {currentCase.description}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="审批通过"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsApproveModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleApproveSubmit} loading={submitLoading}>
              确认通过
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentCase && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800">{currentCase.title}</p>
              <p className="text-sm text-green-700 mt-1">
                {currentCase.caseNumber} · {currentCase.involvedPerson}
              </p>
            </div>
          )}
          <Alert
            variant="info"
            message={
              getNextStage(currentApproval?.stage || 'department')
                ? `通过后将自动流转至${APPROVAL_STAGE_LABELS[getNextStage(currentApproval?.stage || 'department') as ApprovalStage]}审批`
                : '通过后将完成全部审批流程，案件进入审查阶段'
            }
          />
          <Textarea
            label="审批意见"
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            placeholder="请填写审批意见..."
            rows={4}
            required
          />
          <Input
            label="电子签名"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="请输入签名"
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="审批驳回"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleRejectSubmit} loading={submitLoading}>
              确认驳回
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentCase && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800">{currentCase.title}</p>
              <p className="text-sm text-red-700 mt-1">
                {currentCase.caseNumber} · {currentCase.involvedPerson}
              </p>
            </div>
          )}
          <Alert
            variant="danger"
            message="驳回后审批流程将终止，案件将退回申请部门。"
          />
          <Textarea
            label="驳回理由"
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            placeholder="请填写驳回理由..."
            rows={4}
            required
          />
          <Input
            label="电子签名"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="请输入签名"
            required
          />
        </div>
      </Modal>
    </div>
  )
}

export default Approvals
