'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
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
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })

  // Calculate zoom to fit canvas in container
  const calculateZoomToFit = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return 1
    
    const container = containerRef.current
    const containerWidth = container.clientWidth - 48 // Account for padding
    const containerHeight = container.clientHeight - 100 // Account for controls
    
    const scaleX = containerWidth / design.width
    const scaleY = containerHeight / design.height
    const fitZoom = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 100%
    
    return Math.max(fitZoom, 0.3) // Minimum zoom level
  }, [design.width, design.height])

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3))
  }

  const handleZoomToFit = () => {
    setZoomLevel(calculateZoomToFit())
  }

  // Initialize zoom to fit when design changes
  React.useEffect(() => {
    setZoomLevel(calculateZoomToFit())
  }, [calculateZoomToFit])

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

    const elementX = element.x
    const elementY = element.y

    onElementSelect(element)
    setIsDragging(true)
    setDragOffset({
      x: (e.clientX - rect.left) / zoomLevel - elementX,
      y: (e.clientY - rect.top) / zoomLevel - elementY
    })
    setDragStartPos({
      x: elementX + (element.width || 50) / 2,
      y: elementY + (element.height || 20) / 2
    })
  }, [onElementSelect, zoomLevel])

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

    // Calculate padding (1rem = 16px at 16px base font size)
    const padding = 1 * 16

    if (isDragging && selectedElement) {
      const newX = Math.max(padding, Math.min((e.clientX - rect.left) / zoomLevel - dragOffset.x, design.width - 50 - padding))
      const newY = Math.max(padding, Math.min((e.clientY - rect.top) / zoomLevel - dragOffset.y, design.height - 50 - padding))
      
      updateElement(selectedElement.id, {
        x: newX,
        y: newY
      })
    } else if (isResizing && selectedElement) {
      const mouseX = (e.clientX - rect.left) / zoomLevel
      const mouseY = (e.clientY - rect.top) / zoomLevel
      
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
  }, [isDragging, isResizing, selectedElement, dragOffset, design.width, design.height, updateElement, resizeHandle, zoomLevel])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
    setDragStartPos({ x: 0, y: 0 })
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
      fontFamily: element.fontFamily,
      fontStyle: element.fontStyle,
      textDecoration: element.textDecoration,
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
                fontWeight: element.fontWeight,
                fontFamily: element.fontFamily,
                fontStyle: element.fontStyle,
                textDecoration: element.textDecoration
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
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-100" ref={containerRef}>
      {/* Zoom Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-white shadow-sm">
        <div className="text-sm font-medium text-gray-600">
          Canvas ({design.width} × {design.height}px)
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.3}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomToFit}
              className="h-8 w-8 p-0"
              title="Fit to screen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-center items-center min-h-full">
          <div className="border border-gray-300 dark:border-gray-600 bg-white rounded-lg">
            <div
              ref={canvasRef}
              className="relative shadow-lg transition-transform duration-200"
              style={{
                width: design.width,
                height: design.height,
                backgroundColor: design.backgroundColor,
                backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center',
                padding: '1rem',
                boxSizing: 'border-box'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
            >
            {/* Grid background - only in usable area */}
            <div 
              className="absolute pointer-events-none opacity-10"
              style={{
                top: '1rem',
                left: '1rem',
                right: '1rem',
                bottom: '1rem',
                backgroundImage: `
                  repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 20px, #000 21px),
                  repeating-linear-gradient(90deg, #000 0px, transparent 1px, transparent 20px, #000 21px)
                `
              }}
            />

          {/* Center helper lines - shown when dragging */}
            {isDragging && selectedElement && (
              <>
                {/* Vertical center line */}
                <div 
                  className="absolute pointer-events-none border-l-2 border-dashed border-blue-400 opacity-60"
                  style={{
                    left: `${dragStartPos.x}px`,
                    top: '1rem',
                    bottom: '1rem',
                    borderLeftWidth: '2px',
                    borderStyle: 'dashed',
                    borderColor: 'rgb(96 165 250)', // blue-400
                    opacity: 0.6
                  }}
                />
                {/* Horizontal center line */}
                <div 
                  className="absolute pointer-events-none border-t-2 border-dashed border-blue-400 opacity-60"
                  style={{
                    top: `${dragStartPos.y}px`,
                    left: '1rem',
                    right: '1rem',
                    borderTopWidth: '2px',
                    borderStyle: 'dashed',
                    borderColor: 'rgb(96 165 250)', // blue-400
                    opacity: 0.6
                  }}
                />
                {/* Center point indicator */}
                <div 
                  className="absolute pointer-events-none w-3 h-3 bg-blue-500 rounded-full opacity-80"
                  style={{
                    left: `${dragStartPos.x - 6}px`,
                    top: `${dragStartPos.y - 6}px`,
                    backgroundColor: 'rgb(59 130 246)', // blue-500
                    opacity: 0.8
                  }}
                />
              </>
            )}
            
            {/* Render elements */}
            {design.elements.map(renderElement)}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}