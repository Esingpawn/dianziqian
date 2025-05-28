"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Download, Check, X } from "lucide-react"

export default function SignContractPage() {
  const [signMethod, setSignMethod] = useState<"signature" | "seal">("signature")
  const [selectedSeal, setSelectedSeal] = useState<number | null>(null)

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/contracts">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold ml-2">电子签署</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="aspect-[3/4] relative bg-gray-100 flex items-center justify-center">
                <Image
                  src="/placeholder.svg?height=600&width=450"
                  alt="合同预览"
                  width={450}
                  height={600}
                  className="object-contain"
                />

                {/* 签名位置指示 */}
                <div className="absolute bottom-20 right-20 w-32 h-16 border-2 border-blue-500 border-dashed flex items-center justify-center">
                  <span className="text-blue-500 text-sm">点击此处签署</span>
                </div>
              </div>

              <div className="flex justify-between p-4 border-t">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    拒签
                  </Button>
                  <Button size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    提交
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="signature" onValueChange={(value) => setSignMethod(value as "signature" | "seal")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signature">手写签名</TabsTrigger>
                  <TabsTrigger value="seal">盖章</TabsTrigger>
                </TabsList>

                <TabsContent value="signature" className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="aspect-[3/1] bg-gray-50 rounded-md flex items-center justify-center border mb-4">
                      <span className="text-gray-400">在此处手写签名</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        清除
                      </Button>
                      <Button size="sm">确定</Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">选择已保存的签名</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border rounded-md p-2 aspect-[2/1] flex items-center justify-center hover:border-blue-500 cursor-pointer">
                        <Image
                          src="/placeholder.svg?height=50&width=100"
                          alt="签名1"
                          width={100}
                          height={50}
                          className="object-contain"
                        />
                      </div>
                      <div className="border rounded-md p-2 aspect-[2/1] flex items-center justify-center hover:border-blue-500 cursor-pointer">
                        <Image
                          src="/placeholder.svg?height=50&width=100"
                          alt="签名2"
                          width={100}
                          height={50}
                          className="object-contain"
                        />
                      </div>
                      <div className="border rounded-md p-2 aspect-[2/1] flex items-center justify-center hover:border-blue-500 cursor-pointer border-dashed">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seal" className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">选择印章</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((id) => (
                      <div
                        key={id}
                        className={`border rounded-md p-3 cursor-pointer ${selectedSeal === id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"}`}
                        onClick={() => setSelectedSeal(id)}
                      >
                        <div className="flex justify-center mb-2">
                          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <Image
                              src="/placeholder.svg?height=50&width=50"
                              alt={`印章${id}`}
                              width={50}
                              height={50}
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <p className="text-center text-sm">
                          {id === 1 && "公章"}
                          {id === 2 && "合同专用章"}
                          {id === 3 && "财务专用章"}
                          {id === 4 && "法人章"}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
