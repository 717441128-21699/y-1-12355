import { useState, useEffect } from 'react'
import {
  Search,
  Eye,
  Plus,
  Video,
  Mic,
  FileText,
  Clock,
  AlertTriangle,
  User,
  Check,
  Send,
  Upload,
  MessageSquare,
  Play,
  Download,
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
import { CaseStatusBadge, TalkStatusBadge, ViolationTypeBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatMoney, getTimeRemaining } from '@/utils/format'
import { cn } from '@/lib/utils'
import { Case, TalkRecord, CASE_STAGE_LABELS } from '../../shared/types'

const Cases = () => {
  const {
    cases,
    talks,
    loading,
    fetchCases,
    fetchTalks,
    createTalk,
    updateTalk,
    submitCaseForTrial,
  } = useDataStore()
  const user = useAuthStore((state) => state.user)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isTalkModalOpen, setIsTalkModalOpen] = useState(false)
  const [isTalkDetailModalOpen, setIsTalkDetailModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [currentCase, setCurrentCase] = useState<Case | null>(null)
  const [currentTalk, setCurrentTalk] = useState<TalkRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const [talkForm, setTalkForm] = useState({
    type: 'reminder',
    interviewee: '',
    scheduledTime: '',
    location: '',
    content: '',
  })

  const [recordFile, setRecordFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [uploadType, setUploadType] = useState<'video' | 'audio'>('video')

  useEffect(() => {
    loadData()
  }, [page, statusFilter])

  const loadData = () => {
    fetchCases()
    fetchTalks()
  }

  const getMyCases = () => {
    if (!user) return []
    return cases.filter(c => {
      if (c.currentStage !== 'investigation') return false
      if (user.role === 'handler') return c.handlerId === user.id
      if (user.role === 'dept_head') return c.department === user.department
      return true
    })
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
    setIsDetailModalOpen(true)
  }

  const handleAddTalk = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setTalkForm({
      type: 'reminder',
      interviewee: caseItem.involvedPerson,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      location: '谈话室1号',
      content: `关于"${caseItem.title}"案件的谈话提醒`,
    })
    setIsTalkModalOpen(true)
  }

  const handleViewTalk = (talk: TalkRecord) => {
    setCurrentTalk(talk)
    setCurrentCase(cases.find(c => c.id === talk.caseId) || null)
    setIsTalkDetailModalOpen(true)
  }

  const handleUpload = (talk: TalkRecord) => {
    setCurrentTalk(talk)
    setCurrentCase(cases.find(c => c.id === talk.caseId) || null)
    setTranscript('')
    setRecordFile(null)
    setIsUploadModalOpen(true)
  }

  const handleSubmitTalk = async () => {
    if (!currentCase || !talkForm.scheduledTime || !talkForm.location) return

    setSubmitLoading(true)
    try {
      const result = await createTalk({
        caseId: currentCase.id,
        type: talkForm.type as any,
        interviewee: talkForm.interviewee,
        scheduledTime: talkForm.scheduledTime,
        location: talkForm.location,
        content: talkForm.content,
        startTime: talkForm.scheduledTime,
        recorder: user?.id || '',
      })
      if (result) {
        setIsTalkModalOpen(false)
        setSuccessMessage('谈话提醒已生成，将自动通知相关人员')
        loadData()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCompleteTalk = async (talk: TalkRecord) => {
    setSubmitLoading(true)
    try {
      const result = await updateTalk(talk.id, { 
        status: 'completed',
        actualTime: new Date().toISOString(),
      })
      if (result) {
        setSuccessMessage('谈话已完成，可上传录音录像资料')
        loadData()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUploadSubmit = async () => {
    if (!currentTalk || !transcript) return

    setSubmitLoading(true)
    try {
      const result = await updateTalk(currentTalk.id, {
        transcript,
        recordingUrl: recordFile ? `/uploads/${recordFile.name}` : currentTalk.recordingUrl,
        recordingType: uploadType,
      })
      if (result) {
        setIsUploadModalOpen(false)
        setSuccessMessage('录音录像已上传并与笔录关联')
        loadData()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSubmitForTrial = (caseItem: Case) => {
    setCurrentCase(caseItem)
    setIsSubmitModalOpen(true)
  }

  const handleSubmitForTrialConfirm = async () => {
    if (!currentCase) return

    setSubmitLoading(true)
    try {
      const result = await submitCaseForTrial(currentCase.id)
      if (result) {
        setIsSubmitModalOpen(false)
        setSuccessMessage('案件已提交审理，流转至审理阶段')
        loadData()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const canSubmitForTrial = (caseItem: Case) => {
    const caseTalks = getCaseTalks(caseItem.id)
    return caseTalks.length > 0 && caseTalks.every(t => t.status === 'completed' && t.transcript)
  }

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'investigating', label: '调查中' },
    { value: 'reviewing', label: '审查中' },
    { value: 'pending_trial', label: '待审理' },
  ]

  const talkTypeOptions = [
    { value: 'reminder', label: '谈话提醒' },
    { value: 'interrogation', label: '讯问' },
    { value: 'inquiry', label: '询问' },
  ]

  const investigatingCount = myCases.filter(c => c.status === 'investigating').length
  const pendingTalkCount = talks.filter(t => t.status === 'pending' && t.caseId &&
    myCases.some(c => c.id === t.caseId)).length
  const overdueTalkCount = talks.filter(t => t.isOverdue && t.status === 'pending' &&
    myCases.some(c => c.id === t.caseId)).length
  const completedTalkCount = talks.filter(t => t.status === 'completed' &&
    myCases.some(c => c.id === t.caseId)).length

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
      key: 'status',
      title: '状态',
      width: 100,
      render: (record) => <CaseStatusBadge status={record.status} />,
    },
    {
      key: 'talks',
      title: '谈话记录',
      width: 120,
      align: 'center',
      render: (record) => {
        const caseTalks = getCaseTalks(record.id)
        const completed = caseTalks.filter(t => t.status === 'completed').length
        const pending = caseTalks.filter(t => t.status === 'pending').length
        const overdue = caseTalks.filter(t => t.isOverdue && t.status === 'pending').length

        return (
          <div className="flex items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-600">{completed}完成</span>
              {pending > 0 && <span className="text-blue-600">{pending}待谈</span>}
              {overdue > 0 && (
                <span className="text-red-600 flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  {overdue}超期
                </span>
              )}
            </div>
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
        const caseTalks = getCaseTalks(record.id)
        const hasOverdueTalk = caseTalks.some(t => t.isOverdue && t.status === 'pending')

        return (
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleView(record)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAddTalk(record)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              谈话
            </Button>
            {caseTalks.some(t => t.status === 'completed' && !t.transcript) && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleUpload(caseTalks.find(t => t.status === 'completed' && !t.transcript)!)}
              >
                <Upload className="h-4 w-4 mr-1" />
                上传
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmitForTrial(record)}
              disabled={!canSubmitForTrial(record)}
              title={!canSubmitForTrial(record) ? '请完成所有谈话并上传笔录' : ''}
            >
              <Send className="h-4 w-4 mr-1" />
              送审
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">案件审查管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            谈话提醒、同步录音录像、笔录关联、超期预警
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      {overdueTalkCount > 0 && (
        <Alert
          variant="danger"
          title="超期预警"
          message={`有 ${overdueTalkCount} 项谈话已超期，请尽快处理！`}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="审查中案件"
          value={investigatingCount}
          icon={<FileText className="h-5 w-5" />}
          variant="navy"
          subtitle="正在调查"
        />
        <StatCard
          title="待谈话"
          value={pendingTalkCount}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle="限时办理"
          className={pendingTalkCount > 0 ? 'animate-pulse-slow' : ''}
        />
        <StatCard
          title="超期谈话"
          value={overdueTalkCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          subtitle="红色预警"
          className={overdueTalkCount > 0 ? 'animate-pulse-slow' : ''}
        />
        <StatCard
          title="已完成谈话"
          value={completedTalkCount}
          icon={<Check className="h-5 w-5" />}
          variant="success"
          subtitle="笔录齐全"
        />
      </div>

      <div className="bg-gradient-to-r from-navy-50 to-primary-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
          <Video className="h-4 w-4 text-navy-700" />
          审查流程规范
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="font-medium">1. 生成谈话</span>
            </div>
            <p className="text-xs text-gray-500">系统自动生成谈话提醒，明确谈话对象、时间、地点</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Video className="h-4 w-4" />
              </div>
              <span className="font-medium">2. 同步录音录像</span>
            </div>
            <p className="text-xs text-gray-500">谈话全过程同步录音录像，保障程序合法性</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium">3. 笔录关联</span>
            </div>
            <p className="text-xs text-gray-500">上传谈话笔录，与录音录像自动关联归档</p>
          </div>
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
            emptyText="暂无审查中案件"
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

            <div>
              <p className="text-sm text-gray-500 mb-2">案件描述</p>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {currentCase.description}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  谈话记录
                </p>
                <Button size="sm" variant="primary" onClick={() => handleAddTalk(currentCase)}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增谈话
                </Button>
              </div>
              <div className="space-y-3">
                {getCaseTalks(currentCase.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    暂无谈话记录
                  </div>
                ) : (
                  getCaseTalks(currentCase.id).map(talk => (
                    <div key={talk.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{talk.type === 'reminder' ? '谈话提醒' : talk.type === 'interrogation' ? '讯问' : '询问'}</span>
                            <TalkStatusBadge status={talk.status} />
                            {talk.isOverdue && talk.status === 'pending' && (
                              <Badge variant="danger" size="sm" className="animate-pulse">超期</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">被谈话人：</span>
                              <span>{talk.interviewee}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">地点：</span>
                              <span>{talk.location}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">计划时间：</span>
                              <span>{formatDate(talk.scheduledTime)}</span>
                            </div>
                            {talk.actualTime && (
                              <div>
                                <span className="text-gray-500">实际时间：</span>
                                <span>{formatDate(talk.actualTime)}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">内容：</span>
                            <span className="text-gray-700">{talk.content}</span>
                          </div>
                          {talk.transcript && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">笔录：</span>
                              <span className="text-gray-700 line-clamp-2">{talk.transcript}</span>
                            </div>
                          )}
                          {talk.recordingUrl && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">录音录像：</span>
                              <span className="text-navy-600 flex items-center gap-1">
                                {talk.recordingType === 'video' ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                已上传
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-4">
                          {talk.status === 'pending' && (
                            <Button size="sm" variant="primary" onClick={() => handleCompleteTalk(talk)}>
                              <Check className="h-4 w-4 mr-1" />
                              完成
                            </Button>
                          )}
                          {talk.status === 'completed' && !talk.transcript && (
                            <Button size="sm" variant="warning" onClick={() => handleUpload(talk)}>
                              <Upload className="h-4 w-4 mr-1" />
                              上传
                            </Button>
                          )}
                          {talk.recordingUrl && (
                            <Button size="sm" variant="ghost" onClick={() => handleViewTalk(talk)}>
                              <Eye className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isTalkModalOpen}
        onClose={() => setIsTalkModalOpen(false)}
        title="新增谈话"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsTalkModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitTalk} loading={submitLoading}>
              生成谈话
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentCase && (
            <Alert
              variant="info"
              message={`为案件"${currentCase.title}"（${currentCase.caseNumber}）生成谈话`}
            />
          )}
          <Select
            label="谈话类型"
            value={talkForm.type}
            onChange={(e) => setTalkForm({ ...talkForm, type: e.target.value })}
            options={talkTypeOptions}
            required
          />
          <Input
            label="被谈话人"
            value={talkForm.interviewee}
            onChange={(e) => setTalkForm({ ...talkForm, interviewee: e.target.value })}
            placeholder="请输入被谈话人姓名"
            required
          />
          <Input
            label="计划谈话时间"
            type="datetime-local"
            value={talkForm.scheduledTime}
            onChange={(e) => setTalkForm({ ...talkForm, scheduledTime: e.target.value })}
            required
          />
          <Input
            label="谈话地点"
            value={talkForm.location}
            onChange={(e) => setTalkForm({ ...talkForm, location: e.target.value })}
            placeholder="请输入谈话地点"
            required
          />
          <Textarea
            label="谈话内容"
            value={talkForm.content}
            onChange={(e) => setTalkForm({ ...talkForm, content: e.target.value })}
            placeholder="请输入谈话内容要点"
            rows={4}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="上传录音录像"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUploadSubmit} loading={submitLoading}>
              上传并关联
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {currentTalk && (
            <Alert
              variant="info"
              message={`为"${currentTalk.interviewee}"的谈话上传录音录像资料`}
            />
          )}
          <div className="flex gap-2">
            <Button
              variant={uploadType === 'video' ? 'primary' : 'outline'}
              onClick={() => setUploadType('video')}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              视频
            </Button>
            <Button
              variant={uploadType === 'audio' ? 'primary' : 'outline'}
              onClick={() => setUploadType('audio')}
              className="flex-1"
            >
              <Mic className="h-4 w-4 mr-2" />
              音频
            </Button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
            <input
              type="file"
              accept={uploadType === 'video' ? 'video/*' : 'audio/*'}
              className="hidden"
              id="record-file"
              onChange={(e) => setRecordFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="record-file" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">
                {recordFile ? recordFile.name : `点击上传${uploadType === 'video' ? '视频' : '音频'}文件`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {uploadType === 'video' ? '支持 MP4, MOV, AVI 格式' : '支持 MP3, WAV, AAC 格式'}
              </p>
            </label>
          </div>
          <Textarea
            label="谈话笔录"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="请输入或粘贴谈话笔录内容，将与录音录像自动关联..."
            rows={6}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isTalkDetailModalOpen}
        onClose={() => setIsTalkDetailModalOpen(false)}
        title="谈话详情"
        size="lg"
      >
        {currentTalk && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">
                  {currentTalk.type === 'reminder' ? '谈话提醒' : currentTalk.type === 'interrogation' ? '讯问' : '询问'}
                </span>
                <TalkStatusBadge status={currentTalk.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">被谈话人：</span>
                  <span className="font-medium">{currentTalk.interviewee}</span>
                </div>
                <div>
                  <span className="text-gray-500">谈话人：</span>
                  <span className="font-medium">{currentTalk.interviewer || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">地点：</span>
                  <span>{currentTalk.location}</span>
                </div>
                <div>
                  <span className="text-gray-500">时间：</span>
                  <span>{formatDate(currentTalk.actualTime || currentTalk.scheduledTime)}</span>
                </div>
              </div>
            </div>

            {currentTalk.recordingUrl && (
              <div className="bg-dark-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white">
                    {currentTalk.recordingType === 'video' ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    <span className="font-medium">
                      {currentTalk.recordingType === 'video' ? '谈话视频' : '谈话录音'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                      <Play className="h-4 w-4 mr-1" />
                      播放
                    </Button>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                      <Download className="h-4 w-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
                <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                  <Video className="h-16 w-16" />
                </div>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">谈话要点</p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                {currentTalk.content}
              </div>
            </div>

            {currentTalk.transcript && (
              <div>
                <p className="font-medium mb-2">谈话笔录</p>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 max-h-64 overflow-y-auto">
                  {currentTalk.transcript}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="提交审理"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitForTrialConfirm} loading={submitLoading}>
              确认提交
            </Button>
          </>
        }
      >
        {currentCase && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message={`将案件"${currentCase.title}"（${currentCase.caseNumber}）提交至审理阶段`}
            />
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">提交条件已满足</p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• 已完成 {getCaseTalks(currentCase.id).filter(t => t.status === 'completed').length} 次谈话</li>
                    <li>• 所有谈话笔录已上传</li>
                    <li>• 录音录像资料已关联归档</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              提交后案件将流转至审理阶段，由审理部门进行审理。请确认资料完整无误。
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Cases
