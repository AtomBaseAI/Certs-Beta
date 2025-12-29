'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Search, Award, FileCheck, Download, Shield, CheckCircle, X, Loader2 } from 'lucide-react'

export default function Home() {
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleVerify = async () => {
    if (!verificationCode.trim()) return
    
    setIsVerifying(true)
    try {
      const response = await fetch(`/api/certificates/verify?code=${verificationCode}`)
      const data = await response.json()
      
      if (response.ok) {
        setVerificationResult(data)
      } else {
        setVerificationResult({ error: data.message || 'Certificate not found' })
      }
    } catch (error) {
      setVerificationResult({ error: 'Verification failed. Please try again.' })
    } finally {
      setIsVerifying(false)
    }
  }

  const resetVerification = () => {
    setVerificationCode('')
    setVerificationResult(null)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/download-code')
      
      if (!response.ok) {
        throw new Error('Failed to download source code')
      }
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'certs-beta-source-code.zip'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Successful",
        description: "Source code downloaded successfully. Check your downloads folder.",
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download source code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AtomCerts</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Enter certificate ID to verify authenticity
            </div>
            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Verify</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Shield className="h-6 w-6" />
                    Verify Certificate
                  </DialogTitle>
                  <DialogDescription>
                    Enter the certificate ID to verify its authenticity
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cert-id" className="text-sm font-medium text-gray-700">
                      Certificate ID
                    </label>
                    <Input
                      id="cert-id"
                      placeholder="Enter certificate ID..."
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleVerify} 
                    disabled={isVerifying || !verificationCode.trim()}
                    className="w-full"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Certificate'}
                  </Button>

                  {verificationResult && (
                    <div className="mt-4">
                      {verificationResult.error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-red-800">
                            <X className="h-4 w-4" />
                            <span className="font-medium">{verificationResult.error}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold text-green-800">Certificate Verified</h3>
                            <Badge variant="secondary" className="ml-auto">
                              Valid
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">User Name:</span>
                              <span className="font-medium">{verificationResult.userName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Program:</span>
                              <span className="font-medium">{verificationResult.program?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Organization:</span>
                              <span className="font-medium">{verificationResult.organization?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Issue Date:</span>
                              <span className="font-medium">
                                {new Date(verificationResult.issueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Certificate ID:</span>
                              <span className="font-medium font-mono">{verificationResult.certificateId}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button asChild>
              <a href="/admin/login">Admin</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Award className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Professional Certificate
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Verification System
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create, manage, and verify professional certificates with ease. 
            <br />
            Trusted by organizations worldwide for secure credential management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center group hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <FileCheck className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Easy Creation</CardTitle>
              <CardDescription className="text-base">
                Design beautiful certificates with our intuitive drag-and-drop editor
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center group hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Bulk Generation</CardTitle>
              <CardDescription className="text-base">
                Generate hundreds of certificates in minutes with CSV upload
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center group hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Instant Verification</CardTitle>
              <CardDescription className="text-base">
                Verify certificate authenticity instantly with unique codes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Trusted by Leading Organizations</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of organizations that rely on AtomCerts for secure certificate management
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto"></div>
              <p className="text-sm font-medium text-gray-700">Enterprise</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto"></div>
              <p className="text-sm font-medium text-gray-700">Education</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto"></div>
              <p className="text-sm font-medium text-gray-700">Healthcare</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto"></div>
              <p className="text-sm font-medium text-gray-700">Technology</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of organizations managing certificates securely with AtomCerts
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Learn More
            </Button>
            <Button size="lg" asChild>
              <a href="/admin/login">Get Started</a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Source Code
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AtomCerts. Professional certificate management system.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}