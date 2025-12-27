'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Settings } from 'lucide-react'
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
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  imageUrl?: string
  fieldName?: string
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
}

export function TemplateEditor({ isOpen, onClose, onSave }: TemplateEditorProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!w-[99vw] !h-[99vh] !max-w-[99vw] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header with title and tools */}
          <DialogHeader className="flex flex-col items-center space-y-3 p-4 border-b">
            <DialogTitle className="text-lg font-semibold">New Template</DialogTitle>
            <ElementTools
              onAddElement={(type) => {
                const newElement: TemplateElement = {
                  id: `element-${Date.now()}`,
                  type,
                  x: 50,
                  y: 50,
                  content: type === 'text' ? 'Sample Text' : 
                          type === 'dynamic-text' ? '{{userName}}' : '',
                  fontSize: 16,
                  color: '#000000',
                  width: type === 'rectangle' ? 100 : undefined,
                  height: type === 'rectangle' ? 100 : undefined,
                  backgroundColor: type === 'rectangle' ? '#f0f0f0' : undefined,
                  borderColor: type === 'rectangle' ? '#000000' : undefined,
                  borderWidth: type === 'rectangle' ? 1 : undefined,
                }
                
                setTemplateDesign(prev => ({
                  ...prev,
                  elements: [...prev.elements, newElement]
                }))
              }}
            />
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
            <div className="w-80 flex flex-col">
              {/* Template Properties and Element Properties */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Template Properties Accordion */}
                <div className="border rounded-lg">
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

                {/* Individual Element Properties */}
                {templateDesign.elements.map((element) => (
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
                  />
                ))}
              </div>

              {/* Save Button */}
              <div className="border-t p-4">
                <Button 
                  onClick={handleSave} 
                  disabled={!templateName.trim()}
                  className="w-full"
                >
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}