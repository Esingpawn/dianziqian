"use client"

import { cn } from "@/lib/utils"

interface UserTypeSwitchProps {
  value: "personal" | "enterprise"
  onChange: (value: "personal" | "enterprise") => void
}

export function UserTypeSwitch({ value, onChange }: UserTypeSwitchProps) {
  return (
    <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
      <button
        className={cn(
          "px-4 py-2 text-sm rounded-md transition-colors",
          value === "personal" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900",
        )}
        onClick={() => onChange("personal")}
      >
        个人套餐
      </button>
      <button
        className={cn(
          "px-4 py-2 text-sm rounded-md transition-colors",
          value === "enterprise" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900",
        )}
        onClick={() => onChange("enterprise")}
      >
        企业套餐
      </button>
    </div>
  )
}
