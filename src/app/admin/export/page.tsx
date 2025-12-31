'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Loader2,
  Users,
  Archive,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import HexagonLoader from '@/components/ui/hexagon-loader'
import { formatDate } from '@/lib/utils'

interface ExportLog {
  id: string
  fileName: string
  status: 'pending' | 'completed' | 'failed'
  totalCertificates: number
  filters: {
    organization?: string
    program?: string
    status?: string
  }
  createdAt: string
  completedAt?: string
  downloadUrl?: string
  errorMessage?: string
}

interface Organization {
  id: string
  name: string
  programs: {
    id: string
    name: string
  }[]
}

export default function BulkExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFilters, setExportFilters] = useState({
    organization: 'all',
    program: 'all',
    status: 'all'
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

  // Reset program filter when organization filter changes
  useEffect(() => {
    setExportFilters(prev => ({ ...prev, program: 'all' }))
  }, [exportFilters.organization])

  const fetchData = async () => {
    try {
      const [orgRes, logsRes] = await Promise.all([
        fetch('/api/organizations/with-programs'),
        fetch('/api/export/logs')
      ])

      const [orgData, logsData] = await Promise.all([
        orgRes.json(),
        logsRes.json()
      ])

      setOrganizations(orgData.organizations || [])
      setExportLogs(logsData.exportLogs || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const response = await fetch('/api/export/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: exportFilters.organization !== 'all' ? exportFilters.organization : undefined,
          program: exportFilters.program !== 'all' ? exportFilters.program : undefined,
          status: exportFilters.status !== 'all' ? exportFilters.status : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Create a blob from the response
        const blob = await response.blob()
        
        // Create a temporary URL and trigger download
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.fileName || 'certificates-export.zip'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Refresh export logs
        await fetchData()
        setIsExportDialogOpen(false)
        
        // Reset filters
        setExportFilters({
          organization: 'all',
          program: 'all',
          status: 'all'
        })
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message || 'Export failed'}`)
      }
    } catch (error) {
      console.error('Failed to export certificates:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadExport = async (log: ExportLog) => {
    if (!log.downloadUrl) return
    
    try {
      const response = await fetch(log.downloadUrl)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = log.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download export:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      pending: 'secondary'
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    )
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

  const selectedOrganization = organizations.find(org => org.id === exportFilters.organization)
  const availablePrograms = selectedOrganization?.programs || []

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
            <div className="flex items-center space-x-2">
              <Archive className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Bulk Export</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Export certificates in bulk</span>
            </div>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Certificates</DialogTitle>
                  <DialogDescription>
                    Select filters to export certificates in ZIP format
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Export Filters */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Select 
                        value={exportFilters.organization} 
                        onValueChange={(value) => setExportFilters(prev => ({ ...prev, organization: value }))}
                      >
                        <SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                      <Label>Program</Label>
                      <Select 
                        value={exportFilters.program} 
                        onValueChange={(value) => setExportFilters(prev => ({ ...prev, program: value }))}
                        disabled={exportFilters.organization === 'all'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            exportFilters.organization === 'all' 
                              ? "Select organization first" 
                              : "All Programs"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Programs</SelectItem>
                          {availablePrograms.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={exportFilters.status} 
                        onValueChange={(value) => setExportFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="revoked">Revoked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Export Logs */}
        <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
                <CardDescription>
                  Track your bulk export activities and download previous exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exportLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No export history</h3>
                    <p className="text-gray-500 mb-4">
                      Your export history will appear here once you start exporting certificates
                    </p>
                    <Button onClick={() => setIsExportDialogOpen(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Start Your First Export
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Certificates</TableHead>
                          <TableHead>Filters</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exportLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.fileName}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(log.status)}
                                {getStatusBadge(log.status)}
                              </div>
                            </TableCell>
                            <TableCell>{log.totalCertificates}</TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {log.filters.organization && (
                                  <div>Org: {organizations.find(o => o.id === log.filters.organization)?.name}</div>
                                )}
                                {log.filters.program && (
                                  <div>Program: {availablePrograms.find(p => p.id === log.filters.program)?.name}</div>
                                )}
                                {log.filters.status && (
                                  <div>Status: {log.filters.status}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(log.createdAt)}</TableCell>
                            <TableCell>
                              {log.status === 'completed' && log.downloadUrl && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadExport(log)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              )}
                              {log.status === 'failed' && (
                                <Button variant="outline" size="sm" disabled>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Failed
                                </Button>
                              )}
                              {log.status === 'pending' && (
                                <Button variant="outline" size="sm" disabled>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Processing
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
      </main>
    </div>
  )
}