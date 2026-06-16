import { useState, useEffect } from 'react'
import {
  Download,
  Filter,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  PieChart,
} from 'lucide-react'
import {
  Card,
  CardContent,
  Table,
  Column,
  Button,
  Input,
  Select,
  Pagination,
  Badge,
  Alert,
  StatCard,
} from '@/components/ui'
import { CaseStatusBadge, ViolationTypeBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { formatDate, formatMoney } from '@/utils/format'
import { Case, Petition, Clue, VIOLATION_TYPE_LABELS } from '../../shared/types'

const Reports = () => {
  const { petitions, clues, cases, loading, exportMonthlyReport, getDashboardStats } = useDataStore()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [violationFilter, setViolationFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState<'cases' | 'petitions' | 'clues'>('cases')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [page, violationFilter, departmentFilter, startDate, endDate, reportType])

  const loadData = () => {
    const result = getDashboardStats()
    setStats(result)
  }

  const handleExport = async () => {
    setSubmitLoading(true)
    try {
      const result = await exportMonthlyReport({
        violationType: violationFilter,
        department: departmentFilter,
        startDate,
        endDate,
      })
      if (result) {
        setSuccessMessage('月度分析报告导出成功！')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const filterData = <T extends { createdAt?: string; violationType?: string; department?: string }>(
    data: T[]
  ): T[] => {
    return data.filter(item => {
      if (violationFilter && item.violationType !== violationFilter) return false
      if (departmentFilter && item.department !== departmentFilter) return false
      if (startDate && item.createdAt && new Date(item.createdAt) < new Date(startDate)) return false
      if (endDate && item.createdAt && new Date(item.createdAt) > new Date(endDate)) return false
      return true
    })
  }

  const getFilteredCases = () => filterData(cases)
  const getFilteredPetitions = () => filterData(petitions)
  const getFilteredClues = () => filterData(clues)

  const getCurrentData = () => {
    switch (reportType) {
      case 'petitions':
        return getFilteredPetitions()
      case 'clues':
        return getFilteredClues()
      case 'cases':
      default:
        return getFilteredCases()
    }
  }

  const currentData = getCurrentData()
  const paginatedData = currentData.slice((page - 1) * pageSize, page * pageSize)

  const violationOptions = [
    { value: '', label: '全部违纪类型' },
    ...Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ]

  const departmentOptions = [
    { value: '', label: '全部部门' },
    { value: '第一纪检监察室', label: '第一纪检监察室' },
    { value: '第二纪检监察室', label: '第二纪检监察室' },
    { value: '第三纪检监察室', label: '第三纪检监察室' },
    { value: '案件审理室', label: '案件审理室' },
    { value: '信访室', label: '信访室' },
    { value: '案件监督管理室', label: '案件监督管理室' },
  ]

  const caseColumns: Column<Case>[] = [
    {
      key: 'caseNumber',
      title: '案件编号',
      width: 130,
      render: (record) => <Badge variant="navy" size="sm">{record.caseNumber}</Badge>,
    },
    {
      key: 'title',
      title: '案件名称',
      render: (record) => (
        <div className="max-w-xs">
          <p className="font-medium text-gray-900 truncate">{record.title}</p>
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
      key: 'currentStage',
      title: '当前阶段',
      width: 100,
      render: (record) => (
        <Badge variant="primary" size="sm">
          {{
            petition: '信访',
            clue: '线索',
            approval: '审批',
            investigation: '审查',
            trial: '审理',
            closed: '结案',
          }[record.currentStage] || record.currentStage}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: '立案时间',
      width: 120,
      render: (record) => formatDate(record.createdAt),
    },
  ]

  const petitionColumns: Column<Petition>[] = [
    { key: 'title', title: '举报标题', width: 200 },
    { key: 'petitioner', title: '举报人', width: 100 },
    { key: 'involvedPerson', title: '被举报人', width: 100 },
    { key: 'involvedDepartment', title: '所属单位', width: 120 },
    { key: 'amount', title: '涉及金额', width: 120, align: 'right', render: (r) => formatMoney(r.amount) },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (r) => (
        <Badge variant={r.status === 'resolved' ? 'success' : r.status === 'processing' ? 'warning' : 'default'} size="sm">
          {{ pending: '待处理', processing: '处理中', assigned: '已分配', converted: '已转线索', resolved: '已办结' }[r.status] || r.status}
        </Badge>
      ),
    },
    { key: 'createdAt', title: '登记时间', width: 120, render: (r) => formatDate(r.createdAt) },
  ]

  const clueColumns: Column<Clue>[] = [
    {
      key: 'riskLevel',
      title: '风险等级',
      width: 100,
      align: 'center',
      render: (r) => (
        <Badge variant={r.riskLevel === 'high' ? 'danger' : r.riskLevel === 'medium' ? 'warning' : 'success'} size="sm">
          {{ high: '高风险', medium: '中风险', low: '低风险' }[r.riskLevel] || r.riskLevel}
        </Badge>
      ),
    },
    { key: 'title', title: '线索标题', width: 200 },
    { key: 'involvedPerson', title: '涉事人员', width: 100 },
    { key: 'involvedDepartment', title: '所属单位', width: 120 },
    { key: 'amount', title: '涉及金额', width: 120, align: 'right', render: (r) => formatMoney(r.amount) },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (r) => (
        <Badge variant={r.status === 'verified' ? 'success' : r.status === 'investigating' ? 'warning' : 'default'} size="sm">
          {{ pending: '待研判', investigating: '调查中', verified: '已核实', filed: '已立案', closed: '已办结' }[r.status] || r.status}
        </Badge>
      ),
    },
    { key: 'createdAt', title: '登记时间', width: 120, render: (r) => formatDate(r.createdAt) },
  ]

  const getColumns = () => {
    switch (reportType) {
      case 'petitions':
        return petitionColumns
      case 'clues':
        return clueColumns
      case 'cases':
      default:
        return caseColumns
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">统计分析</h1>
          <p className="text-sm text-gray-500 mt-1">
            多维度数据分析，支持筛选和导出月度纪检监察工作分析报告
          </p>
        </div>
        <Button onClick={handleExport} loading={submitLoading}>
          <Download className="h-4 w-4 mr-2" />
          导出月度报告
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" message={successMessage} dismissible />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="信访举报"
          value={petitions.length}
          icon={<FileText className="h-5 w-5" />}
          variant="navy"
          subtitle="总接收量"
        />
        <StatCard
          title="处置线索"
          value={clues.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
          subtitle="总线索量"
        />
        <StatCard
          title="立案审查"
          value={cases.filter(c => c.currentStage !== 'petition' && c.currentStage !== 'clue').length}
          icon={<BarChart3 className="h-5 w-5" />}
          variant="primary"
          subtitle="总立案量"
        />
        <StatCard
          title="已结案"
          value={cases.filter(c => c.currentStage === 'closed').length}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
          subtitle="完成案件"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="结案率"
          value={stats ? `${stats.closingRate}%` : '-'}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
          subtitle="本月"
        />
        <StatCard
          title="平均分流时长"
          value={stats ? `${stats.avgDistributionTime}小时` : '-'}
          icon={<Clock className="h-5 w-5" />}
          variant="navy"
          subtitle="信访处置效率"
        />
        <StatCard
          title="超期预警"
          value={stats?.overdueCount || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          subtitle="超期未处理"
        />
        <StatCard
          title="承办人员"
          value={8}
          icon={<Users className="h-5 w-5" />}
          variant="primary"
          subtitle="在岗人数"
        />
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-navy-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary-700" />
          数据筛选
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="违纪类型"
            value={violationFilter}
            onChange={(e) => { setViolationFilter(e.target.value); setPage(1) }}
            options={violationOptions}
          />
          <Select
            label="承办部门"
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1) }}
            options={departmentOptions}
          />
          <Input
            label="开始日期"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          />
          <Input
            label="结束日期"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={reportType === 'cases' ? 'primary' : 'ghost'}
              onClick={() => { setReportType('cases'); setPage(1) }}
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              案件
            </Button>
            <Button
              variant={reportType === 'petitions' ? 'primary' : 'ghost'}
              onClick={() => { setReportType('petitions'); setPage(1) }}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-1" />
              信访
            </Button>
            <Button
              variant={reportType === 'clues' ? 'primary' : 'ghost'}
              onClick={() => { setReportType('clues'); setPage(1) }}
              size="sm"
            >
              <PieChart className="h-4 w-4 mr-1" />
              线索
            </Button>
            <div className="ml-auto text-sm text-gray-500">
              共 <span className="font-semibold text-primary-700">{currentData.length}</span> 条记录
            </div>
          </div>
          <div className="p-0">
            <Table
              columns={getColumns()}
              data={paginatedData}
              loading={loading}
              emptyText="暂无数据"
            />
            <div className="border-t mt-4 pt-4">
              <Pagination
                current={page}
                total={currentData.length}
                pageSize={pageSize}
                onChange={setPage}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Reports
