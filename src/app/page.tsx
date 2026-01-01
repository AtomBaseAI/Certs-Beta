'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Search, Award, FileCheck, Download, Shield, CheckCircle, X, Loader2, Lock } from 'lucide-react'

export default function Home() {
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingCert, setIsDownloadingCert] = useState(false)

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

  const handleDownloadCertificate = async () => {
    if (!verificationResult?.certificateId) return
    
    setIsDownloadingCert(true)
    try {
      const response = await fetch(`/api/certificates/${verificationResult.certificateId}/download`)
      
      if (!response.ok) {
        throw new Error('Failed to download certificate')
      }
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${verificationResult.certificateId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Successful",
        description: "Certificate downloaded successfully. Check your downloads folder.",
      })
    } catch (error) {
      console.error('Certificate download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingCert(false)
    }
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
            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Verify</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Shield className="h-6 w-6" />
                    Verify Certificate
                  </DialogTitle>
                  <DialogDescription>
                    Enter the certificate ID or verification code to verify its authenticity
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cert-id" className="text-sm font-medium text-gray-700">
                      Certificate ID or Verification Code
                    </label>
                    <Input
                      id="cert-id"
                      placeholder="verify"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      className="w-full h-12"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleVerify} 
                      disabled={isVerifying || !verificationCode.trim()}
                      className="flex-1"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Certificate'}
                    </Button>
                    
                    {verificationCode.trim() && (
                      <Button 
                        variant="outline"
                        onClick={resetVerification}
                        disabled={isVerifying}
                        className="px-4"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

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
                        <div className={`${verificationResult.status === 'revoked' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} rounded-lg p-4`}>
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircle className={`h-5 w-5 ${verificationResult.status === 'revoked' ? 'text-orange-600' : 'text-green-600'}`} />
                            <h3 className={`font-semibold ${verificationResult.status === 'revoked' ? 'text-orange-800' : 'text-green-800'}`}>
                              Certificate {verificationResult.status === 'revoked' ? 'Revoked' : 'Verified'}
                            </h3>
                            <Badge 
                              variant={verificationResult.status === 'revoked' ? 'destructive' : 'secondary'} 
                              className="ml-auto"
                            >
                              {verificationResult.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <div className="flex justify-between">
                                <span className="text-gray-600">Verification Code:</span>
                                <span className="font-medium font-mono">{verificationResult.verificationCode}</span>
                              </div>
                            </div>
                          </div>
                          
                          {verificationResult.status === 'issued' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Button 
                                onClick={handleDownloadCertificate}
                                disabled={isDownloadingCert}
                                className="w-full"
                                size="lg"
                              >
                                {isDownloadingCert ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Downloading Certificate...
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate (PDF)
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button asChild>
              <a href="/admin/login">
                <Lock className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Content can be added here if needed */}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Powered by AtomLabs</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
