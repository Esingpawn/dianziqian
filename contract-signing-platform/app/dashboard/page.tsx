"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Building, FileText, ChevronRight } from "lucide-react"
import { UserTypeSwitch } from "@/components/user-type-switch"

export default function DashboardPage() {
  const [userType, setUserType] = useState<"personal" | "enterprise">("personal")

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">个人中心</h1>
        <UserTypeSwitch value={userType} onChange={setUserType} />
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">20</p>
                <p className="text-sm text-gray-500 mt-1">个人套餐</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">9</p>
                <p className="text-sm text-gray-500 mt-1">企业套餐</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Link href="/dashboard/enterprise">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-blue-500 mr-3" />
                  <span>我的企业</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/seals">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
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
                    className="text-blue-500 mr-3"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  <span>企业印章</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/contracts">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-3" />
                  <span>文件管理</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/privacy">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
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
                    className="text-blue-500 mr-3"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>隐私政策</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/settings">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
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
                    className="text-blue-500 mr-3"
                  >
                    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
                    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
                    <path d="M12 2v2"></path>
                    <path d="M12 22v-2"></path>
                    <path d="M4.93 4.93l1.41 1.41"></path>
                    <path d="M17.66 17.66l1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M22 12h-2"></path>
                    <path d="M4.93 19.07l1.41-1.41"></path>
                    <path d="M17.66 6.34l1.41-1.41"></path>
                  </svg>
                  <span>修改密码</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
