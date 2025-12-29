'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Settings, Loader2 } from 'lucide-react'
import { DesignCanvas } from './DesignCanvas'
import { ElementPropertiesAccordion } from './ElementPropertiesAccordion'
import { ElementTools } from './ElementTools'

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

interface TemplateDesign {
  width: number
  height: number
  backgroundColor: string
  backgroundImage: string
  elements: TemplateElement[]
}

interface TemplateEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: { name: string; description: string; design: TemplateDesign }) => void
  editingTemplate?: CertificateTemplate | null
  saving?: boolean
}

export function TemplateEditor({ isOpen, onClose, onSave, editingTemplate, saving = false }: TemplateEditorProps) {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateDesign, setTemplateDesign] = useState<TemplateDesign>({
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff',
    backgroundImage: '',
    elements: []
  })
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null)

  // Populate form when editing template changes
  useEffect(() => {
    if (editingTemplate) {
      setTemplateName(editingTemplate.name || '')
      setTemplateDescription(editingTemplate.description || '')
      setTemplateDesign({
        width: editingTemplate.width || 1123,
        height: editingTemplate.height || 794,
        backgroundColor: editingTemplate.backgroundColor || '#ffffff',
        backgroundImage: editingTemplate.backgroundImage || '',
        elements: editingTemplate.elements || []
      })
    } else {
      // Reset form for new template
      setTemplateName('')
      setTemplateDescription('')
      setTemplateDesign({
        width: 1123,
        height: 794,
        backgroundColor: '#ffffff',
        backgroundImage: '',
        elements: []
      })
    }
    setSelectedElement(null)
  }, [editingTemplate, isOpen])

  // Function to generate element titles
  const generateElementTitle = (type: string, elements: TemplateElement[]) => {
    const existingElements = elements.filter(el => el.type === type)
    const count = existingElements.length + 1
    
    switch (type) {
      case 'text':
      case 'dynamic-text':
        return `Text ${count}`
      case 'image':
        return `Image ${count}`
      case 'rectangle':
        return `Rectangle ${count}`
      default:
        return `Element ${count}`
    }
  }

  const handleSave = () => {
    if (!templateName.trim()) return
    
    onSave({
      name: templateName,
      description: templateDescription,
      design: templateDesign
    })
    
    // Reset form
    setTemplateName('')
    setTemplateDescription('')
    setTemplateDesign({
      width: 1123,
      height: 794,
      backgroundColor: '#ffffff',
      backgroundImage: '',
      elements: []
    })
    setSelectedElement(null)
    onClose()
  }

  const handleClose = () => {
    setTemplateName('')
    setTemplateDescription('')
    setTemplateDesign({
      width: 1123,
      height: 794,
      backgroundColor: '#ffffff',
      backgroundImage: '',
      elements: []
    })
    setSelectedElement(null)
    onClose()
  }

  const handleAddElement = (type: string) => {
    const title = generateElementTitle(type, templateDesign.elements)
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      title,
      content: type === 'text' ? title : 
              type === 'dynamic-text' ? '{{userName}}' : '',
      fontSize: 16,
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      width: type === 'rectangle' ? 100 : undefined,
      height: type === 'rectangle' ? 100 : undefined,
      backgroundColor: type === 'rectangle' ? '#f0f0f0' : undefined,
      borderColor: type === 'rectangle' ? '#000000' : undefined,
      borderWidth: type === 'rectangle' ? 1 : undefined,
      hidden: false,
      locked: false
    }
    
    setTemplateDesign(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))
  }

  const handleDeleteElement = (elementId: string) => {
    if (!confirm('Are you sure you want to delete this element?')) return
    
    setTemplateDesign(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }))
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null)
    }
  }

  const handleToggleHide = (elementId: string) => {
    setTemplateDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, hidden: !el.hidden } : el
      )
    }))
  }

  const handleToggleLock = (elementId: string) => {
    setTemplateDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, locked: !el.locked } : el
      )
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!w-[99vw] !h-[99vh] !max-w-[99vw] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header with title and tools in same row */}
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
            <DialogTitle className="text-lg font-semibold">
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </DialogTitle>
            <div className="flex-1 flex justify-center">
              <ElementTools
                onAddElement={handleAddElement}
              />
            </div>
          </DialogHeader>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left side - Design Canvas */}
            <div className="flex-1 border-r">
              <DesignCanvas
                design={templateDesign}
                onDesignChange={setTemplateDesign}
                selectedElement={selectedElement}
                onElementSelect={setSelectedElement}
              />
            </div>

            {/* Right side - Properties */}
            <div className="w-80 flex flex-col h-full">
              {/* Template Properties - Fixed Top */}
              <div className="flex-shrink-0 border-b bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                <div className="border">
                  <Accordion type="single" collapsible defaultValue="template-properties" className="w-full">
                    <AccordionItem value="template-properties" className="border-0">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Settings className="w-4 h-4" />
                          Template Properties
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 space-y-4">
                        <div>
                          <Label htmlFor="template-name" className="text-xs font-medium">Name</Label>
                          <Input
                            id="template-name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Enter template name"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="template-description" className="text-xs font-medium">Description</Label>
                          <Textarea
                            id="template-description"
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            placeholder="Enter template description"
                            className="mt-1 min-h-[60px]"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="bg-color" className="text-xs font-medium">Background Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="bg-color"
                              type="color"
                              value={templateDesign.backgroundColor}
                              onChange={(e) => setTemplateDesign({
                                ...templateDesign,
                                backgroundColor: e.target.value
                              })}
                              className="w-16 h-8 p-1"
                            />
                            <Input
                              value={templateDesign.backgroundColor}
                              onChange={(e) => setTemplateDesign({
                                ...templateDesign,
                                backgroundColor: e.target.value
                              })}
                              placeholder="#ffffff"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="bg-image" className="text-xs font-medium">Background Image URL</Label>
                          <Input
                            id="bg-image"
                            value={templateDesign.backgroundImage}
                            onChange={(e) => setTemplateDesign({
                              ...templateDesign,
                              backgroundImage: e.target.value
                            })}
                            placeholder="https://example.com/image.jpg"
                            className="mt-1"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              {/* Individual Element Properties - Scrollable Middle with Fixed Height */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 scrollbar-thin">
                {templateDesign.elements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">
                      No elements yet. Add elements using the tools above.
                    </div>
                  </div>
                ) : (
                  templateDesign.elements.map((element) => (
                    <ElementPropertiesAccordion
                      key={element.id}
                      element={element}
                      isSelected={selectedElement?.id === element.id}
                      onSelect={() => setSelectedElement(element)}
                      onUpdate={(updates) => {
                        setTemplateDesign(prev => ({
                          ...prev,
                          elements: prev.elements.map(el =>
                            el.id === element.id ? { ...el, ...updates } : el
                          )
                        }))
                      }}
                      onDelete={() => handleDeleteElement(element.id)}
                      onToggleHide={() => handleToggleHide(element.id)}
                      onToggleLock={() => handleToggleLock(element.id)}
                    />
                  ))
                )}
              </div>

              {/* Save Button - Fixed Bottom */}
              <div className="flex-shrink-0 border-t bg-white/95 backdrop-blur-sm p-4 shadow-lg border-gray-200">
                <Button 
                  onClick={handleSave} 
                  disabled={!templateName.trim() || saving}
                  className="w-full h-11 font-medium shadow-sm hover:shadow-md transition-shadow"
                  size="default"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Template'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}