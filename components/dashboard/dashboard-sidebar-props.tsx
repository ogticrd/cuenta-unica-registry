export interface DashboardSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (isOpen: boolean) => void
}
