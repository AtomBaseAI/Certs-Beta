'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Save,
  Eye,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Move,
  Download
} from 'lucide-react'

interface TemplateElement {
  id: string
  type: 'text' | 'rectangle' | 'image' | 'dynamic-field'
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: string
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  radius?: number
  imageUrl?: string
  fieldName?: string
  isDynamic?: boolean
}

interface CertificateTemplate {
  id: string
  name: string
  description?: string
  width?: number
  height?: number
  backgroundColor?: string
  backgroundImage?: string
  elements?: string
  isDefault: boolean
  createdAt: string
}

interface DynamicField {
  name: string
  label: string
  required: boolean
}

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [templateDesign, setTemplateDesign] = useState({
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff',
    backgroundImage: '',
    elements: [] as TemplateElement[]
  })
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([
    { name: 'userName', label: 'User Name', required: true },
    { name: 'userEmail', label: 'User Email', required: true },
    { name: 'completionDate', label: 'Completion Date', required: true },
    { name: 'programName', label: 'Program Name', required: true },
    { name: 'organizationName', label: 'Organization Name', required: true },
    { name: 'certificateId', label: 'Certificate ID', required: true }
  ])
  const [pageSize, setPageSize] = useState<'A4' | 'horizontal' | 'vertical'>('horizontal')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchTemplates()
    }
  }, [session])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = (template: CertificateTemplate) => {
    setTemplateDesign({
      width: template.width || 1123,
      height: template.height || 794,
      backgroundColor: template.backgroundColor || '#ffffff',
      backgroundImage: template.backgroundImage || '',
      elements: template.elements as TemplateElement[] || []
    })
    setSelectedTemplate(template)
    setIsEditing(false)
  }

  const startEditTemplate = (template: CertificateTemplate) => {
    setTemplateDesign({
      width: template.width || 1123,
      height: template.height || 794,
      backgroundColor: template.backgroundColor || '#ffffff',
      backgroundImage: template.backgroundImage || '',
      elements: template.elements as TemplateElement[] || []
    })
    setSelectedTemplate(template)
    setFormData({ name: template.name, description: template.description || '' })
    setIsEditing(true)
  }

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      ...(type === 'text' && {
        content: 'Sample Text',
        fontSize: 16,
        color: '#000000'
      }),
      ...(type === 'dynamic-field' && {
        content: '{{userName}}',
        fontSize: 16,
        color: '#000000',
        fieldName: 'userName',
        isDynamic: true
      }),
      ...(type === 'rectangle' && {
        width: 200,
        height: 100,
        borderColor: '#000000',
        borderWidth: 2
      }),
      ...(type === 'image' && {
        width: 200,
        height: 150,
        imageUrl: 'https://picsum.photos/seed/cert-template/200/150.jpg'
      })
    }
    
    setTemplateDesign(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))
  }

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setTemplateDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }))
  }

  const deleteElement = (id: string) => {
    const element = templateDesign.elements.find(el => el.id === id)
    if (element?.fieldName === 'certificateId') {
      return
    }
    
    setTemplateDesign(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }))
    setSelectedElement(null)
  }

  const handleMouseDown = (e: React.MouseEvent, element: TemplateElement) => {
    if (!isEditing) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    setSelectedElement(element)
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left - element.x,
      y: e.clientY - rect.top - element.y
    })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !isEditing) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y
    
    updateElement(selectedElement.id, { x, y })
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const saveTemplate = async () => {
    try {
      const url = selectedTemplate ? `/api/templates/${selectedTemplate.id}` : '/api/templates'
      const method = selectedTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          width: templateDesign.width,
          height: templateDesign.height,
          backgroundColor: templateDesign.backgroundColor,
          backgroundImage: templateDesign.backgroundImage,
          elements: templateDesign.elements
        })
      })

      if (response.ok) {
        await fetchTemplates()
        setIsEditing(false)
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTemplates()
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const initializeNewTemplate = () => {
    const dimensions = pageSize === 'A4' ? { width: 794, height: 1123 } : 
                       pageSize === 'horizontal' ? { width: 1123, height: 794 } : 
                       { width: 794, height: 1123 }
    
    const newDesign = {
      ...dimensions,
      backgroundColor: '#ffffff',
      backgroundImage: '',
      elements: [
        {
          id: 'certificate-id-default',
          type: 'dynamic-field' as const,
          x: dimensions.width - 200,
          y: 20,
          content: '{{certificateId}}',
          fontSize: 12,
          color: '#666666',
          fieldName: 'certificateId',
          isDynamic: true
        }
      ]
    }
    
    setFormData({ name: '', description: '' })
    setTemplateDesign(newDesign)
    setSelectedTemplate(null)
    setIsEditing(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Certificate Templates</h1>
          </div>
          <Button onClick={initializeNewTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isEditing ? (
          <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
            <div className="lg:col-span-9 flex flex-col">
              <div className="flex-1 bg-white rounded-lg border p-4">
                <div className="w-full h-full overflow-auto border rounded-lg">
                  <div
                    ref={canvasRef}
                    className="relative bg-white"
                    style={{
                      width: templateDesign.width,
                      height: templateDesign.height,
                      backgroundColor: templateDesign.backgroundColor,
                      backgroundImage: templateDesign.backgroundImage ? `url(${templateDesign.backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, #f0f0f0 20px, #f0f0f0 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, #f0f0f0 21px, #f0f0f0 21px), ${templateDesign.backgroundImage ? `url(${templateDesign.backgroundImage})` : 'none'}`,
                      backgroundSize: '21px 21px, 21px 21px, cover',
                      backgroundPosition: 'top left, top left, center',
                      border: '2px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  >
                    {templateDesign.elements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-move ${
                          selectedElement?.id === element.id ? 'ring-2 ring-primary' : ''
                        } ${element.fieldName === 'certificateId' ? 'pointer-events-none' : ''}`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width || 'auto',
                          height: element.height || 'auto',
                          ...(element.type === 'text' && {
                            fontSize: element.fontSize,
                            color: element.color,
                            fontWeight: element.fontWeight,
                            textAlign: element.textAlign as any
                          }),
                          ...(element.type === 'dynamic-field' && {
                            fontSize: element.fontSize,
                            color: element.color,
                            fontWeight: element.fontWeight,
                            textAlign: element.textAlign as any,
                            border: '1px dashed #3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)'
                          }),
                          ...(element.type === 'rectangle' && {
                            border: `${element.borderWidth}px solid ${element.borderColor}`,
                            backgroundColor: element.backgroundColor
                          }),
                          ...(element.type === 'image' && {
                            backgroundImage: element.imageUrl ? `url(${element.imageUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid #e5e7eb'
                          })
                        }}
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element)}
                      >
                        {(element.type === 'text' || element.type === 'dynamic-field') && element.content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col">
              <div className="bg-white rounded-lg border p-4 mb-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">Add Elements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('text')}
                      className="h-8 text-xs"
                    >
                      <Type className="h-3 w-3 mr-1" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('dynamic-field')}
                      className="h-8 text-xs"
                    >
                      <Type className="h-3 w-3 mr-1" />
                      Dynamic
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('rectangle')}
                      className="h-8 text-xs"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Rectangle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('image')}
                      className="h-8 text-xs"
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Image
                    </Button>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex-1 space-y-4">
                <Accordion type="multiple" defaultValue={["template-options"]} className="bg-white rounded-lg border">
                  <AccordionItem value="template-options">
                    <AccordionTrigger className="px-4">
                      Template Options
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input
                          id="templateName"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter template name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="templateDescription">Description</Label>
                        <Textarea
                          id="templateDescription"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Page Size:</Label>
                        <Select value={pageSize} onValueChange={(value: 'A4' | 'horizontal' | 'vertical') => {
                          setPageSize(value)
                          const dimensions = value === 'A4' ? { width: 794, height: 1123 } : 
                                             value === 'horizontal' ? { width: 1123, height: 794 } : 
                                             { width: 794, height: 1123 }
                          setTemplateDesign(prev => ({ ...prev, ...dimensions }))
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="horizontal">A4 Landscape</SelectItem>
                            <SelectItem value="vertical">A4 Portrait</SelectItem>
                          </SelectContent>
                        </Select>
                      </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="color"
                            value={templateDesign.backgroundColor}
                            onChange={(e) => setTemplateDesign(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Input
                            value={templateDesign.backgroundColor}
                            onChange={(e) => setTemplateDesign(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Background Image URL</Label>
                        <Input
                          value={templateDesign.backgroundImage}
                          onChange={(e) => setTemplateDesign(prev => ({ ...prev, backgroundImage: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Accordion type="multiple" defaultValue={["element-options"]} className="bg-white rounded-lg border">
                  <AccordionItem value="element-options">
                    <AccordionTrigger className="px-4">
                      Element Options
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      {selectedElement ? (
                        <>
                          <div className="space-y-2">
                            <Label>Element Type</Label>
                            <Badge variant="secondary">
                              {selectedElement.type === 'text' ? 'Text' :
                               selectedElement.type === 'dynamic-field' ? 'Dynamic Field' :
                               selectedElement.type === 'rectangle' ? 'Rectangle' : 
                               selectedElement.type === 'image' ? 'Image' : 'Unknown'}
                            </Badge>
                          </div>

                          {selectedElement.type === 'image' && (
                            <>
                              <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input
                                  value={selectedElement.imageUrl || ''}
                                  onChange={(e) => updateElement(selectedElement.id, { imageUrl: e.target.value })}
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Width</Label>
                                  <Input
                                    type="number"
                                    value={selectedElement.width || 200}
                                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                                    min="10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Height</Label>
                                  <Input
                                    type="number"
                                    value={selectedElement.height || 150}
                                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                                    min="10"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {(selectedElement.type === 'text' || selectedElement.type === 'dynamic-field') && (
                            <>
                              <div className="space-y-2">
                                <Label>Content</Label>
                                <Input
                                  value={selectedElement.content || ''}
                                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                  placeholder="Text content"
                                />
                              </div>
                              
                              {selectedElement.type === 'text' && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="dynamic-field"
                                      checked={selectedElement.isDynamic || false}
                                      onCheckedChange={(checked) => {
                                        updateElement(selectedElement.id, { 
                                          isDynamic: checked as boolean,
                                          type: checked ? 'dynamic-field' : 'text'
                                        })
                                      }}
                                    />
                                    <Label htmlFor="dynamic-field">Dynamic Field</Label>
                                  </Checkbox>
                                  {selectedElement.isDynamic && (
                                    <Select
                                      value={selectedElement.fieldName || ''}
                                      onValueChange={(value) => updateElement(selectedElement.id, { fieldName: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {dynamicFields.map((field) => (
                                          <SelectItem key={field.name} value={field.name}>
                                            {field.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </Select>
                              )}
                            </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Font Size</Label>
                                  <Input
                                    type="number"
                                    value={selectedElement.fontSize || 16}
                                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                    min="8"
                                    max="72"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Color</Label>
                                  <div className="flex space-x-2">
                                    <Input
                                      type="color"
                                      value={selectedElement.color || '#000000'}
                                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                      className="w-16 h-10"
                                    />
                                    <Input
                                      value={selectedElement.color || '#000000'}
                                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                      placeholder="#000000"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>X Position</Label>
                                  <Input
                                    type="number"
                                    value={selectedElement.x}
                                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Y Position</Label>
                                  <Input
                                    type="number"
                                    value={selectedElement.y}
                                    onChange={(e) => updateElement.id, { y: parseInt(e.target.value) })}
                                    />
                                </div>
                              </div>
                            </>
                          )}

                          {selectedElement.fieldName !== 'certificateId' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteElement(selectedElement.id)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Element
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Click on an element to edit its properties
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="bg-white rounded-lg border p-4 space-y-2">
                <Button onClick={saveTemplate} disabled={!formData.name} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => {
              return (
                <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="w-full h-40 bg-white border rounded border-gray-200 relative overflow-hidden">
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          transform: `scale(${Math.min(240 / (template.width || 1123), 160 / (template.height || 794)})`,
                          transformOrigin: 'center'
                        }}
                      >
                        <div
                          style={{
                            width: template.width || 1123,
                            height: template.height || 794,
                            backgroundColor: template.backgroundColor || '#ffffff',
                            backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative'
                          }}
                        >
                          {(template.elements as TemplateElement[]).map((element: any) => (
                            <div
                              key={element.id}
                              className="absolute"
                              style={{
                                left: element.x,
                                top: element.y,
                                width: element.type === 'text' ? 'auto' : element.width,
                                height: element.type === 'text' ? 'auto' : element.height,
                                fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
                                fontWeight: element.fontWeight,
                                textAlign: element.textAlign as any,
                                color: element.color,
                                backgroundColor: element.backgroundColor,
                                border: element.type !== 'text' && element.type !== 'image' ? `${element.borderWidth}px solid ${element.borderColor}` : element.type === 'image' ? '1px solid #e5e7eb' : undefined,
                                borderRadius: element.radius ? `${element.radius}px` : undefined,
                                backgroundImage: element.type === 'image' && element.imageUrl ? `url(${element.imageUrl})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {element.type === 'text' || element.type === 'dynamic-field' ? element.content : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 truncate flex-1">
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                      )}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-3">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </p>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTemplate(template)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditTemplate(template)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!template.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {templates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                  <p>Create your first certificate template to get started</p>
                </div>
                <Button onClick={initializeNewTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}