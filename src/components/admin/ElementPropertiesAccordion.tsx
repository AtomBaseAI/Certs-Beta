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
import { Type, Square, Image as ImageIcon, Hash } from 'lucide-react'

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

interface ElementPropertiesAccordionProps {
  element: TemplateElement
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<TemplateElement>) => void
}

export function ElementPropertiesAccordion({
  element,
  isSelected,
  onSelect,
  onUpdate
}: ElementPropertiesAccordionProps) {
  const dynamicFields = [
    { value: 'userName', label: 'User Name' },
    { value: 'userEmail', label: 'User Email' },
    { value: 'completionDate', label: 'Completion Date' },
    { value: 'programName', label: 'Program Name' },
    { value: 'organizationName', label: 'Organization Name' },
    { value: 'certificateId', label: 'Certificate ID' },
    { value: 'issueDate', label: 'Issue Date' }
  ]

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />
      case 'dynamic-text': return <Hash className="w-4 h-4" />
      case 'rectangle': return <Square className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  const getElementName = (type: string) => {
    switch (type) {
      case 'text': return 'Text'
      case 'dynamic-text': return 'Dynamic Text'
      case 'rectangle': return 'Rectangle'
      case 'image': return 'Image'
      default: return 'Element'
    }
  }

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full"
    >
      <AccordionItem 
        value={element.id} 
        className={`border rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        <AccordionTrigger 
          onClick={onSelect}
          className="px-3 py-2 hover:no-underline data-[state=open]:bg-gray-50"
        >
          <div className="flex items-center gap-2 text-sm">
            {getElementIcon(element.type)}
            <span className="font-medium">
              {getElementName(element.type)} {element.id.split('-')[1]}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 space-y-3">
          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`element-x-${element.id}`} className="text-xs">X</Label>
              <Input
                id={`element-x-${element.id}`}
                type="number"
                value={element.x}
                onChange={(e) => onUpdate({
                  x: parseInt(e.target.value) || 0
                })}
                className="mt-1 h-8"
              />
            </div>
            <div>
              <Label htmlFor={`element-y-${element.id}`} className="text-xs">Y</Label>
              <Input
                id={`element-y-${element.id}`}
                type="number"
                value={element.y}
                onChange={(e) => onUpdate({
                  y: parseInt(e.target.value) || 0
                })}
                className="mt-1 h-8"
              />
            </div>
          </div>

          {/* Size (for rectangle and image) */}
          {(element.type === 'rectangle' || element.type === 'image') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`element-width-${element.id}`} className="text-xs">Width</Label>
                <Input
                  id={`element-width-${element.id}`}
                  type="number"
                  value={element.width || 100}
                  onChange={(e) => onUpdate({
                    width: parseInt(e.target.value) || 100
                  })}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label htmlFor={`element-height-${element.id}`} className="text-xs">Height</Label>
                <Input
                  id={`element-height-${element.id}`}
                  type="number"
                  value={element.height || 100}
                  onChange={(e) => onUpdate({
                    height: parseInt(e.target.value) || 100
                  })}
                  className="mt-1 h-8"
                />
              </div>
            </div>
          )}

          {/* Text Properties */}
          {(element.type === 'text' || element.type === 'dynamic-text') && (
            <>
              <div>
                <Label htmlFor={`element-content-${element.id}`} className="text-xs">
                  {element.type === 'dynamic-text' ? 'Dynamic Field' : 'Text Content'}
                </Label>
                {element.type === 'dynamic-text' ? (
                  <Select
                    value={element.fieldName || 'userName'}
                    onValueChange={(value) => {
                      const field = dynamicFields.find(f => f.value === value)
                      onUpdate({
                        fieldName: value,
                        content: `{{${value}}}`
                      })
                    }}
                  >
                    <SelectTrigger className="mt-1 h-8">
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
                    id={`element-content-${element.id}`}
                    value={element.content || ''}
                    onChange={(e) => onUpdate({
                      content: e.target.value
                    })}
                    placeholder="Enter text content"
                    className="mt-1 min-h-[60px] resize-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`element-fontsize-${element.id}`} className="text-xs">Font Size</Label>
                  <Input
                    id={`element-fontsize-${element.id}`}
                    type="number"
                    value={element.fontSize || 16}
                    onChange={(e) => onUpdate({
                      fontSize: parseInt(e.target.value) || 16
                    })}
                    className="mt-1 h-8"
                  />
                </div>

                <div>
                  <Label htmlFor={`element-align-${element.id}`} className="text-xs">Align</Label>
                  <Select
                    value={element.textAlign || 'left'}
                    onValueChange={(value: 'left' | 'center' | 'right') => 
                      onUpdate({
                        textAlign: value
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={`element-color-${element.id}`} className="text-xs">Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id={`element-color-${element.id}`}
                    type="color"
                    value={element.color || '#000000'}
                    onChange={(e) => onUpdate({
                      color: e.target.value
                    })}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={element.color || '#000000'}
                    onChange={(e) => onUpdate({
                      color: e.target.value
                    })}
                    placeholder="#000000"
                    className="flex-1 h-8"
                  />
                </div>
              </div>
            </>
          )}

          {/* Rectangle Properties */}
          {element.type === 'rectangle' && (
            <>
              <div>
                <Label htmlFor={`element-bg-color-${element.id}`} className="text-xs">Background</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id={`element-bg-color-${element.id}`}
                    type="color"
                    value={element.backgroundColor || '#f0f0f0'}
                    onChange={(e) => onUpdate({
                      backgroundColor: e.target.value
                    })}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={element.backgroundColor || '#f0f0f0'}
                    onChange={(e) => onUpdate({
                      backgroundColor: e.target.value
                    })}
                    placeholder="#f0f0f0"
                    className="flex-1 h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`element-border-color-${element.id}`} className="text-xs">Border</Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      id={`element-border-color-${element.id}`}
                      type="color"
                      value={element.borderColor || '#000000'}
                      onChange={(e) => onUpdate({
                        borderColor: e.target.value
                      })}
                      className="w-8 h-8 p-1"
                    />
                    <Input
                      value={element.borderColor || '#000000'}
                      onChange={(e) => onUpdate({
                        borderColor: e.target.value
                      })}
                      placeholder="#000000"
                      className="flex-1 h-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`element-border-width-${element.id}`} className="text-xs">Width</Label>
                  <Input
                    id={`element-border-width-${element.id}`}
                    type="number"
                    value={element.borderWidth || 1}
                    onChange={(e) => onUpdate({
                      borderWidth: parseInt(e.target.value) || 0
                    })}
                    className="mt-1 h-8"
                  />
                </div>
              </div>
            </>
          )}

          {/* Image Properties */}
          {element.type === 'image' && (
            <div>
              <Label htmlFor={`element-image-url-${element.id}`} className="text-xs">Image URL</Label>
              <Input
                id={`element-image-url-${element.id}`}
                value={element.imageUrl || ''}
                onChange={(e) => onUpdate({
                  imageUrl: e.target.value
                })}
                placeholder="https://example.com/image.jpg"
                className="mt-1 h-8"
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}