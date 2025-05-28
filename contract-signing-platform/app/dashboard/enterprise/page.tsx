"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, User, MoreVertical, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function EnterprisePage() {
  const [members, setMembers] = useState([
    { id: 1, name: "张三", phone: "137****7712", role: "管理员" },
    { id: 2, name: "李四", phone: "139****5507", role: "成员" },
    { id: 3, name: "王五", phone: "186****9629", role: "成员" },
  ])

  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberPhone, setNewMemberPhone] = useState("")

  const addMember = () => {
    if (!newMemberName || !newMemberPhone) {
      alert("请输入姓名和手机号")
      return
    }

    const newMember = {
      id: members.length + 1,
      name: newMemberName,
      phone: newMemberPhone,
      role: "成员",
    }

    setMembers([...members, newMember])
    setNewMemberName("")
    setNewMemberPhone("")
  }

  const deleteMember = (id: number) => {
    setMembers(members.filter((member) => member.id !== id))
  }

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">企业成员</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加成员
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">技术有限公司</h2>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">已认证</span>
            </div>

            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-4">{member.role}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteMember(member.id)}>
                          <Trash className="w-4 h-4 mr-2 text-red-500" />
                          <span className="text-red-500">删除</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <h3 className="text-base font-medium mb-3">添加成员</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    placeholder="请输入姓名"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    placeholder="请输入手机号"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button className="mt-4" onClick={addMember}>
                添加
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
