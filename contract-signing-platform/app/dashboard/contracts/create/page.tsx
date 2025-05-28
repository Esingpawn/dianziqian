"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserTypeSwitch } from "@/components/user-type-switch"
import { ChevronLeft, Plus, Minus } from "lucide-react"

export default function CreateContractPage() {
  const [userType, setUserType] = useState<"personal" | "enterprise">("personal")
  const [quantity, setQuantity] = useState(1)

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/contracts">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">购买套餐</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium mb-4">一合通服务</h2>
            <UserTypeSwitch value={userType} onChange={setUserType} />
          </div>

          <div className="mt-6">
            <Label className="text-sm text-gray-500 mb-1 block">购买企业</Label>
            <div className="flex items-center">
              <span className="text-sm">上海旭冉信息科技有限公司重庆分公司</span>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
            </div>
          </div>

          <div className="mt-6">
            <Label className="text-sm text-gray-500 mb-1 block">购买份数</Label>
            <div className="flex items-center">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" onClick={decreaseQuantity}>
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                className="w-16 h-8 mx-2 text-center"
              />
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" onClick={increaseQuantity}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Label className="text-sm text-gray-500 mb-1 block">支付金额</Label>
            <p className="text-red-500 font-medium">¥ {500 * quantity}.00</p>
          </div>

          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <h3 className="font-medium">购买须知</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>套餐购买成功后立即生效，且不可退款。</li>
              <li>购买完成的套餐仅限本人使用，不支持转让、赠送或其他交易。</li>
              <li>套餐应在有效期内使用，到期自动失效，不退不补，请尽早使用。</li>
            </ol>
          </div>

          <div className="mt-8 flex gap-4">
            <Button variant="outline" className="flex-1">
              取消
            </Button>
            <Button className="flex-1">立即购买</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ChevronRight({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
