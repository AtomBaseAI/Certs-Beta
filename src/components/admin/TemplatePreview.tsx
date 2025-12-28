'use client'

import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

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
  if (!template) return null

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Preview: {template.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto">
          <div className="flex justify-center">
            <div
              className="border shadow-lg bg-white"
              style={{
                width: template.width || 1123,
                height: template.height || 794,
                backgroundColor: template.backgroundColor || '#ffffff',
                backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                transform: 'scale(0.7)',
                transformOrigin: 'top center',
              }}
            >
              {template.elements?.map(renderElement)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}