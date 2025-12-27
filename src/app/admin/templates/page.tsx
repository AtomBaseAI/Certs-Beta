'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Plus,
  ArrowLeft,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { TemplateEditor } from '@/components/admin/TemplateEditor'

/* ================= TYPES ================= */

interface CertificateTemplate {
  id: string
  name: string
  description?: string
  width?: number
  height?: number
  backgroundColor?: string
  backgroundImage?: string
  elements?: any[]
  isDefault: boolean
  createdAt: string
}

/* ================= PAGE ================= */

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

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
      })

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

        <Button onClick={() => setIsEditorOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </header>

      <main className="container mx-auto p-6">
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
