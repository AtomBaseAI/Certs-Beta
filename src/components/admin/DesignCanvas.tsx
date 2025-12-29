'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface TemplateElement {
  id: string
  type: 'text' | 'dynamic-text' | 'rectangle' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  imageUrl?: string
  fieldName?: string
  title?: string
  hidden?: boolean
  locked?: boolean
}

interface TemplateDesign {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: string
  elements: TemplateElement[]
}

interface DesignCanvasProps {
  design: TemplateDesign
  onDesignChange: (design: TemplateDesign) => void
  selectedElement: TemplateElement | null
  onElementSelect: (element: TemplateElement | null) => void
}

export function DesignCanvas({ 
  design, 
  onDesignChange, 
  selectedElement, 
  onElementSelect 
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState('')

  const updateElement = useCallback((id: string, updates: Partial<TemplateElement>) => {
    onDesignChange({
      ...design,
      elements: design.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    })
  }, [design, onDesignChange])

  const handleMouseDown = useCallback((e: React.MouseEvent, element: TemplateElement) => {
    e.stopPropagation()
    
    // Don't allow interaction with locked elements
    if (element.locked) {
      onElementSelect(element)
      return
    }
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    onElementSelect(element)
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left - element.x,
      y: e.clientY - rect.top - element.y
    })
  }, [onElementSelect])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, element: TemplateElement, handle: string) => {
    e.stopPropagation()
    
    // Don't allow resizing locked elements
    if (element.locked) {
      onElementSelect(element)
      return
    }
    
    onElementSelect(element)
    setIsResizing(true)
    setResizeHandle(handle)
  }, [onElementSelect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (isDragging && selectedElement) {
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, design.width - 50))
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, design.height - 50))
      
      updateElement(selectedElement.id, {
        x: newX,
        y: newY
      })
    } else if (isResizing && selectedElement) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      let updates: Partial<TemplateElement> = {}
      
      switch (resizeHandle) {
        case 'se':
          updates.width = Math.max(20, mouseX - selectedElement.x)
          updates.height = Math.max(20, mouseY - selectedElement.y)
          break
        case 'e':
          updates.width = Math.max(20, mouseX - selectedElement.x)
          break
        case 's':
          updates.height = Math.max(20, mouseY - selectedElement.y)
          break
      }
      
      updateElement(selectedElement.id, updates)
    }
  }, [isDragging, isResizing, selectedElement, dragOffset, design.width, design.height, updateElement, resizeHandle])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
  }, [])

  const handleCanvasClick = useCallback(() => {
    onElementSelect(null)
  }, [onElementSelect])

  const renderElement = (element: TemplateElement) => {
    // Skip hidden elements
    if (element.hidden) {
      return null
    }
    
    const isSelected = selectedElement?.id === element.id
    const isResizable = element.type === 'rectangle' || element.type === 'image'

    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      textAlign: element.textAlign,
      color: element.color,
      backgroundColor: element.backgroundColor,
      borderColor: element.borderColor,
      borderWidth: element.borderWidth,
      borderStyle: element.borderWidth ? 'solid' : 'none',
      cursor: element.locked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
      userSelect: 'none',
      opacity: element.locked ? 0.7 : 1
    }

    const renderContent = () => {
      switch (element.type) {
        case 'text':
        case 'dynamic-text':
          return (
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden"
              style={{
                textAlign: element.textAlign,
                color: element.color,
                fontSize: element.fontSize,
                fontWeight: element.fontWeight
              }}
            >
              <div className="line-clamp-2 w-full">
                {element.content || element.title || 'Text'}
              </div>
            </div>
          )
        case 'rectangle':
          return (
            <div 
              className="w-full h-full"
              style={{
                backgroundColor: element.backgroundColor,
                borderColor: element.borderColor,
                borderWidth: element.borderWidth,
                borderStyle: element.borderWidth ? 'solid' : 'none'
              }}
            />
          )
        case 'image':
          return (
            <img 
              src={element.imageUrl || '/placeholder-image.png'} 
              alt={element.title || 'Template element'}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )
        default:
          return null
      }
    }

    return (
      <div
        key={element.id}
        style={elementStyle}
        className={cn(
          'transition-shadow',
          isSelected && 'ring-2 ring-blue-500 ring-offset-1',
          element.locked && 'opacity-70'
        )}
        onMouseDown={(e) => handleMouseDown(e, element)}
        title={element.title || `${element.type} element`}
      >
        {renderContent()}
        
        {/* Resize handles for selected element (only if not locked) */}
        {isSelected && isResizable && !element.locked && (
          <>
            <div
              className="absolute w-3 h-3 bg-blue-500 -bottom-1 -right-1 cursor-se-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 'se')}
            />
            <div
              className="absolute w-3 h-3 bg-blue-500 -right-1 top-1/2 -translate-y-1/2 cursor-e-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 'e')}
            />
            <div
              className="absolute w-3 h-3 bg-blue-500 -bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element, 's')}
            />
          </>
        )}
        
        {/* Lock indicator */}
        {element.locked && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-white"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full p-6 overflow-auto bg-gray-100">
      <div
        ref={canvasRef}
        className="relative mx-auto bg-white shadow-lg"
        style={{
          width: design.width,
          height: design.height,
          backgroundColor: design.backgroundColor,
          backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 20px, #000 21px),
              repeating-linear-gradient(90deg, #000 0px, transparent 1px, transparent 20px, #000 21px)
            `
          }}
        />
        
        {/* Render elements */}
        {design.elements.map(renderElement)}
      </div>
    </div>
  )
}