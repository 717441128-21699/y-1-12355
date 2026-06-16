import { useState, useEffect } from 'react'
import {
  Search,
  Eye,
  Check,
  X,
  FileText,
  User,
  Clock,
  AlertTriangle,
  BookOpen,
  PenTool,
  Download,
  Send,
  FileSignature,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
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
import { CaseStatusBadge, ViolationTypeBadge, RiskLevelBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatMoney } from '@/utils/format'
import { cn } from '@/lib/utils'
import { Case, TrialRecord, CaseStatus, CASE_STAGE_LABELS } from '../../shared/types'
import { trialApi } from '@/api/client'

const Trials = () => {
  const {
    cases,
    trials,
    talks,
    loading,
    fetchCases,
    fetchTrials,
    fetchTalks,
    completeTrial,
    generateDecision,
    pushExecution,
  } = useDataStore()
  const user = useAuthStore((state) => state.user)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [isPushModalOpen, setIsPushModalOpen] = useState(false)
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [currentTrial, setCurrentTrial] = useState<TrialRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const [reviewOpinion, setReviewOpinion] = useState('')
  const [decisionContent, setDecisionContent] = useState('')
  const [punishmentType, setPunishmentType] = useState('warning')
  const [signature, setSignature] = useState('')

  useEffect(() => {
    loadData()
  }, [page, statusFilter])

  const loadData = () => {
    fetchCases()
    fetchTrials()
    fetchTalks()
  }

  const getMyCases = () => {
    if (!user) return []
    return cases.filter(c => {
      if (c.currentStage !== 'trial' && c.currentStage !== 'closed') return false
      if (user.role === 'handler') return c.handlerId === user.id
      if (user.role === 'dept_head') return c.department === user.department
      return true
    })
  }

  const getCaseTrial = (caseId: string) => {
    return trials.find(t => t.caseId === caseId)
  }

  const getCaseTalks = (caseId: string) => {
    return talks.filter(t => t.caseId === caseId)
  }

  const myCases = getMyCases()
  const filteredCases = myCases.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    if (!searchText) return true
    return c.title.toLowerCase().includes(searchText.toLowerCase()) ||
           c.involvedPerson.toLowerCase().includes(searchText.toLowerCase()) ||
           c.caseNumber.toLowerCase().includes(searchText.toLowerCase())
  })

  const paginatedCases = filteredCases.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const handleView = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setCurrentTrial(getCaseTrial(caseItem.id) || null)
    setIsDetailModalOpen(true)
  }

  const handleReview = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setCurrentTrial(getCaseTrial(caseItem.id) || null)
    setReviewOpinion('')
    setIsReviewModalOpen(true)
  }

  const handleGenerateDecision = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setCurrentTrial(getCaseTrial(caseItem.id) || null)
    setPunishmentType('warning')
    setDecisionContent(`
关于给予 ${caseItem.involvedPerson} 同志 ${punishmentTypeLabels[punishmentType]} 的决定

${caseItem.involvedPerson}，男，汉族，19XX年X月出生，XX省XX市人，大学文化程度，19XX年X月参加工作，19XX年X月加入中国共产党。现任${caseItem.involvedDepartment}职务。

经查，${caseItem.involvedPerson} 在担任上述职务期间，${caseItem.description}

上述事实已调查核实，${caseItem.involvedPerson} 对违纪事实供认不讳。

根据《中国共产党纪律处分条例》第XX条第XX款之规定，经XXXX年XX月XX日纪委常委会议研究决定：
给予 ${caseItem.involvedPerson} 同志 ${punishmentTypeLabels[punishmentType]}。

本决定自XXXX年XX月XX日起生效。如不服本决定，可在接到本决定书之日起三十日内，向本委申请复议。

中共XX市纪律检查委员会
XXXX年XX月XX日
    `.trim())
    setIsDecisionModalOpen(true)
  }

  const handleSign = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setCurrentTrial(getCaseTrial(caseItem.id) || null)
    setSignature(user?.name || '')
    setIsSignModalOpen(true)
  }

  const handlePush = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setCurrentTrial(getCaseTrial(caseItem.id) || null)
    setIsPushModalOpen(true)
  }

  const handleReviewSubmit = async () => {
    if (!currentCase || !reviewOpinion) return

    setSubmitLoading(true)
    try {
      const result = await completeTrial(currentCase.id, { reviewOpinion })
      if (result) {
        setIsReviewModalOpen(false)
        setSuccessMessage('审理意见已提交，可生成处分决定书')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleGenerateDecisionSubmit = async () => {
    if (!currentCase || !decisionContent || !punishmentType) return

    setSubmitLoading(true)
    try {
      const result = await generateDecision(currentCase.id, {
        punishmentType,
        content: decisionContent,
      })
      if (result) {
        setIsDecisionModalOpen(false)
        setSuccessMessage('处分决定书已生成，请进行电子签名')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSignSubmit = async () => {
    if (!currentCase || !signature) return

    setSubmitLoading(true)
    try {
      const result = await generateDecision(currentCase.id, { signature })
      if (result) {
        setIsSignModalOpen(false)
        setSuccessMessage('电子签名已完成，可推送执行')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handlePushSubmit = async () => {
    if (!currentCase) return

    setSubmitLoading(true)
    try {
      const result = await pushExecution(currentCase.id)
      if (result) {
        setIsPushModalOpen(false)
        setSuccessMessage('处分决定书已推送至相关部门执行，案件已结案')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const getNextAction = (caseItem: Case) => {
    const trial = getCaseTrial(caseItem.id)
    if (!trial) return { action: 'review', label: '审理' }
    if (!trial.reviewOpinion) return { action: 'review', label: '审理' }
    if (!trial.decisionContent) return { action: 'generate', label: '生成决定书' }
    if (!trial.signature) return { action: 'sign', label: '签名' }
    if (caseItem.status !== 'closed') return { action: 'push', label: '推送执行' }
    return { action: 'view', label: '查看' }
  }

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending_trial', label: '待审理' },
    { value: 'trialing', label: '审理中' },
    { value: 'pending_decision', label: '待决定' },
    { value: 'pending_signature', label: '待签名' },
    { value: 'pending_execution', label: '待执行' },
    { value: 'closed', label: '已结案' },
  ]

  const punishmentOptions = [
    { value: 'warning', label: '警告' },
    { value: 'serious_warning', label: '严重警告' },
    { value: 'remove_party_post', label: '撤销党内职务' },
    { value: 'probation', label: '留党察看' },
    { value: 'expel', label: '开除党籍' },
  ]

  const punishmentTypeLabels: Record<string, string> = {
    warning: '警告',
    serious_warning: '严重警告',
    remove_party_post: '撤销党内职务',
    probation: '留党察看',
    expel: '开除党籍',
  }

  const pendingTrialCount = myCases.filter(c => c.status === 'pending_trial').length
  const trialingCount = myCases.filter(c => c.status === 'trialing').length
  const pendingDecisionCount = myCases.filter(c => c.status === 'pending_decision').length
  const closedCount = myCases.filter(c => c.status === 'closed').length

  const columns: Column<Case>[] = [
    {
      key: 'caseNumber',
      title: '案件编号',
      width: 130,
      render: (record) => (
        <Badge variant="navy" size="sm">{record.caseNumber}</Badge>
      ),
    },
    {
      key: 'title',
      title: '案件名称',
      render: (record) => (
        <div className="max-w-xs">
          <p className="font-medium text-gray-900 truncate" title={record.title}>
            {record.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <ViolationTypeBadge type={record.violationType} />
            <span className="text-xs text-gray-500">{record.involvedPerson}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'involvedDepartment',
      title: '所属单位',
      width: 120,
    },
    {
      key: 'amount',
      title: '涉及金额',
      width: 120,
      align: 'right',
      render: (record) => (
        <span className={record.amount >= 1000000 ? 'text-red-600 font-bold' : ''}>
          {formatMoney(record.amount)}
        </span>
      ),
    },
    {
      key: 'stage',
      title: '当前阶段',
      width: 100,
      render: (record) => (
        <Badge variant="primary" size="sm">
          {CASE_STAGE_LABELS[record.currentStage]}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (record) => <CaseStatusBadge status={record.status} />,
    },
    {
      key: 'progress',
      title: '审理进度',
      width: 150,
      render: (record) => {
        const trial = getCaseTrial(record.id)
        const steps = [
          { key: 'review', label: '审理', done: !!trial?.reviewOpinion },
          { key: 'decision', label: '决定书', done: !!trial?.decisionContent },
          { key: 'sign', label: '签名', done: !!trial?.signature },
          { key: 'execute', label: '执行', done: record.status === 'closed' },
        ]

        return (
          <div className="flex items-center gap-1">
            {steps.map((step, index, arr) => (
              <div key={step.key} className="flex items-center">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                )}>
                  {step.done ? <Check className="h-3 w-3" /> : index + 1}
                </div>
                {index < arr.length - 1 && (
                  <div className={cn(
                    'w-4 h-0.5 mx-0.5',
                    step.done && arr[index + 1].done ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      key: 'createdAt',
      title: '立案时间',
      width: 120,
      render: (record) => formatDate(record.createdAt),
    },
    {
      key: 'actions',
      title: '操作',
      width: 260,
      align: 'center',
      render: (record) => {
        const nextAction = getNextAction(record)

        return (
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleView(record)}>
              <Eye className="h-4 w-4" />
            </Button>
            {nextAction.action === 'review' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReview(record)}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                审理
              </Button>
            )}
            {nextAction.action === 'generate' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleGenerateDecision(record)}
              >
                <FileText className="h-4 w-4 mr-1" />
                生成决定书
              </Button>
            )}
            {nextAction.action === 'sign' && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleSign(record)}
              >
                <PenTool className="h-4 w-4 mr-1" />
                签名
              </Button>
            )}
            {nextAction.action === 'push' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handlePush(record)}
              >
                <Send className="h-4 w-4 mr-1" />
                推送执行
              </Button>
            )}
            {record.status === 'closed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(record)}
              >
                <Download className="h-4 w-4 mr-1" />
                下载决定书
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">审理结案管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            在线阅卷、电子签名、处分决定书生成、推送执行
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="待审理"
          value={pendingTrialCount}
          icon={<BookOpen className="h-5 w-5" />}
          variant="warning"
          subtitle="待在线阅卷"
          className={pendingTrialCount > 0 ? 'animate-pulse-slow' : ''}
        />
        <StatCard
          title="审理中"
          value={trialingCount}
          icon={<FileText className="h-5 w-5" />}
          variant="navy"
          subtitle="撰写审理意见"
        />
        <StatCard
          title="待决定"
          value={pendingDecisionCount}
          icon={<PenTool className="h-5 w-5" />}
          variant="primary"
          subtitle="待生成决定书"
        />
        <StatCard
          title="已结案"
          value={closedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
          subtitle="已推送执行"
        />
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-navy-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary-700" />
          审理结案流程
        </h4>
        <div className="flex items-center justify-between max-w-3xl">
          {[
            { icon: BookOpen, label: '在线阅卷', desc: '查阅全部案卷材料' },
            { icon: FileText, label: '审理意见', desc: '撰写审理报告' },
            { icon: PenTool, label: '处分决定', desc: '生成处分决定书' },
            { icon: FileSignature, label: '电子签名', desc: '加密签名确认' },
            { icon: Send, label: '推送执行', desc: '推送相关部门执行' },
          ].map((item, index, arr) => (
            <div key={item.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="font-medium mt-2 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              {index < arr.length - 1 && (
                <div className="flex items-center mx-2">
                  <div className="w-12 h-1 bg-gray-300 rounded" />
                  <ArrowRight className="h-4 w-4 text-gray-400 -ml-2" />
                </div>
              )}
            </div>
          ))}
        </div>
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
                  placeholder="搜索案件编号、名称、涉案人员..."
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={paginatedCases}
            loading={loading}
            emptyText="暂无审理中案件"
          />
          <div className="px-6 border-t">
            <Pagination
              current={page}
              total={filteredCases.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="案件详情"
        size="xl"
      >
        {currentCase && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentCase.title}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="navy">{currentCase.caseNumber}</Badge>
                <CaseStatusBadge status={currentCase.status} />
                <ViolationTypeBadge type={currentCase.violationType} />
                <Badge variant="primary">{CASE_STAGE_LABELS[currentCase.currentStage]}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
              <div>
                <p className="text-sm text-gray-500">涉案人员</p>
                <p className="font-medium mt-1 flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-400" />
                  {currentCase.involvedPerson}
                </p>
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

            {currentTrial?.reviewOpinion && (
              <div>
                <p className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  审理意见
                </p>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                  {currentTrial.reviewOpinion}
                </div>
              </div>
            )}

            {currentTrial?.decisionContent && (
              <div>
                <p className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  处分决定书
                </p>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 max-h-64 overflow-y-auto">
                  {currentTrial.decisionContent}
                </div>
                {currentTrial.signature && (
                  <div className="mt-3 text-right">
                    <p className="text-sm text-gray-500">电子签名：</p>
                    <p className="font-signature text-xl text-primary-700">
                      {currentTrial.signature}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      签名时间：{formatDate(currentTrial.signedAt || '')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                案卷材料
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-navy-50 rounded-lg p-3 border border-navy-100">
                  <p className="font-medium text-navy-800 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    案件描述
                  </p>
                  <p className="text-sm text-navy-600 mt-1 line-clamp-2">
                    {currentCase.description}
                  </p>
                </div>
                {getCaseTalks(currentCase.id).map(talk => (
                  <div key={talk.id} className="bg-gray-50 rounded-lg p-3 border">
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      {talk.recordingType === 'video' ? (
                        <Badge variant="navy" size="sm">视频</Badge>
                      ) : talk.recordingType === 'audio' ? (
                        <Badge variant="primary" size="sm">音频</Badge>
                      ) : (
                        <Badge variant="default" size="sm">笔录</Badge>
                      )}
                      {talk.type === 'reminder' ? '谈话提醒' : talk.type === 'interrogation' ? '讯问' : '询问'}
                      - {talk.interviewee}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(talk.actualTime || talk.scheduledTime)}
                    </p>
                    {talk.transcript && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {talk.transcript}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="在线审理"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleReviewSubmit} loading={submitLoading}>
              提交审理意见
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentCase && (
            <Alert
              variant="info"
              message={`正在审理案件"${currentCase.title}"（${currentCase.caseNumber}）`}
            />
          )}

          {currentCase && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">案卷摘要</h4>
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">涉案人员：</span>
                  <span className="font-medium">{currentCase.involvedPerson}</span>
                </div>
                <div>
                  <span className="text-gray-500">所属单位：</span>
                  <span>{currentCase.involvedDepartment}</span>
                </div>
                <div>
                  <span className="text-gray-500">违纪类型：</span>
                  <ViolationTypeBadge type={currentCase.violationType} />
                </div>
                <div>
                  <span className="text-gray-500">涉及金额：</span>
                  <span className="text-red-600 font-medium">{formatMoney(currentCase.amount)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {currentCase.description}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">相关材料</h4>
            <div className="space-y-2">
              {currentCase && getCaseTalks(currentCase.id).map((talk, index) => (
                <div key={talk.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-navy-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {talk.type === 'reminder' ? '谈话提醒' : talk.type === 'interrogation' ? '讯问' : '询问'}
                        - {talk.interviewee}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(talk.actualTime || talk.scheduledTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {talk.recordingUrl && (
                      <Badge variant="success">
                        {talk.recordingType === 'video' ? '视频' : '音频'}已上传
                      </Badge>
                    )}
                    {talk.transcript && (
                      <Badge variant="navy">笔录已上传</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="审理意见"
            value={reviewOpinion}
            onChange={(e) => setReviewOpinion(e.target.value)}
            placeholder="请填写详细的审理意见，包括对违纪事实的认定、证据采信情况、适用的党纪法规条款等..."
            rows={6}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title="生成处分决定书"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDecisionModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleGenerateDecisionSubmit} loading={submitLoading}>
              生成决定书
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentCase && (
            <Alert
              variant="info"
              message={`为案件"${currentCase.title}"（${currentCase.caseNumber}）生成处分决定书`}
            />
          )}

          <Select
            label="处分类型"
            value={punishmentType}
            onChange={(e) => {
              setPunishmentType(e.target.value)
              const caseItem = currentCase
              if (caseItem) {
                setDecisionContent(`
关于给予 ${caseItem.involvedPerson} 同志 ${punishmentTypeLabels[e.target.value]} 的决定

${caseItem.involvedPerson}，男，汉族，19XX年X月出生，XX省XX市人，大学文化程度，19XX年X月参加工作，19XX年X月加入中国共产党。现任${caseItem.involvedDepartment}职务。

经查，${caseItem.involvedPerson} 在担任上述职务期间，${caseItem.description}

上述事实已调查核实，${caseItem.involvedPerson} 对违纪事实供认不讳。

根据《中国共产党纪律处分条例》第XX条第XX款之规定，经XXXX年XX月XX日纪委常委会议研究决定：
给予 ${caseItem.involvedPerson} 同志 ${punishmentTypeLabels[e.target.value]}。

本决定自XXXX年XX月XX日起生效。如不服本决定，可在接到本决定书之日起三十日内，向本委申请复议。

中共XX市纪律检查委员会
XXXX年XX月XX日
                `.trim())
              }
            }}
            options={punishmentOptions}
            required
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              以下内容为系统自动生成，请仔细核对并根据实际情况修改。
            </p>
          </div>

          <Textarea
            label="处分决定书内容"
            value={decisionContent}
            onChange={(e) => setDecisionContent(e.target.value)}
            placeholder="请填写或修改处分决定书内容..."
            rows={12}
            required
            className="font-serif text-base"
          />

          <div className="flex justify-end">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              下载预览
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="电子签名"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsSignModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSignSubmit} loading={submitLoading}>
              <FileSignature className="h-4 w-4 mr-1" />
              确认签名
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="info"
            message="电子签名具有法律效力，请确认处分决定书内容无误后再签名。"
          />

          {currentCase && currentTrial?.decisionContent && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm text-gray-700 font-serif">
                {currentTrial.decisionContent}
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
            <p className="text-center text-sm text-gray-500 mb-4">请输入您的姓名进行电子签名</p>
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="请输入签名"
              className="text-center text-2xl font-signature"
              required
            />
            {signature && (
              <p className="text-center mt-4 text-4xl font-signature text-primary-700">
                {signature}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm"
              className="mt-1"
              checked={!!signature}
              onChange={(e) => {}}
            />
            <label htmlFor="confirm" className="text-sm text-gray-600">
              我已仔细阅读并确认处分决定书内容，签名后将作为正式文件具有法律效力。
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        title="推送执行"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsPushModalOpen(false)}>
              取消
            </Button>
            <Button variant="success" onClick={handlePushSubmit} loading={submitLoading}>
              <Send className="h-4 w-4 mr-1" />
              确认推送
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentCase && (
            <Alert
              variant="success"
              message={`将案件"${currentCase.title}"（${currentCase.caseNumber}）的处分决定书推送至相关部门执行`}
            />
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3">推送部门</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>中共XX市委组织部</span>
                </div>
                <Badge variant="success">将同步推送</Badge>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>XX市人力资源和社会保障局</span>
                </div>
                <Badge variant="success">将同步推送</Badge>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>{currentCase?.involvedDepartment}</span>
                </div>
                <Badge variant="success">将同步推送</Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">执行事项</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 处分决定归档至个人档案</li>
              <li>• 按照规定办理职务、工资等调整手续</li>
              <li>• 在一定范围内宣布处分决定</li>
              <li>• 定期向纪委报告处分执行情况</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            推送后案件将正式结案，处分决定书将自动发送至相关部门，请确认无误后推送。
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default Trials
