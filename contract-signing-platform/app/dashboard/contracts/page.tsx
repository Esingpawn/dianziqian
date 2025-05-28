"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function ContractsPage() {
  const [filter, setFilter] = useState("all")

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">合同管理</h1>
        <Link href="/dashboard/contracts/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            发起合同
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <div className="overflow-x-auto">
          <TabsList className="mb-4 w-full md:w-auto">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待我处理</TabsTrigger>
            <TabsTrigger value="waiting">待他人处理</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="rejected">已拒签</TabsTrigger>
            <TabsTrigger value="revoked">已撤销</TabsTrigger>
            <TabsTrigger value="expired">已逾期</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <ContractCard
            title="品牌设计合同"
            initiator="陈静"
            recipient="刘诗诗"
            startDate="2022-05-18 16:20"
            endDate="2022-08-18 16:20"
            status="pending"
            isSpecial={true}
          />

          <ContractCard
            title="新建设工程施工合同"
            initiator="陈静"
            recipient="刘诗诗"
            startDate="2022-05-18 16:20"
            endDate="2022-08-18 16:20"
            status="revoked"
            isSpecial={false}
          />

          <ContractCard
            title="品牌设计合同"
            initiator="陈静"
            recipient="刘诗诗"
            startDate="2022-05-18 16:20"
            endDate="2022-08-18 16:20"
            status="completed"
            isSpecial={false}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <ContractCard
            title="品牌设计合同"
            initiator="陈静"
            recipient="刘诗诗"
            startDate="2022-05-18 16:20"
            endDate="2022-08-18 16:20"
            status="pending"
            isSpecial={true}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ContractCard
            title="品牌设计合同"
            initiator="陈静"
            recipient="刘诗诗"
            startDate="2022-05-18 16:20"
            endDate="2022-08-18 16:20"
            status="completed"
            isSpecial={false}
          />
        </TabsContent>

        <TabsContent value="revoked" className="space-y-4">
          <ContractCard
            title="新建设工程施工合同"
            initiator="陈静"
            recipient="刘诗诗"
            startDate="2022-05-18 16:20"
            endDate="2022-08-18 16:20"
            status="revoked"
            isSpecial={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ContractCardProps {
  title: string
  initiator: string
  recipient: string
  startDate: string
  endDate: string
  status: "pending" | "waiting" | "completed" | "rejected" | "revoked" | "expired"
  isSpecial: boolean
}

function ContractCard({ title, initiator, recipient, startDate, endDate, status, isSpecial }: ContractCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">待处理</span>
      case "waiting":
        return <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">待他人处理</span>
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">已完成</span>
      case "rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">已拒签</span>
      case "revoked":
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">已撤销</span>
      case "expired":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">已逾期</span>
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "waiting":
        return <Clock className="w-5 h-5 text-orange-500" />
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "revoked":
        return <XCircle className="w-5 h-5 text-gray-500" />
      case "expired":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  return (
    <Link href={`/dashboard/contracts/${encodeURIComponent(title)}`}>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{title}</h3>
                  {isSpecial && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">特签章</span>
                  )}
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <p>发起方：{initiator}</p>
                  <p>签署方：{recipient}</p>
                  <p>发起时间：{startDate}</p>
                  <p>截止时间：{endDate}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              {status === "pending" && (
                <Button size="sm" className="mt-2">
                  签署合同
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
