"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default function SealsPage() {
  const [selectedSeal, setSelectedSeal] = useState<string | null>(null)

  return (
    <div className="container mx-auto p-4 pb-16 md:pb-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">成员印章管理</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加印章
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <SealCard
          name="公章"
          imageUrl="/placeholder.svg?height=100&width=100"
          isSelected={selectedSeal === "公章"}
          onSelect={() => setSelectedSeal("公章")}
          onAuthorize={() => console.log("授权公章")}
        />

        <SealCard
          name="合同专用章"
          imageUrl="/placeholder.svg?height=100&width=100"
          isSelected={selectedSeal === "合同专用章"}
          onSelect={() => setSelectedSeal("合同专用章")}
          onAuthorize={() => console.log("授权合同专用章")}
          isNew={true}
        />

        <SealCard
          name="财务专用章"
          imageUrl="/placeholder.svg?height=100&width=100"
          isSelected={selectedSeal === "财务专用章"}
          onSelect={() => setSelectedSeal("财务专用章")}
          onAuthorize={() => console.log("授权财务专用章")}
        />

        <SealCard
          name="人事专用章"
          imageUrl="/placeholder.svg?height=100&width=100"
          isSelected={selectedSeal === "人事专用章"}
          onSelect={() => setSelectedSeal("人事专用章")}
          onAuthorize={() => console.log("授权人事专用章")}
        />
      </div>
    </div>
  )
}

interface SealCardProps {
  name: string
  imageUrl: string
  isSelected: boolean
  onSelect: () => void
  onAuthorize: () => void
  isNew?: boolean
}

function SealCard({ name, imageUrl, isSelected, onSelect, onAuthorize, isNew = false }: SealCardProps) {
  return (
    <Card className={`overflow-hidden ${isSelected ? "ring-2 ring-blue-500" : ""}`} onClick={onSelect}>
      <CardContent className="p-0">
        <div className="relative">
          {isNew && (
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-bl">NEW</div>
          )}
          <div className="p-4 flex justify-center">
            <div className="w-24 h-24 relative">
              <Image src={imageUrl || "/placeholder.svg"} alt={name} fill className="object-contain" />
            </div>
          </div>
          <div className="text-center p-2 border-t">
            <p className="font-medium text-sm">{name}</p>
            <div className="mt-2 flex justify-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7 px-2 bg-gray-100">
                未授权
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onAuthorize()
                }}
              >
                授权
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
