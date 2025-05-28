"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { WechatIcon } from "@/components/icons/wechat-icon"

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleSendVerificationCode = () => {
    if (phoneNumber.length !== 11) {
      alert("请输入正确的手机号码")
      return
    }

    setIsSendingCode(true)
    setCountdown(60)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsSendingCode(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // 实际项目中这里会调用API进行登录验证
    console.log("登录信息:", { phoneNumber, verificationCode })
  }

  const handleWechatLogin = () => {
    // 实际项目中这里会调用微信授权登录API
    console.log("微信授权登录")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Image
              src="/placeholder.svg?height=40&width=40"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>登录您的电子合同签署平台账号</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="phone">手机号登录</TabsTrigger>
              <TabsTrigger value="wechat">微信登录</TabsTrigger>
            </TabsList>
            <TabsContent value="phone">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入手机号"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      type="text"
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode}
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? `${countdown}秒后重发` : "获取验证码"}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  登录
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="wechat">
              <div className="flex flex-col items-center space-y-4">
                <Button onClick={handleWechatLogin} className="w-full bg-[#07C160] hover:bg-[#06AD56] text-white">
                  <WechatIcon className="mr-2 h-5 w-5" />
                  微信授权登录
                </Button>
                <p className="text-sm text-gray-500">点击按钮，使用微信扫码登录</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            还没有账号？
            <Link href="/register" className="text-blue-500 hover:text-blue-700 ml-1">
              立即注册
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
