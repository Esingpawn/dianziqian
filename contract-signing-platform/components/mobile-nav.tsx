"use client"

import Link from "next/link"
import { Home, FileText, User } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white md:hidden">
      <div className="flex justify-around">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center py-2 px-4",
            pathname === "/dashboard" ? "text-blue-500" : "text-gray-500",
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">首页</span>
        </Link>
        <Link
          href="/dashboard/contracts"
          className={cn(
            "flex flex-col items-center py-2 px-4",
            pathname.includes("/dashboard/contracts") ? "text-blue-500" : "text-gray-500",
          )}
        >
          <FileText className="w-6 h-6" />
          <span className="text-xs mt-1">合同</span>
        </Link>
        <Link
          href="/dashboard/profile"
          className={cn(
            "flex flex-col items-center py-2 px-4",
            pathname.includes("/dashboard/profile") ? "text-blue-500" : "text-gray-500",
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">我的</span>
        </Link>
      </div>
    </div>
  )
}
