import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts'
import {
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Users,
  Building2,
  Calendar,
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardTitle, CardContent, Select, Button, Alert, Badge } from '@/components/ui'
import { ViolationTypeBadge, RiskLevelBadge } from '@/components/business'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatMoney, getTimeAgo } from '@/utils/format'
import { VIOLATION_TYPE_LABELS, DEPARTMENTS, DashboardStats, Clue, Case, Petition } from '../../shared/types'
import { statsApi } from '@/api/client'

const COLORS = ['#C8102E', '#003366', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [filters, setFilters] = useState({
    violationType: '',
    department: '',
    startDate: '',
    endDate: '',
  })
  const [exportLoading, setExportLoading] = useState(false)

  const { clues, cases, petitions, fetchClues, fetchCases, fetchPetitions } = useDataStore()
  const user = useAuthStore((state) => state.user)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filters.violationType) params.type = filters.violationType
      if (filters.department) params.department = filters.department
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const response = await statsApi.getDashboard(params)
      if (response.success && response.data) {
        setStats(response.data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchStats()
    fetchClues()
    fetchCases()
    fetchPetitions()

    const interval = setInterval(() => {
      fetchStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchStats, fetchClues, fetchCases, fetchPetitions])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      statsApi.export()
    } finally {
      setTimeout(() => setExportLoading(false), 1000)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleRefresh = () => {
    fetchStats()
    fetchClues()
    fetchCases()
    fetchPetitions()
  }

  const recentClues = clues.slice(0, 5)
  const recentCases = cases.slice(0, 5)
  const recentPetitions = petitions.slice(0, 5)

  const pieData = stats?.casesByType
    ? Object.entries(stats.casesByType).map(([key, value]) => ({
        name: VIOLATION_TYPE_LABELS[key as keyof typeof VIOLATION_TYPE_LABELS] || key,
        value,
      }))
    : []

  const trendData = stats?.trendData || []

  const departmentData = stats?.casesByDepartment
    ? Object.entries(stats.casesByDepartment).map(([name, value]) => ({ name, value }))
    : []

  const radarData = [
    { subject: '信访处理', A: stats?.distributionEfficiency || 0, fullMark: 100 },
    { subject: '线索研判', A: 85, fullMark: 100 },
    { subject: '立案审批', A: 92, fullMark: 100 },
    { subject: '案件审查', A: 78, fullMark: 100 },
    { subject: '审理结案', A: stats?.closingRate || 0, fullMark: 100 },
    { subject: '执行监督', A: 88, fullMark: 100 },
  ]

  const overdueItems = [
    ...clues.filter((c) => c.isOverdue).map((c) => ({ ...c, type: 'clue' as const })),
    ...cases.filter((c) => c.approvalHistory.some((a) => a.isOverdue)).map((c) => ({ ...c, type: 'case' as const })),
  ].slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">指挥调度大屏</h1>
          <p className="text-sm text-gray-500 mt-1">
            实时监控 · 智能预警 · 数据每5秒自动刷新
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-green-500')} />
            <span>更新于 {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新
          </Button>
          <Button size="sm" onClick={handleExport} loading={exportLoading}>
            <Download className="h-4 w-4 mr-1" />
            导出报告
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">筛选条件：</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <Select
                value={filters.violationType}
                onChange={(e) => handleFilterChange('violationType', e.target.value)}
                options={[
                  { value: '', label: '全部违纪类型' },
                  ...Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
                ]}
                className="w-40"
              />
              <Select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                options={[
                  { value: '', label: '全部部门' },
                  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
                ]}
                className="w-48"
              />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="案件存量"
          value={stats?.totalCases || 0}
          icon={<FileText className="h-6 w-6" />}
          variant="primary"
          subtitle="正在办理中的案件"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="结案率"
          value={`${stats?.closingRate || 0}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
          subtitle="本月案件结案比例"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="分流效率"
          value={`${stats?.distributionEfficiency || 0}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="navy"
          subtitle="信访转线索平均时效"
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="超期预警"
          value={stats?.overdueCases || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="danger"
          subtitle="超期未处理事项"
          className={stats?.overdueCases ? 'animate-pulse-slow' : ''}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="待审批事项"
          value={stats?.pendingApprovals || 0}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle="需要及时审批"
        />
        <StatCard
          title="待谈话提醒"
          value={stats?.pendingTalks || 0}
          icon={<Users className="h-5 w-5" />}
          variant="info"
          subtitle="待安排谈话"
        />
        <StatCard
          title="超期线索"
          value={stats?.overdueClues || 0}
          icon={<Search className="h-5 w-5" />}
          variant="danger"
          subtitle="需立即启动调查"
          className={stats?.overdueClues ? 'animate-pulse-slow' : ''}
        />
      </div>

      {overdueItems.length > 0 && (
        <Alert
          variant="danger"
          title="超期预警"
          message={`有 ${overdueItems.length} 项工作已超期，请立即处理！`}
          dismissible
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-700" />
              案件趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="新增案件"
                    stroke="#C8102E"
                    strokeWidth={3}
                    dot={{ fill: '#C8102E', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-navy-700" />
              各部门案件分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="#6B7280"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" name="案件数" fill="#003366" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-700" />
              违纪类型分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#9CA3AF' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              业务效能雷达图
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="效能指数"
                    dataKey="A"
                    stroke="#C8102E"
                    fill="#C8102E"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              超期预警列表
            </CardTitle>
            <Badge variant="danger" size="sm">{overdueItems.length}项</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {overdueItems.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  暂无超期事项
                </div>
              ) : (
                overdueItems.map((item, index) => (
                  <div key={index} className="p-4 hover:bg-red-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.type === 'clue' ? (
                            <RiskLevelBadge level={(item as Clue).riskLevel} />
                          ) : (
                            <Badge variant="warning">审批中</Badge>
                          )}
                          <span className="text-xs text-red-500">
                            已超期 {getTimeAgo(item.deadline || item.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="danger" size="sm">超期</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary-700" />
              最新线索
            </CardTitle>
            <Badge variant="primary" size="sm">{recentClues.length}条</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentClues.map((clue) => (
                <div key={clue.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {clue.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <ViolationTypeBadge type={clue.violationType} />
                        <RiskLevelBadge level={clue.riskLevel} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {clue.involvedPerson} · {clue.involvedDepartment}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getTimeAgo(clue.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-navy-700" />
              最新信访
            </CardTitle>
            <Badge variant="navy" size="sm">{recentPetitions.length}条</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentPetitions.map((petition) => (
                <div key={petition.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {petition.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={petition.status === 'pending' ? 'warning' : 'info'} size="sm">
                          {petition.status === 'pending' ? '待处理' :
                           petition.status === 'processing' ? '处理中' :
                           petition.status === 'assigned' ? '已分配' :
                           petition.status === 'converted' ? '已转线索' : '已办结'}
                        </Badge>
                        {petition.amount && (
                          <span className="text-xs text-gray-500">
                            涉及{formatMoney(petition.amount)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {petition.involvedPerson} · {petition.involvedDepartment}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getTimeAgo(petition.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
