'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search,
  Download,
  Upload,
  Users,
  FileText,
  Loader2,
  Ban
} from 'lucide-react'
import HexagonLoader from '@/components/ui/hexagon-loader'
import { formatDate } from '@/lib/utils'

interface Certificate {
  id: string
  certificateId: string
  userName: string
  userEmail?: string
  issueDate: string
  completionDate?: string
  verificationCode: string
  status: string
  organization: {
    name: string
  }
  program: {
    name: string
  }
  template?: {
    name: string
  }
  createdAt: string
}

interface Organization {
  id: string
  name: string
  programs: {
    id: string
    name: string
  }[]
}

interface Template {
  id: string
  name: string
  elements?: {
    id: string
    type: 'text' | 'dynamic-text' | 'rectangle' | 'image'
    fieldName?: string
    title?: string
  }[]
}

export default function CertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState<Template | null>(null)
  const [filteredCerts, setFilteredCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOrganization, setFilterOrganization] = useState('all')
  const [filterProgram, setFilterProgram] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [dynamicFields, setDynamicFields] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  // Reset program filter when organization filter changes
  useEffect(() => {
    setFilterProgram('all')
  }, [filterOrganization])

  useEffect(() => {
    const filtered = certificates.filter(cert => {
      const matchesSearch = cert.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.program.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // If "All Organizations" is selected, don't filter by organization
      const matchesOrganization = filterOrganization === 'all' || cert.organization.id === filterOrganization
      
      // If "All Programs" is selected, don't filter by program
      const matchesProgram = filterProgram === 'all' || cert.program.id === filterProgram
      
      return matchesSearch && matchesOrganization && matchesProgram
    })
    setFilteredCerts(filtered)
  }, [searchTerm, certificates, filterOrganization, filterProgram])

  const fetchData = async () => {
    try {
      const [certRes, orgRes, templateRes] = await Promise.all([
        fetch('/api/certificates'),
        fetch('/api/organizations/with-programs'),
        fetch('/api/templates')
      ])

      const [certData, orgData, templateData] = await Promise.all([
        certRes.json(),
        orgRes.json(),
        templateRes.json()
      ])

      setCertificates(certData.certificates || [])
      setOrganizations(orgData.organizations || [])
      setTemplates(templateData.templates || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplateDetails = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      
      if (!response.ok) {
        console.error('Template fetch failed:', response.status)
        return
      }
      
      const data = await response.json()
      
      if (!data.template) {
        console.error('No template data in response')
        return
      }
      
      setSelectedTemplateDetails(data.template)
      
      // Extract dynamic fields from template elements
      const elements = data.template.elements || []
      
      // Look for both dynamic-text elements with fieldName and text elements with {{fieldName}} content
      const dynamicTextElements = elements.filter(
        (el: any) => {
          // Check for dynamic-text elements with fieldName
          if (el.type === 'dynamic-text' && el.fieldName) {
            return true
          }
          
          // Check for dynamic-text elements with {{fieldName}} content (missing fieldName property)
          if (el.type === 'dynamic-text' && el.content && typeof el.content === 'string') {
            const matches = el.content.match(/\{\{(\w+)\}\}/g)
            if (matches) {
              // Extract all field names from the content
              matches.forEach(match => {
                const fieldName = match.replace(/[{}]/g, '')
                el.fieldName = fieldName
              })
              return true
            }
          }
          
          // Check for text elements with {{fieldName}} content
          if (el.type === 'text' && el.content && typeof el.content === 'string') {
            const matches = el.content.match(/\{\{(\w+)\}\}/g)
            if (matches) {
              // Extract all field names from the content
              matches.forEach(match => {
                const fieldName = match.replace(/[{}]/g, '')
                el.fieldName = fieldName
              })
              return true
            }
          }
          
          return false
        }
      )
      
      const fields = dynamicTextElements.flatMap((el: any) => {
        if (Array.isArray(el.fieldName)) {
          return el.fieldName
        }
        return el.fieldName ? [el.fieldName] : []
      })
      
      // Remove duplicates
      const uniqueFields = [...new Set(fields)]
      
      setDynamicFields(uniqueFields)
      
      // Initialize form data with empty values for new fields
      const newFormData: Record<string, string> = {
        userName: '',
        userEmail: '',
        certificateId: generateUUID(),
        completionDate: '',
        programName: '',
        organizationName: ''
      }
      
      // Override with any existing form data for fields that match
      Object.keys(formData).forEach(key => {
        if (uniqueFields.includes(key)) {
          newFormData[key] = formData[key] || ''
        }
      })
      
      // Auto-populate organization and program names if selected
      if (selectedOrg) {
        const org = organizations.find(o => o.id === selectedOrg)
        if (org && uniqueFields.includes('organizationName')) {
          newFormData.organizationName = org.name
        }
      }
      
      if (selectedProgram) {
        const org = organizations.find(o => o.id === selectedOrg)
        const program = org?.programs.find(p => p.id === selectedProgram)
        if (program && uniqueFields.includes('programName')) {
          newFormData.programName = program.name
        }
      }
      
      setFormData(newFormData)
      
    } catch (error) {
      console.error('Failed to fetch template details:', error)
    }
  }

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const requestData = {
      ...formData,
      organizationId: selectedOrg,
      programId: selectedProgram,
      templateId: selectedTemplate
    }
    
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        await fetchData()
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message || 'Failed to create certificate'}`)
      }
    } catch (error) {
      console.error('Failed to create certificate:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ 
      userName: '',
      userEmail: '',
      certificateId: generateUUID(),
      completionDate: '',
      programName: '',
      organizationName: ''
    })
    setDynamicFields([])
    setSelectedTemplateDetails(null)
    setSelectedOrg('')
    setSelectedProgram('')
    setSelectedTemplate('')
    setFilterOrganization('all')
    setFilterProgram('all')
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    if (templateId) {
      fetchTemplateDetails(templateId)
    } else {
      // Reset template-specific fields
      setSelectedTemplateDetails(null)
      setDynamicFields([])
      setFormData({ 
        userName: '',
        userEmail: '',
        certificateId: generateUUID(),
        completionDate: '',
        programName: '',
        organizationName: ''
      }) // Keep basic fields
    }
  }

  // Helper functions for dynamic field handling
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      userName: 'User Name',
      userEmail: 'User Email',
      completionDate: 'Completion Date',
      programName: 'Program Name',
      organizationName: 'Organization Name',
      certificateId: 'Certificate ID',
      issueDate: 'Issue Date',
      date: 'Date',
      instructorName: 'Instructor Name',
      courseName: 'Course Name',
      grade: 'Grade',
      score: 'Score'
    }
    return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }

  const getFieldType = (fieldName: string): string => {
    const types: Record<string, string> = {
      userEmail: 'email',
      completionDate: 'date',
      issueDate: 'date',
      date: 'date'
    }
    return types[fieldName] || 'text'
  }

  const isRequiredField = (fieldName: string): boolean => {
    const requiredFields = ['userName']
    return requiredFields.includes(fieldName)
  }

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const handleBulkUpload = async () => {
    if (!csvFile || !selectedOrg || !selectedProgram || !selectedTemplate) {
      alert('Please fill all fields and select a CSV file')
      return
    }

    setIsBulkUploading(true)

    const formData = new FormData()
    formData.append('file', csvFile)
    formData.append('organizationId', selectedOrg)
    formData.append('programId', selectedProgram)
    formData.append('templateId', selectedTemplate)

    try {
      const response = await fetch('/api/certificates/bulk', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchData()
        setIsBulkDialogOpen(false)
        setCsvFile(null)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to upload certificates:', error)
    } finally {
      setIsBulkUploading(false)
    }
  }

  const handleDownload = async (id: string) => {
    setIsDownloading(id)
    try {
      const response = await fetch(`/api/certificates/${id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        console.error('Download failed:', errorData)
        alert(`Download failed: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Certificate download error:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(null)
    }
  }

  const handleBulkDownload = async () => {
    setIsBulkDownloading(true)
    try {
      const response = await fetch('/api/certificates/bulk-download')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'certificates.zip'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download certificates:', error)
    } finally {
      setIsBulkDownloading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return
    
    setIsRevoking(id)
    
    try {
      const response = await fetch(`/api/certificates/${id}/revoke`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to revoke certificate:', error)
    } finally {
      setIsRevoking(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this certificate? This action cannot be undone.')) return
    
    setIsDeleting(id)
    
    try {
      const response = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message || 'Failed to delete certificate'}`)
      }
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      alert('Failed to delete certificate. Please try again.')
    } finally {
      setIsDeleting(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HexagonLoader size={120} />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const selectedOrganization = organizations.find(org => org.id === selectedOrg)
  const availablePrograms = selectedOrganization?.programs || []
  
  // For filter dropdown - get programs based on selected filter organization
  const filterSelectedOrganization = organizations.find(org => org.id === filterOrganization)
  const filterAvailablePrograms = filterSelectedOrganization?.programs || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleBulkDownload} disabled={isBulkDownloading}>
              {isBulkDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Download
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList>
            <TabsTrigger value="individual">Individual Certificates</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 items-center flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
              </div>
              
              <div className="flex gap-2">
                              <Select value={filterOrganization || 'all'} onValueChange={setFilterOrganization}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filterProgram || 'all'} 
                  onValueChange={setFilterProgram}
                  disabled={filterOrganization === 'all' || !filterOrganization}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder={filterOrganization === 'all' || !filterOrganization ? "Select organization first" : "All Programs"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {filterAvailablePrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Issue New Certificate</DialogTitle>
                    <DialogDescription>
                      Create and issue a new certificate to a user
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCertificate} className="space-y-4">
                    {/* Organization and Program Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Organization *</Label>
                        <Select value={selectedOrg} onValueChange={setSelectedOrg} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Program *</Label>
                        <Select 
                          value={selectedProgram} 
                          onValueChange={setSelectedProgram}
                          disabled={!selectedOrg}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedOrganization?.programs.map((program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label>Template</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic Fields Based on Template */}
                    {dynamicFields.length > 0 && (
                      <div className="space-y-4">
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm mb-3">Certificate Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dynamicFields.map((fieldName) => (
                              <div key={fieldName} className="space-y-2">
                                <Label htmlFor={fieldName}>
                                  {getFieldLabel(fieldName)}
                                  {isRequiredField(fieldName) && ' *'}
                                </Label>
                                <Input
                                  id={fieldName}
                                  type={getFieldType(fieldName)}
                                  value={formData[fieldName] || ''}
                                  onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                                  required={isRequiredField(fieldName)}
                                  placeholder={`Enter ${getFieldLabel(fieldName).toLowerCase()}`}
                                  disabled={fieldName === 'certificateId'}
                                  className={fieldName === 'certificateId' ? 'bg-gray-100 text-gray-600' : ''}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Default fields when no template selected */}
                    {dynamicFields.length === 0 && (
                      <div className="space-y-4">
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-sm mb-3">Basic Certificate Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="userName">User Name *</Label>
                              <Input
                                id="userName"
                                value={formData.userName || ''}
                                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="userEmail">User Email</Label>
                              <Input
                                id="userEmail"
                                type="email"
                                value={formData.userEmail || ''}
                                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="certificateId">Certificate ID</Label>
                              <Input
                                id="certificateId"
                                value={formData.certificateId || ''}
                                disabled
                                className="bg-gray-100 text-gray-600"
                                placeholder="Auto-generated UUID"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="completionDate">Completion Date</Label>
                              <Input
                                id="completionDate"
                                type="date"
                                value={formData.completionDate || ''}
                                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Issuing...
                          </>
                        ) : (
                          <>
                            Issue Certificate
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Certificates Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Certificates</CardTitle>
                <CardDescription>
                  Manage issued certificates and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No certificates found' : 'No certificates issued yet'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ? 'Try a different search term' : 'Issue your first certificate to get started'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Issue Certificate
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCerts.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{cert.userName}</div>
                              {cert.userEmail && (
                                <div className="text-sm text-gray-500">{cert.userEmail}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{cert.certificateId}</TableCell>
                          <TableCell>{cert.organization.name}</TableCell>
                          <TableCell>{cert.program.name}</TableCell>
                          <TableCell>
                            {formatDate(cert.issueDate)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                cert.status === 'issued' ? 'default' : 
                                cert.status === 'revoked' ? 'destructive' : 'secondary'
                              }
                            >
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(cert.id)}
                                disabled={isDownloading === cert.id || cert.status === 'revoked'}
                                title={cert.status === 'revoked' ? 'Cannot download revoked certificate' : 'Download certificate'}
                              >
                                {isDownloading === cert.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                              
                              {cert.status === 'issued' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevoke(cert.id)}
                                  className="text-orange-600 hover:text-orange-700"
                                  disabled={isRevoking === cert.id}
                                  title="Revoke certificate"
                                >
                                  {isRevoking === cert.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Ban className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(cert.id)}
                                className="text-red-600 hover:text-red-700"
                                disabled={isDeleting === cert.id}
                                title="Delete certificate"
                              >
                                {isDeleting === cert.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Certificate Generation</CardTitle>
                <CardDescription>
                  Upload a CSV file to generate multiple certificates at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Organization *</Label>
                    <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Program *</Label>
                    <Select 
                      value={selectedProgram} 
                      onValueChange={setSelectedProgram}
                      disabled={!selectedOrg}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedOrganization?.programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>CSV File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </p>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    CSV format: userName,userEmail,completionDate (optional)
                  </p>
                </div>

                <Button 
                  onClick={handleBulkUpload}
                  disabled={!csvFile || !selectedOrg || !selectedProgram || isBulkUploading}
                  className="w-full"
                >
                  {isBulkUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Generate Certificates
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}