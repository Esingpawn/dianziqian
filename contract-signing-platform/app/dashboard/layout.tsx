import type { ReactNode } from "react"
import Link from "next/link"
import { FileSignature, Home, FileText, Building, Shield, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <FileSignature className="w-5 h-5" />
            </div>
            <h1 className="ml-2 text-lg font-bold hidden md:block">电子合同签署平台</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/notifications">
                <span className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                  </span>
                </span>
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm font-medium hidden md:block">陈静</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 border-r bg-white hidden md:block">
          <nav className="p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
              <Home className="w-5 h-5 text-gray-600" />
              <span>首页</span>
            </Link>
            <Link href="/dashboard/contracts" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
              <FileText className="w-5 h-5 text-gray-600" />
              <span>文件管理</span>
            </Link>
            <Link href="/dashboard/enterprise" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
              <Building className="w-5 h-5 text-gray-600" />
              <span>我的企业</span>
            </Link>
            <Link href="/dashboard/seals" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
              <Shield className="w-5 h-5 text-gray-600" />
              <span>企业印章</span>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>账号设置</span>
            </Link>
            <Link href="/logout" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-red-500">
              <LogOut className="w-5 h-5" />
              <span>退出登录</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 bg-gray-50">{children}</main>
      </div>

      <MobileNav />
    </div>
  )
}
