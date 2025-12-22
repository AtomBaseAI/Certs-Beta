'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award, 
  Users, 
  Building, 
  FileText, 
  Plus, 
  Download,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalOrganizations: 0,
    totalPrograms: 0,
    recentCertificates: []
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const [certRes, orgRes, progRes, recentRes] = await Promise.all([
        fetch('/api/certificates/stats'),
        fetch('/api/organizations/stats'),
        fetch('/api/programs/stats'),
        fetch('/api/certificates/recent')
      ])

      const [certData, orgData, progData, recentData] = await Promise.all([
        certRes.json(),
        orgRes.json(),
        progRes.json(),
        recentRes.json()
      ])

      setStats({
        totalCertificates: certData.total || 0,
        totalOrganizations: orgData.total || 0,
        totalPrograms: progData.total || 0,
        recentCertificates: recentData.certificates || []
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  if (status === 'loading') {
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {session.user?.name}
            </span>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Site
            </Button>
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCertificates}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                +2 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              <p className="text-xs text-muted-foreground">
                +5 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +19% from last hour
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Button 
            className="h-20 flex-col space-y-2"
            onClick={() => router.push('/admin/certificates')}
          >
            <Plus className="h-6 w-6" />
            <span>New Certificate</span>
          </Button>
          
          <Button 
            variant="outline"
            className="h-20 flex-col space-y-2"
            onClick={() => router.push('/admin/organizations')}
          >
            <Building className="h-6 w-6" />
            <span>Organizations</span>
          </Button>
          
          <Button 
            variant="outline"
            className="h-20 flex-col space-y-2"
            onClick={() => router.push('/admin/templates')}
          >
            <Settings className="h-6 w-6" />
            <span>Templates</span>
          </Button>
          
          <Button 
            variant="outline"
            className="h-20 flex-col space-y-2"
            onClick={() => router.push('/admin/bulk')}
          >
            <Download className="h-6 w-6" />
            <span>Bulk Export</span>
          </Button>
        </div>

        {/* Recent Activity */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Certificates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Certificates</CardTitle>
                <CardDescription>
                  Latest certificates issued in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentCertificates.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No certificates issued yet
                    </p>
                  ) : (
                    stats.recentCertificates.map((cert: any) => (
                      <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-2 rounded">
                            <Award className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{cert.studentName}</p>
                            <p className="text-sm text-gray-500">{cert.program?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={cert.status === 'issued' ? 'default' : 'secondary'}>
                            {cert.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(cert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>
                  Certificate generation trends and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Analytics charts will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}