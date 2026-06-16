import Badge from '../ui/Badge'
import { PetitionStatus, ClueStatus, CaseStatus, RiskLevel, ApprovalResult, TalkStatus } from '../../../shared/types'

export const PetitionStatusBadge = ({ status }: { status: PetitionStatus }) => {
  const statusMap: Record<PetitionStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    pending: { variant: 'warning', label: '待处理' },
    processing: { variant: 'primary', label: '处理中' },
    transferred: { variant: 'info', label: '已转办' },
    closed: { variant: 'success', label: '已办结' },
    rejected: { variant: 'danger', label: '已驳回' },
  }
  const { variant, label } = statusMap[status]
  return <Badge variant={variant}>{label}</Badge>
}

export const ClueStatusBadge = ({ status }: { status: ClueStatus }) => {
  const statusMap: Record<ClueStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    pending: { variant: 'warning', label: '待研判' },
    investigating: { variant: 'primary', label: '调查中' },
    verified: { variant: 'info', label: '已核实' },
    filed: { variant: 'navy', label: '已立案' },
    closed: { variant: 'success', label: '已了结' },
    escalated: { variant: 'danger', label: '已升级' },
  }
  const { variant, label } = statusMap[status]
  return <Badge variant={variant}>{label}</Badge>
}

export const CaseStatusBadge = ({ status }: { status: CaseStatus }) => {
  const statusMap: Record<CaseStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    pending_approval: { variant: 'warning', label: '待审批' },
    approving: { variant: 'primary', label: '审批中' },
    investigating: { variant: 'navy', label: '审查中' },
    trial: { variant: 'info', label: '审理中' },
    closed: { variant: 'success', label: '已结案' },
    rejected: { variant: 'danger', label: '已驳回' },
  }
  const { variant, label } = statusMap[status]
  return <Badge variant={variant}>{label}</Badge>
}

export const RiskLevelBadge = ({ level }: { level: RiskLevel }) => {
  const levelMap: Record<RiskLevel, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    low: { variant: 'success', label: '低风险' },
    medium: { variant: 'warning', label: '中风险' },
    high: { variant: 'danger', label: '高风险' },
  }
  const { variant, label } = levelMap[level]
  return (
    <Badge variant={variant} className={level === 'high' ? 'animate-pulse' : ''}>
      {label}
    </Badge>
  )
}

export const ApprovalResultBadge = ({ result }: { result: ApprovalResult }) => {
  const resultMap: Record<ApprovalResult, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    approved: { variant: 'success', label: '已通过' },
    rejected: { variant: 'danger', label: '已驳回' },
    escalated: { variant: 'warning', label: '自动越级' },
    pending: { variant: 'info', label: '待审批' },
  }
  const { variant, label } = resultMap[result]
  return <Badge variant={variant}>{label}</Badge>
}

export const TalkStatusBadge = ({ status }: { status: TalkStatus }) => {
  const statusMap: Record<TalkStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    pending: { variant: 'warning', label: '待谈话' },
    scheduled: { variant: 'info', label: '已预约' },
    in_progress: { variant: 'primary', label: '谈话中' },
    completed: { variant: 'success', label: '已完成' },
    cancelled: { variant: 'default', label: '已取消' },
    overdue: { variant: 'danger', label: '已超期' },
  }
  const { variant, label } = statusMap[status]
  return (
    <Badge variant={variant} className={status === 'overdue' ? 'animate-pulse' : ''}>
      {label}
    </Badge>
  )
}

export const ViolationTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'navy'; label: string }> = {
    political: { variant: 'danger', label: '政治类' },
    economic: { variant: 'warning', label: '经济类' },
    organizational: { variant: 'primary', label: '组织类' },
    work: { variant: 'info', label: '工作类' },
    life: { variant: 'default', label: '生活类' },
    other: { variant: 'navy', label: '其他' },
  }
  const { variant, label } = typeMap[type] || { variant: 'default', label: type }
  return <Badge variant={variant}>{label}</Badge>
}
