'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
<<<<<<< Updated upstream
import { useEffect, useState, useRef } from 'react'
=======
import { useEffect, useState } from 'react'
>>>>>>> Stashed changes
import {
  Card,
  CardContent,
  CardHeader
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
<<<<<<< Updated upstream
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Settings,
  Plus,
  Edit,
  Trash2,
=======
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Plus,
>>>>>>> Stashed changes
  ArrowLeft,
  Eye,
<<<<<<< Updated upstream
  Type,
  Square,
  Image as ImageIcon
=======
  Edit,
  Trash2
>>>>>>> Stashed changes
} from 'lucide-react'
import { TemplateEditor } from '@/components/admin/TemplateEditor'

/* ================= TYPES ================= */
<<<<<<< Updated upstream

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
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  imageUrl?: string
  fieldName?: string
  isDynamic?: boolean
}
=======
>>>>>>> Stashed changes

interface CertificateTemplate {
  id: string
  name: string
  description?: string
  width?: number
  height?: number
  backgroundColor?: string
  backgroundImage?: string
<<<<<<< Updated upstream
  elements?: TemplateElement[]
=======
  elements?: any[]
>>>>>>> Stashed changes
  isDefault: boolean
  createdAt: string
}

/* ================= PAGE ================= */

/* ================= PAGE ================= */

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
<<<<<<< Updated upstream
  const canvasRef = useRef<HTMLDivElement>(null)

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
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

  const dynamicFields: DynamicField[] = [
    { name: 'userName', label: 'User Name', required: true },
    { name: 'userEmail', label: 'User Email', required: true },
    { name: 'completionDate', label: 'Completion Date', required: true },
    { name: 'programName', label: 'Program Name', required: true },
    { name: 'organizationName', label: 'Organization Name', required: true },
    { name: 'certificateId', label: 'Certificate ID', required: true }
  ]
=======

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
>>>>>>> Stashed changes

  /* ================= AUTH ================= */

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) fetchTemplates()
  }, [session])

  /* ================= API ================= */

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

<<<<<<< Updated upstream
  /* ================= ELEMENT HANDLERS ================= */

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setTemplateDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    }))
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return
    const rect = canvasRef.current!.getBoundingClientRect()
    updateElement(selectedElement.id, {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  /* ================= SAVE ================= */

  const saveTemplate = async () => {
    const url = selectedTemplate
      ? `/api/templates/${selectedTemplate.id}`
      : '/api/templates'

    const method = selectedTemplate ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        ...templateDesign
=======
  const handleSaveTemplate = async (templateData: { 
    name: string; 
    description: string; 
    design: any 
  }) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          width: templateData.design.width,
          height: templateData.design.height,
          backgroundColor: templateData.design.backgroundColor,
          backgroundImage: templateData.design.backgroundImage,
          elements: templateData.design.elements
        })
>>>>>>> Stashed changes
      })
    })

<<<<<<< Updated upstream
    await fetchTemplates()
    setIsEditing(false)
    setSelectedTemplate(null)
  }
=======
      if (res.ok) {
        await fetchTemplates()
        setIsEditorOpen(false)
      }
    } catch (err) {
      console.error('Error saving template:', err)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchTemplates()
      }
    } catch (err) {
      console.error('Error deleting template:', err)
    }
  }

  /* ================= RENDER ================= */
>>>>>>> Stashed changes

  /* ================= RENDER ================= */

  if (status === 'loading' || loading) {
    return <div className="flex justify-center p-20">Loading...</div>
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Settings className="w-6 h-6" />
          <h1 className="text-xl font-bold">Certificate Templates</h1>
        </div>

<<<<<<< Updated upstream
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create
=======
        <Button onClick={() => setIsEditorOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Template
>>>>>>> Stashed changes
        </Button>
      </header>

      <main className="container mx-auto p-6">
<<<<<<< Updated upstream
        {isEditing ? (
          <div className="grid grid-cols-12 gap-6">
            {/* CANVAS */}
            <div className="col-span-9 bg-white p-4 border rounded">
              <div
                ref={canvasRef}
                className="relative border"
                style={{
                  width: templateDesign.width,
                  height: templateDesign.height,
                  backgroundColor: templateDesign.backgroundColor,
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent, transparent 20px, #f0f0f0 21px),
                    repeating-linear-gradient(90deg, transparent, transparent 20px, #f0f0f0 21px),
                    ${templateDesign.backgroundImage ? `url(${templateDesign.backgroundImage})` : 'none'}
                  `,
                  backgroundSize: '21px 21px, 21px 21px, cover'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {templateDesign.elements.map(el => (
                  <div
                    key={el.id}
                    className="absolute cursor-move"
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      fontSize: el.fontSize,
                      color: el.color
                    }}
                    onMouseDown={e => handleMouseDown(e, el)}
                  >
                    {el.content}
                  </div>
                ))}
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </CardContent>
              </Card>

              <Button onClick={saveTemplate} disabled={!formData.name}>
                <Save className="w-4 h-4 mr-2" /> Save Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {templates.map(t => (
              <Card key={t.id}>
                <CardHeader>
                  <h3 className="font-semibold">{t.name}</h3>
                  {t.isDefault && <Badge>Default</Badge>}
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" onClick={() => setSelectedTemplate(t)}>
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
=======
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg leading-tight">
                    {template.name}
                  </h3>
                  {template.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  {!template.isDefault && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first certificate template
            </p>
            <Button onClick={() => setIsEditorOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Template
            </Button>
>>>>>>> Stashed changes
          </div>
        )}
      </main>

      {/* Template Editor Modal */}
      <TemplateEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  )
}
