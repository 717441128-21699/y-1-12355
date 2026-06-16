import { cn } from '@/lib/utils'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Search,
  FileCheck,
  ClipboardList,
  Scale,
  BarChart3,
  Settings,
  MailWarning,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '../../../shared/types'

interface MenuItem {
  key: string
  label: string
  icon: typeof LayoutDashboard
  path: string
  roles?: UserRole[]
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '首页大屏',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    key: 'petitions',
    label: '信访举报',
    icon: MailWarning,
    path: '/petitions',
  },
  {
    key: 'clues',
    label: '线索研判',
    icon: Search,
    path: '/clues',
  },
  {
    key: 'approvals',
    label: '立案审批',
    icon: FileCheck,
    path: '/approvals',
  },
  {
    key: 'cases',
    label: '案件审查',
    icon: ClipboardList,
    path: '/cases',
  },
  {
    key: 'trials',
    label: '审理结案',
    icon: Scale,
    path: '/trials',
  },
  {
    key: 'reports',
    label: '统计分析',
    icon: BarChart3,
    path: '/reports',
    roles: ['case_office', 'leader'],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    path: '/settings',
    roles: ['case_office', 'leader'],
  },
]

interface SidebarProps {
  collapsed?: boolean
  className?: string
}

const Sidebar = ({ collapsed = false, className }: SidebarProps) => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || !user?.role || item.roles.includes(user.role)
  )

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-dark-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className={cn(
        'flex h-16 items-center border-b border-dark-700',
        collapsed ? 'justify-center px-2' : 'px-6'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-700">
            <FileText className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg">智慧纪检</span>
              <span className="text-xs text-gray-400">综合管理平台</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            
            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-700 text-white shadow-lg shadow-primary-700/30'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-pulse-slow')} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-dark-700 p-4">
          <div className="rounded-lg bg-dark-800 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-white font-bold">
                {user?.name?.charAt(0) || '用'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || '用户'}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.role === 'handler' && '承办人'}
                  {user?.role === 'dept_head' && '部门负责人'}
                  {user?.role === 'case_office' && '案管室'}
                  {user?.role === 'leader' && '领导'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
