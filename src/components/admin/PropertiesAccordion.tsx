'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

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

interface PropertiesAccordionProps {
  templateName: string
  templateDescription: string
  templateDesign: TemplateDesign
  selectedElement: TemplateElement | null
  onTemplateNameChange: (name: string) => void
  onTemplateDescriptionChange: (description: string) => void
  onTemplateDesignChange: (design: TemplateDesign) => void
  onElementUpdate: (id: string, updates: Partial<TemplateElement>) => void
}

export function PropertiesAccordion({
  templateName,
  templateDescription,
  templateDesign,
  selectedElement,
  onTemplateNameChange,
  onTemplateDescriptionChange,
  onTemplateDesignChange,
  onElementUpdate
}: PropertiesAccordionProps) {
  const dynamicFields = [
    { value: 'userName', label: 'User Name' },
    { value: 'userEmail', label: 'User Email' },
    { value: 'completionDate', label: 'Completion Date' },
    { value: 'programName', label: 'Program Name' },
    { value: 'organizationName', label: 'Organization Name' },
    { value: 'certificateId', label: 'Certificate ID' },
    { value: 'issueDate', label: 'Issue Date' }
  ]

  return (
    <div className="p-4 space-y-4">
      <Accordion type="multiple" defaultValue={['template-properties']} className="w-full">
        {/* Template Properties */}
        <AccordionItem value="template-properties">
          <AccordionTrigger className="text-sm font-medium">
            Template Properties
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div>
              <Label htmlFor="template-name" className="text-xs">Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => onTemplateNameChange(e.target.value)}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="template-description" className="text-xs">Description</Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => onTemplateDescriptionChange(e.target.value)}
                placeholder="Enter template description"
                className="mt-1 min-h-[60px]"
              />
            </div>
            
            <div>
              <Label htmlFor="bg-color" className="text-xs">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="bg-color"
                  type="color"
                  value={templateDesign.backgroundColor}
                  onChange={(e) => onTemplateDesignChange({
                    ...templateDesign,
                    backgroundColor: e.target.value
                  })}
                  className="w-16 h-8 p-1"
                />
                <Input
                  value={templateDesign.backgroundColor}
                  onChange={(e) => onTemplateDesignChange({
                    ...templateDesign,
                    backgroundColor: e.target.value
                  })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bg-image" className="text-xs">Background Image URL</Label>
              <Input
                id="bg-image"
                value={templateDesign.backgroundImage}
                onChange={(e) => onTemplateDesignChange({
                  ...templateDesign,
                  backgroundImage: e.target.value
                })}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Element Properties */}
        {selectedElement && (
          <AccordionItem value="element-properties">
            <AccordionTrigger className="text-sm font-medium">
              Element Properties
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="element-x" className="text-xs">X Position</Label>
                  <Input
                    id="element-x"
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      x: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="element-y" className="text-xs">Y Position</Label>
                  <Input
                    id="element-y"
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      y: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Size (for rectangle and image) */}
              {(selectedElement.type === 'rectangle' || selectedElement.type === 'image') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="element-width" className="text-xs">Width</Label>
                    <Input
                      id="element-width"
                      type="number"
                      value={selectedElement.width || 100}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        width: parseInt(e.target.value) || 100
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="element-height" className="text-xs">Height</Label>
                    <Input
                      id="element-height"
                      type="number"
                      value={selectedElement.height || 100}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        height: parseInt(e.target.value) || 100
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Text Properties */}
              {(selectedElement.type === 'text' || selectedElement.type === 'dynamic-text') && (
                <>
                  <div>
                    <Label htmlFor="element-content" className="text-xs">
                      {selectedElement.type === 'dynamic-text' ? 'Dynamic Field' : 'Text Content'}
                    </Label>
                    {selectedElement.type === 'dynamic-text' ? (
                      <Select
                        value={selectedElement.fieldName || 'userName'}
                        onValueChange={(value) => {
                          const field = dynamicFields.find(f => f.value === value)
                          onElementUpdate(selectedElement.id, {
                            fieldName: value,
                            content: `{{${value}}}`
                          })
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select dynamic field" />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicFields.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Textarea
                        id="element-content"
                        value={selectedElement.content || ''}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          content: e.target.value
                        })}
                        placeholder="Enter text content"
                        className="mt-1 min-h-[60px]"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="element-fontsize" className="text-xs">Font Size</Label>
                    <Input
                      id="element-fontsize"
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        fontSize: parseInt(e.target.value) || 16
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="element-fontweight" className="text-xs">Font Weight</Label>
                    <Select
                      value={selectedElement.fontWeight || 'normal'}
                      onValueChange={(value) => onElementUpdate(selectedElement.id, {
                        fontWeight: value
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="lighter">Lighter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="element-align" className="text-xs">Text Align</Label>
                    <Select
                      value={selectedElement.textAlign || 'left'}
                      onValueChange={(value: 'left' | 'center' | 'right') => 
                        onElementUpdate(selectedElement.id, {
                          textAlign: value
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="element-color" className="text-xs">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="element-color"
                        type="color"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          color: e.target.value
                        })}
                        className="w-16 h-8 p-1"
                      />
                      <Input
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          color: e.target.value
                        })}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Rectangle Properties */}
              {selectedElement.type === 'rectangle' && (
                <>
                  <div>
                    <Label htmlFor="element-bg-color" className="text-xs">Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="element-bg-color"
                        type="color"
                        value={selectedElement.backgroundColor || '#f0f0f0'}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          backgroundColor: e.target.value
                        })}
                        className="w-16 h-8 p-1"
                      />
                      <Input
                        value={selectedElement.backgroundColor || '#f0f0f0'}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          backgroundColor: e.target.value
                        })}
                        placeholder="#f0f0f0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="element-border-color" className="text-xs">Border Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="element-border-color"
                        type="color"
                        value={selectedElement.borderColor || '#000000'}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          borderColor: e.target.value
                        })}
                        className="w-16 h-8 p-1"
                      />
                      <Input
                        value={selectedElement.borderColor || '#000000'}
                        onChange={(e) => onElementUpdate(selectedElement.id, {
                          borderColor: e.target.value
                        })}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="element-border-width" className="text-xs">Border Width</Label>
                    <Input
                      id="element-border-width"
                      type="number"
                      value={selectedElement.borderWidth || 1}
                      onChange={(e) => onElementUpdate(selectedElement.id, {
                        borderWidth: parseInt(e.target.value) || 0
                      })}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {/* Image Properties */}
              {selectedElement.type === 'image' && (
                <div>
                  <Label htmlFor="element-image-url" className="text-xs">Image URL</Label>
                  <Input
                    id="element-image-url"
                    value={selectedElement.imageUrl || ''}
                    onChange={(e) => onElementUpdate(selectedElement.id, {
                      imageUrl: e.target.value
                    })}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}