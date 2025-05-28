"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Download, Eye } from "lucide-react"

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const contractTitle = decodeURIComponent(params.id)
  const [isCompleted, setIsCompleted] = useState(contractTitle.includes("已完成"))

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/contracts">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold ml-2">合同详情</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">{contractTitle}</h2>
            <div className="flex items-center">
              <span
                className={`px-2 py-1 text-xs rounded-full ${isCompleted ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
              >
                {isCompleted ? "已完成" : "待签署"}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">发起方</span>
              <span>陈静</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">签署方</span>
              <span>刘诗诗</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">发起时间</span>
              <span>2023-10-19 15:20:06</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">截止时间</span>
              <span>2023-10-20 23:59:59</span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-medium mb-4">签署流程</h3>
            <div className="space-y-6">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    1
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div>
                  <p className="text-sm font-medium">发起方</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span className="text-xs">陈</span>
                    </div>
                    <div>
                      <p className="text-sm">陈静</p>
                      <p className="text-xs text-gray-500">签署时间: 2023-10-19 15:20:26</p>
                    </div>
                    <span className="ml-auto text-xs text-green-500">已签署</span>
                  </div>
                </div>
              </div>

              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    2
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">签署方</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span className="text-xs">刘</span>
                    </div>
                    <div>
                      <p className="text-sm">刘诗诗</p>
                      {isCompleted ? (
                        <p className="text-xs text-gray-500">签署时间: 2023-10-19 15:35:48</p>
                      ) : (
                        <p className="text-xs text-gray-500">等待签署</p>
                      )}
                    </div>
                    {isCompleted ? (
                      <span className="ml-auto text-xs text-green-500">已签署</span>
                    ) : (
                      <span className="ml-auto text-xs text-orange-500">待签署</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-medium mb-4">合同文件</h3>
            <div className="border rounded-lg p-4 flex items-center">
              <div className="w-10 h-12 bg-red-100 flex items-center justify-center rounded mr-3">
                <span className="text-red-500 text-xs font-bold">PDF</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{contractTitle}.pdf</p>
                <p className="text-xs text-gray-500">24.58Kb</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  查看
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
              </div>
            </div>
          </div>

          {!isCompleted && (
            <div className="mt-8">
              <Button className="w-full" onClick={() => setIsCompleted(true)}>
                签署合同
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="mt-8">
              <Button variant="outline" className="w-full">
                查看详情
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
