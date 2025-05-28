"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Upload, Camera } from "lucide-react"

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState("enterprise")
  const [step, setStep] = useState(1)

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold ml-2">{activeTab === "enterprise" ? "企业认证" : "个人认证"}</h1>
      </div>

      <Tabs defaultValue="enterprise" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="enterprise">企业认证</TabsTrigger>
          <TabsTrigger value="personal">个人认证</TabsTrigger>
        </TabsList>

        <TabsContent value="enterprise">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">企业信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="business-license">请上传营业执照</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="company-name">企业名称</Label>
                  <Input id="company-name" placeholder="请输入企业名称" />
                </div>

                <div>
                  <Label htmlFor="credit-code">统一信用代码</Label>
                  <Input id="credit-code" placeholder="请输入统一信用代码" />
                </div>

                <div>
                  <Label htmlFor="legal-person">法人姓名</Label>
                  <Input id="legal-person" placeholder="请输入法人姓名" />
                </div>

                <div>
                  <Label htmlFor="phone">手机号</Label>
                  <Input id="phone" placeholder="请输入手机号" />
                </div>

                <Button className="w-full">下一步</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">个人认证</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center justify-center w-1/3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    1
                  </div>
                  <div className={`h-1 w-full ${step >= 2 ? "bg-blue-500" : "bg-gray-200"}`}></div>
                </div>
                <div className="flex items-center justify-center w-1/3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    2
                  </div>
                  <div className={`h-1 w-full ${step >= 3 ? "bg-blue-500" : "bg-gray-200"}`}></div>
                </div>
                <div className="flex items-center justify-center w-1/3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    3
                  </div>
                </div>
              </div>

              <div className="text-center mb-2">
                <h3 className="font-medium">
                  {step === 1 && "身份证采集"}
                  {step === 2 && "人证比对"}
                  {step === 3 && "视频认证"}
                </h3>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <Label className="block mb-2">上传身份证正面</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">点击上传身份证正面</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <Label className="block mb-2">上传身份证背面</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">点击上传身份证背面</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setStep(2)}>
                    下一步
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-48">
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">点击开始人脸识别</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      上一步
                    </Button>
                    <Button className="flex-1" onClick={() => setStep(3)}>
                      下一步
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-48">
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">点击开始视频认证</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                      上一步
                    </Button>
                    <Button className="flex-1">完成认证</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
