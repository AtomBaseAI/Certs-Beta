'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

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

interface CertificateTemplate {
  id: string
  name: string
  description?: string
  width?: number
  height?: number
  backgroundColor?: string
  backgroundImage?: string
  elements?: TemplateElement[]
  isDefault: boolean
  createdAt: string
}

interface TemplatePreviewProps {
  isOpen: boolean
  onClose: () => void
  template: CertificateTemplate | null
  onDownload?: (template: CertificateTemplate) => void
}

export function TemplatePreview({ isOpen, onClose, template, onDownload }: TemplatePreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  
  // Calculate aspect ratio and fit to container
  const calculateZoomToFit = () => {
    const containerWidth = 800 // Max container width
    const containerHeight = 600 // Max container height
    const templateWidth = template?.width || 1123
    const templateHeight = template?.height || 794
    
    const scaleX = containerWidth / templateWidth
    const scaleY = containerHeight / templateHeight
    const fitZoom = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 100%
    
    return fitZoom
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3))
  }

  const handleZoomToFit = () => {
    setZoomLevel(calculateZoomToFit())
  }

  // Initialize zoom to fit
  React.useEffect(() => {
    if (isOpen && template) {
      setZoomLevel(calculateZoomToFit())
    }
  }, [isOpen, template])

  if (!template) return null

  const templateWidth = template.width || 1123
  const templateHeight = template.height || 794

  // Sample data for dynamic fields
  const sampleData = {
    userName: 'John Doe',
    programName: 'Web Development Fundamentals',
    organizationName: 'Sample Education Institute',
    completionDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Replace dynamic field placeholders with sample data
  const replaceDynamicFields = (content: string) => {
    if (!content) return ''
    return content
      .replace(/\{\{userName\}\}/g, sampleData.userName)
      .replace(/\{\{programName\}\}/g, sampleData.programName)
      .replace(/\{\{organizationName\}\}/g, sampleData.organizationName)
      .replace(/\{\{completionDate\}\}/g, sampleData.completionDate)
  }

  // Render element based on type
  const renderElement = (element: TemplateElement) => {
    if (element.hidden) return null

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      color: element.color || '#000000',
      fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
      fontWeight: element.fontWeight || 'normal',
      fontFamily: element.fontFamily || 'Arial, sans-serif',
      fontStyle: element.fontStyle || 'normal',
      textDecoration: element.textDecoration || 'none',
      textAlign: element.textAlign || 'left',
      backgroundColor: element.backgroundColor || 'transparent',
    }

    switch (element.type) {
      case 'text':
      case 'dynamic-text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              width: element.width || 'auto',
              height: element.height || 'auto',
            }}
          >
            {replaceDynamicFields(element.content || '')}
          </div>
        )
      
      case 'rectangle':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              width: element.width || 100,
              height: element.height || 100,
              border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || '#000000'}` : 'none',
              backgroundColor: element.backgroundColor || 'transparent',
            }}
          />
        )
      
      case 'image':
        return (
          <img
            key={element.id}
            src={element.imageUrl || '/placeholder-image.png'}
            alt=""
            style={{
              ...baseStyle,
              width: element.width || 100,
              height: element.height || 100,
              objectFit: 'contain',
            }}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Preview: {template.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
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
            
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(template)}
              >
                <Download className="w-4 h-4 mr-1" />
                Download PDF
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="overflow-auto flex-1 bg-gray-50 p-4">
          <div className="flex justify-center items-center min-h-full">
            <div className="p-[5%] border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div
                className="border shadow-lg bg-white transition-transform duration-200"
                style={{
                  width: templateWidth,
                  height: templateHeight,
                  backgroundColor: template.backgroundColor || '#ffffff',
                  backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                }}
              >
                {template.elements?.map(renderElement)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}