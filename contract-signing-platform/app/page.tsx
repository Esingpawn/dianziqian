import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, FileSignature, Building, Shield, Users, FileText } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <FileSignature className="w-6 h-6" />
            </div>
            <h1 className="ml-2 text-xl font-bold">电子合同签署平台</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">安全、便捷的电子合同签署解决方案</h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              支持多方签署、实名认证、电子印章，让您的合同签署更加高效、安全、合规
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  立即注册
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
                  了解更多
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">主要功能</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <FileSignature className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>快速发起签署</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>支持多人或多公司同时签署，设置合同有效期，避免法律风险</p>
                </CardContent>
                <CardFooter>
                  <Link href="/features/signing" className="text-blue-500 flex items-center">
                    了解更多 <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>实名认证</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>支持个人实名认证、人证比对、人脸识别，企业认证、法人实名认证</p>
                </CardContent>
                <CardFooter>
                  <Link href="/features/verification" className="text-blue-500 flex items-center">
                    了解更多 <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <Building className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>企业管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>管理企业成员，设置签章权限，自动生成合规的CA证书签章</p>
                </CardContent>
                <CardFooter>
                  <Link href="/features/enterprise" className="text-blue-500 flex items-center">
                    了解更多 <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>合同模板</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>平台提供丰富的合同模板，定期更新，免费使用</p>
                </CardContent>
                <CardFooter>
                  <Link href="/features/templates" className="text-blue-500 flex items-center">
                    了解更多 <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>批量签署</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>支持批量签署合同，适用于一对多签署场景，提高效率</p>
                </CardContent>
                <CardFooter>
                  <Link href="/features/batch" className="text-blue-500 flex items-center">
                    了解更多 <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">立即开始使用</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">注册账号，完成实名认证，即可开始使用我们的电子合同签署平台</p>
            <Link href="/register">
              <Button size="lg">免费注册</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600">© 2025 电子合同签署平台. 保留所有权利.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                关于我们
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                隐私政策
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                服务条款
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                联系我们
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
