import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Edit, Trash2, Send, Filter, FileText, User, Building2 } from 'lucide-react'
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
} from '@/components/ui'
import { PetitionStatusBadge, ViolationTypeBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatMoney, truncateText } from '@/utils/format'
import {
  Petition,
  PetitionType,
  PetitionStatus,
  PETITION_TYPE_LABELS,
  DEPARTMENTS,
} from '../../shared/types'
import { petitionApi } from '@/api/client'

const Petitions = () => {
  const { petitions, loading, fetchPetitions, createPetition, updatePetition } = useDataStore()
  const user = useAuthStore((state) => state.user)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [currentPetition, setCurrentPetition] = useState<Petition | null>(null)
  const [formData, setFormData] = useState<Partial<Petition>>({})
  const [assignData, setAssignData] = useState({ assignedTo: '', assignedDepartment: '' })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [page, statusFilter, typeFilter])

  const loadData = () => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.type = typeFilter
    fetchPetitions(params)
  }

  const filteredPetitions = petitions.filter((p) =>
    !searchText ||
    p.title.toLowerCase().includes(searchText.toLowerCase()) ||
    p.involvedPerson.toLowerCase().includes(searchText.toLowerCase()) ||
    p.content.toLowerCase().includes(searchText.toLowerCase())
  )

  const paginatedPetitions = filteredPetitions.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const handleCreate = () => {
    setCurrentPetition(null)
    setFormData({
      title: '',
      content: '',
      type: 'corruption' as PetitionType,
      status: 'pending' as PetitionStatus,
      involvedPerson: '',
      involvedDepartment: '',
      assignedDepartment: user?.department || '',
      informant: '',
      informantContact: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (petition: Petition) => {
    setCurrentPetition(petition)
    setFormData({ ...petition })
    setIsModalOpen(true)
  }

  const handleView = (petition: Petition) => {
    setCurrentPetition(petition)
    setIsDetailModalOpen(true)
  }

  const handleAssign = (petition: Petition) => {
    setCurrentPetition(petition)
    setAssignData({
      assignedTo: petition.assignedTo || '',
      assignedDepartment: petition.assignedDepartment || user?.department || '',
    })
    setIsAssignModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.involvedPerson) {
      return
    }

    setSubmitLoading(true)
    try {
      let result
      if (currentPetition) {
        result = await updatePetition(currentPetition.id, formData)
      } else {
        result = await createPetition(formData)
      }

      if (result) {
        setIsModalOpen(false)
        setSuccessMessage(currentPetition ? '更新成功！' : '创建成功！')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleAssignSubmit = async () => {
    if (!currentPetition || !assignData.assignedDepartment) return

    setSubmitLoading(true)
    try {
      const response = await petitionApi.assign(currentPetition.id, assignData)
      if (response.success) {
        loadData()
        setIsAssignModalOpen(false)
        setSuccessMessage('分配成功！已自动推送至承办部门')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleConvertToClue = async (petition: Petition) => {
    if (!confirm('确定要将此信访举报转为线索吗？')) return

    try {
      const response = await petitionApi.update(petition.id, {
        status: 'converted' as PetitionStatus,
      })
      if (response.success) {
        loadData()
        setSuccessMessage('已成功转为线索，将自动推送至线索研判模块')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('Convert to clue error:', error)
    }
  }

  const columns: Column<Petition>[] = [
    {
      key: 'title',
      title: '举报标题',
      render: (record) => (
        <div className="max-w-xs">
          <p className="font-medium text-gray-900 truncate" title={record.title}>
            {record.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate" title={record.content}>
            {truncateText(record.content, 50)}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      title: '举报类型',
      width: 100,
      render: (record) => (
        <Badge variant={record.type === 'corruption' ? 'danger' : record.type === 'dereliction' ? 'warning' : 'info'} size="sm">
          {PETITION_TYPE_LABELS[record.type]}
        </Badge>
      ),
    },
    {
      key: 'involvedPerson',
      title: '被举报人',
      width: 100,
      render: (record) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-gray-400" />
          <span>{record.involvedPerson}</span>
        </div>
      ),
    },
    {
      key: 'involvedDepartment',
      title: '所属单位',
      width: 150,
      render: (record) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="truncate" title={record.involvedDepartment}>
            {record.involvedDepartment}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '涉及金额',
      width: 120,
      align: 'right',
      render: (record) => (
        <span className={record.amount && record.amount >= 100000 ? 'text-red-600 font-medium' : ''}>
          {formatMoney(record.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 90,
      render: (record) => <PetitionStatusBadge status={record.status} />,
    },
    {
      key: 'assignedDepartment',
      title: '承办部门',
      width: 130,
      render: (record) => (
        <span className="text-sm text-gray-600">{record.assignedDepartment || '-'}</span>
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
      width: 200,
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
          {record.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAssign(record)}
            >
              <Send className="h-4 w-4 mr-1" />
              分配
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleConvertToClue(record)}
            >
              <FileText className="h-4 w-4 mr-1" />
              转线索
            </Button>
          )}
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'assigned', label: '已分配' },
    { value: 'converted', label: '已转线索' },
    { value: 'closed', label: '已办结' },
  ]

  const typeOptions = [
    { value: '', label: '全部类型' },
    ...Object.entries(PETITION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">信访举报管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            接收信访举报，自动分类并推送至对应承办部门
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增举报
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">筛选：</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索标题、被举报人、内容..."
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
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                options={typeOptions}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">待处理</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {petitions.filter(p => p.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">处理中</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {petitions.filter(p => p.status === 'processing').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">已分配</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {petitions.filter(p => p.status === 'assigned').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">已转线索</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {petitions.filter(p => p.status === 'converted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">已办结</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {petitions.filter(p => p.status === 'closed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={paginatedPetitions}
            loading={loading}
            emptyText="暂无信访举报数据"
          />
          <div className="px-6 border-t">
            <Pagination
              current={page}
              total={filteredPetitions.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentPetition ? '编辑信访举报' : '新增信访举报'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={submitLoading}>
              {currentPetition ? '保存修改' : '提交登记'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="举报标题"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入举报标题"
                required
              />
            </div>
            <Select
              label="举报类型"
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PetitionType })}
              options={Object.entries(PETITION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              required
            />
            <Select
              label="当前状态"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PetitionStatus })}
              options={statusOptions.filter(o => o.value !== '')}
              required
            />
            <Input
              label="被举报人姓名"
              value={formData.involvedPerson || ''}
              onChange={(e) => setFormData({ ...formData, involvedPerson: e.target.value })}
              placeholder="请输入被举报人姓名"
              required
            />
            <Input
              label="被举报人单位"
              value={formData.involvedDepartment || ''}
              onChange={(e) => setFormData({ ...formData, involvedDepartment: e.target.value })}
              placeholder="请输入被举报人单位"
              required
            />
            <Input
              label="涉及金额（元）"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="请输入涉及金额"
            />
            <Select
              label="承办部门"
              value={formData.assignedDepartment || ''}
              onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
              required
            />
            <Input
              label="举报人（选填）"
              value={formData.informant || ''}
              onChange={(e) => setFormData({ ...formData, informant: e.target.value })}
              placeholder="可匿名举报"
            />
            <Input
              label="举报人联系方式（选填）"
              value={formData.informantContact || ''}
              onChange={(e) => setFormData({ ...formData, informantContact: e.target.value })}
              placeholder="便于核实情况"
            />
          </div>
          <Textarea
            label="举报内容"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="请详细描述举报内容..."
            rows={6}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="信访举报详情"
        size="lg"
      >
        {currentPetition && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentPetition.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <PetitionStatusBadge status={currentPetition.status} />
                  <Badge variant={currentPetition.type === 'corruption' ? 'danger' : 'info'}>
                    {PETITION_TYPE_LABELS[currentPetition.type]}
                  </Badge>
                </div>
              </div>
              {currentPetition.amount && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">涉及金额</p>
                  <p className="text-xl font-bold text-red-600">{formatMoney(currentPetition.amount)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <p className="text-sm text-gray-500">被举报人</p>
                <p className="font-medium mt-1">{currentPetition.involvedPerson}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">所属单位</p>
                <p className="font-medium mt-1">{currentPetition.involvedDepartment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">承办部门</p>
                <p className="font-medium mt-1">{currentPetition.assignedDepartment || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">登记时间</p>
                <p className="font-medium mt-1">{formatDate(currentPetition.createdAt)}</p>
              </div>
              {currentPetition.informant && (
                <div>
                  <p className="text-sm text-gray-500">举报人</p>
                  <p className="font-medium mt-1">{currentPetition.informant}</p>
                </div>
              )}
              {currentPetition.informantContact && (
                <div>
                  <p className="text-sm text-gray-500">联系方式</p>
                  <p className="font-medium mt-1">{currentPetition.informantContact}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">举报内容</p>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {currentPetition.content}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="分配承办部门"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAssignSubmit} loading={submitLoading}>
              确认分配
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="info"
            message="分配后系统将自动通知承办部门，并根据举报类型自动分类推送。"
          />
          <Select
            label="承办部门"
            value={assignData.assignedDepartment}
            onChange={(e) => setAssignData({ ...assignData, assignedDepartment: e.target.value })}
            options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
            required
          />
          <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
            <p className="font-medium text-yellow-800 mb-1">自动分类规则：</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>贪污贿赂类 → 第一纪检监察室</li>
              <li>失职渎职类 → 第二纪检监察室</li>
              <li>作风问题类 → 党风政风监督室</li>
              <li>其他问题类 → 根据涉及单位分配</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Petitions
