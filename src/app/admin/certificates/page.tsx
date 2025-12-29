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
  FileText
} from 'lucide-react'
import HexagonLoader from '@/components/ui/hexagon-loader'

interface Certificate {
  id: string
  certificateId: string
  studentName: string
  studentEmail?: string
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
}

export default function CertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredCerts, setFilteredCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    completionDate: ''
  })

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

  useEffect(() => {
    const filtered = certificates.filter(cert =>
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.program.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCerts(filtered)
  }, [searchTerm, certificates])

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

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          completionDate: formData.completionDate,
          organizationId: selectedOrg,
          programId: selectedProgram,
          templateId: selectedTemplate
        })
      })

      if (response.ok) {
        await fetchData()
        setIsCreateDialogOpen(false)
        setFormData({ studentName: '', studentEmail: '', completionDate: '' })
        setSelectedOrg('')
        setSelectedProgram('')
        setSelectedTemplate('')
      }
    } catch (error) {
      console.error('Failed to create certificate:', error)
    }
  }

  const handleBulkUpload = async () => {
    if (!csvFile || !selectedOrg || !selectedProgram || !selectedTemplate) {
      alert('Please fill all fields and select a CSV file')
      return
    }

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
        setSelectedOrg('')
        setSelectedProgram('')
        setSelectedTemplate('')
      }
    } catch (error) {
      console.error('Failed to upload certificates:', error)
    }
  }

  const handleDownload = async (id: string) => {
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
      }
    } catch (error) {
      console.error('Failed to download certificate:', error)
    }
  }

  const handleBulkDownload = async () => {
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
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return
    
    try {
      const response = await fetch(`/api/certificates/${id}/revoke`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to revoke certificate:', error)
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
            <Button variant="outline" onClick={handleBulkDownload}>
              <Download className="h-4 w-4 mr-2" />
              Bulk Download
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
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setFormData({ studentName: '', studentEmail: '', completionDate: '' })
                    setSelectedOrg('')
                    setSelectedProgram('')
                    setSelectedTemplate('')
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Issue New Certificate</DialogTitle>
                    <DialogDescription>
                      Create and issue a new certificate to a student
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCertificate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">User Name *</Label>
                        <Input
                          id="studentName"
                          value={formData.studentName}
                          onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentEmail">User Email</Label>
                        <Input
                          id="studentEmail"
                          type="email"
                          value={formData.studentEmail}
                          onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="completionDate">Completion Date</Label>
                      <Input
                        id="completionDate"
                        type="date"
                        value={formData.completionDate}
                        onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Issue Certificate
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
                            {new Date(cert.issueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cert.status === 'issued' ? 'default' : 'secondary'}>
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(cert.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {cert.status === 'issued' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevoke(cert.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
                  disabled={!csvFile || !selectedOrg || !selectedProgram}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Generate Certificates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}