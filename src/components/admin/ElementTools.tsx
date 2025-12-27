'use client'

import { Button } from '@/components/ui/button'
import { Type, Hash, Square, Image as ImageIcon } from 'lucide-react'

interface ElementToolsProps {
  onAddElement: (type: 'text' | 'dynamic-text' | 'rectangle' | 'image') => void
}

export function ElementTools({ onAddElement }: ElementToolsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddElement('text')}
        className="h-8 px-2 py-1 text-xs"
      >
        <Type className="w-3 h-3 mr-1" />
        Text
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddElement('dynamic-text')}
        className="h-8 px-2 py-1 text-xs"
      >
        <Hash className="w-3 h-3 mr-1" />
        Dynamic
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddElement('rectangle')}
        className="h-8 px-2 py-1 text-xs"
      >
        <Square className="w-3 h-3 mr-1" />
        Square
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAddElement('image')}
        className="h-8 px-2 py-1 text-xs"
      >
        <ImageIcon className="w-3 h-3 mr-1" />
        Image
      </Button>
    </div>
  )
}