'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalFooter } from '@/components/ui/modal'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle2, Clock, XCircle, AlertCircle, Gift, Edit2, Check, X, EyeOff, Wallet, Sparkles, Zap, Download } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { Cycle } from '@/lib/types/cycle'
import type { CycleMember } from '@/lib/types/cycle'
import type { Contribution, Payout } from '@/lib/types/contribution'

interface MemberWithContributions extends CycleMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
  contributions: Contribution[]
  payout?: Payout | null
}

interface MemberStatusTableProps {
  cycle: Cycle
  chamaType?: 'savings' | 'merry_go_round' | 'hybrid' | null
  members: MemberWithContributions[]
  isAdmin?: boolean
  currentUserId?: string | null
  onMemberAction?: (memberId: string, action: string) => void
}

export function MemberStatusTable({
  cycle,
  chamaType,
  members,
  isAdmin = false,
  currentUserId,
  onMemberAction,
}: MemberStatusTableProps) {
  const { addToast } = useToast()
  const [editingSavings, setEditingSavings] = useState<string | null>(null)
  const [savingsValue, setSavingsValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean
    member: MemberWithContributions | null
    period: number | null
    contribution: Contribution | null
  }>({
    open: false,
    member: null,
    period: null,
    contribution: null,
  })
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set())

  const handleStartEdit = (member: MemberWithContributions) => {
    const currentAmount = member.custom_savings_amount ?? cycle.savings_amount
    setEditingSavings(member.id)
    setSavingsValue(currentAmount.toString())
  }

  const handleCancelEdit = () => {
    setEditingSavings(null)
    setSavingsValue('')
  }

  const handleSaveSavings = async (member: MemberWithContributions) => {
    const amount = savingsValue.trim() === '' ? null : parseInt(savingsValue, 10)
    
    if (amount !== null && (isNaN(amount) || amount < 0)) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: 'Savings amount must be a positive number or empty to use default.',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/chamas/${cycle.chama_id}/cycles/${cycle.id}/members/${member.id}/savings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            custom_savings_amount: amount,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update savings amount')
      }

      addToast({
        variant: 'success',
        title: 'Savings Updated',
        description: 'Member savings amount has been updated successfully.',
      })

      setEditingSavings(null)
      setSavingsValue('')
      
      // Refresh the page data
      if (onMemberAction) {
        onMemberAction(member.id, 'refresh')
      } else {
        window.location.reload()
      }
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update savings amount. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getSavingsAmount = (member: MemberWithContributions) => {
    const savingsAmount = member.custom_savings_amount ?? cycle.savings_amount
    const isHidden = member.hide_savings === 1
    const isOwnMember = member.user_id === currentUserId
    const shouldShow = isAdmin || isOwnMember || !isHidden

    if (!shouldShow) {
      return { display: '—', isHidden: true, isCustom: false }
    }

    const isCustom = member.custom_savings_amount !== null
    return {
      display: formatCurrency(savingsAmount),
      isHidden: false,
      isCustom,
      amount: savingsAmount,
    }
  }
  const handleOpenPaymentModal = (member: MemberWithContributions, period: number) => {
    const contribution = member.contributions.find((c) => c.period_number === period)
    setPaymentModal({
      open: true,
      member,
      period,
      contribution: contribution || null,
    })
    setPaymentAmount(contribution?.amount_paid?.toString() || contribution?.amount_due?.toString() || '')
  }

  const handleClosePaymentModal = () => {
    setPaymentModal({
      open: false,
      member: null,
      period: null,
      contribution: null,
    })
    setPaymentAmount('')
  }

  const handleRecordPayment = async () => {
    if (!paymentModal.member || !paymentModal.period) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount < 0) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
      })
      return
    }

    setIsRecordingPayment(true)
    try {
      // Use the admin endpoint which can create contribution if it doesn't exist
      const response = await fetch(`/api/cycles/${cycle.id}/admin/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_member_id: paymentModal.member.id,
          period_number: paymentModal.period,
          amount_paid: amount,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to record payment')
      }

      addToast({
        variant: 'success',
        title: 'Payment Recorded',
        description: `Successfully recorded ${formatCurrency(amount)} for ${paymentModal.member.user?.full_name || 'member'}`,
      })

      handleClosePaymentModal()
      if (onMemberAction) {
        onMemberAction(paymentModal.member.id, 'refresh')
      } else {
        window.location.reload()
      }
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
      })
    } finally {
      setIsRecordingPayment(false)
    }
  }

  const handleConfirmContribution = async (contributionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    setConfirmingIds(prev => new Set(prev).add(contributionId))
    
    try {
      const response = await fetch(`/api/contributions/${contributionId}/confirm`, {
        method: 'POST',
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to confirm contribution')
      }

      addToast({
        variant: 'success',
        title: 'Payment Confirmed',
        description: 'Contribution has been confirmed and savings credited.',
      })

      if (onMemberAction) {
        onMemberAction('', 'refresh')
      } else {
        window.location.reload()
      }
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm contribution',
      })
    } finally {
      setConfirmingIds(prev => {
        const next = new Set(prev)
        next.delete(contributionId)
        return next
      })
    }
  }

  const getContributionStatus = (member: MemberWithContributions, period: number) => {
    const contribution = member.contributions.find((c) => c.period_number === period)
    if (!contribution) return null

    switch (contribution.status) {
      case 'confirmed':
        return { icon: CheckCircle2, color: 'text-green-500', label: 'Confirmed', isConfirmed: true }
      case 'paid':
        return { icon: CheckCircle2, color: 'text-blue-500', label: 'Paid', isConfirmed: false }
      case 'partial':
        return { icon: AlertCircle, color: 'text-orange-500', label: 'Partial', isConfirmed: false }
      case 'late':
        return { icon: Clock, color: 'text-orange-500', label: 'Late', isConfirmed: false }
      case 'missed':
        return { icon: XCircle, color: 'text-red-500', label: 'Missed', isConfirmed: false }
      default:
        return { icon: Clock, color: 'text-gray-500', label: 'Pending', isConfirmed: false }
    }
  }

  // Get all pending confirmations for admin
  const pendingConfirmations = isAdmin ? members.flatMap(member => 
    member.contributions
      .filter(c => c.status === 'paid' && c.amount_paid >= c.amount_due)
      .map(c => ({ contribution: c, member }))
  ) : []

  const periods = Array.from({ length: cycle.total_periods }, (_, i) => i + 1)

  const handleDownloadExcel = () => {
    const hasPayout = chamaType === 'merry_go_round' || chamaType === 'hybrid'

    // Build headers
    const headers = ['Member', 'Phone', 'Turn']
    periods.forEach(period => {
      headers.push(`P${period}`)
    })
    if (hasPayout) {
      headers.push('Payout')
    }
    headers.push('Total Paid')
    headers.push('Total Due')

    // Build data rows
    const dataRows = members.map(member => {
      const serviceFee = cycle.service_fee || 0
      
      // Calculate totals
      const totalPaid = member.contributions.reduce(
        (sum, c) => sum + Math.max(0, (c.amount_paid || 0) - serviceFee),
        0
      )
      const totalDue = member.contributions.reduce(
        (sum, c) => sum + Math.max(0, (c.amount_due || 0) - serviceFee),
        0
      )

      const row: (string | number)[] = [
        member.user?.full_name || 'Unknown Member',
        member.user?.phone_number || '',
        member.turn_order || '',
      ]

      periods.forEach(period => {
        const contribution = member.contributions.find(c => c.period_number === period)
        if (contribution) {
          const amountAfterFee = Math.max(0, (contribution.amount_paid || 0) - serviceFee)
          row.push(amountAfterFee)
        } else {
          row.push('')
        }
      })

      if (hasPayout) {
        if (member.payout) {
          row.push(member.payout.amount || 0)
        } else {
          row.push('')
        }
      }

      row.push(totalPaid)
      row.push(totalDue)

      return row
    })

    // Calculate totals for each period
    const serviceFee = cycle.service_fee || 0
    const totalsRow: (string | number)[] = ['TOTAL', '', '']
    
    let grandTotalPaid = 0
    let grandTotalDue = 0
    
    periods.forEach(period => {
      const periodTotal = members.reduce((sum, member) => {
        const contribution = member.contributions.find(c => c.period_number === period)
        if (contribution) {
          return sum + Math.max(0, (contribution.amount_paid || 0) - serviceFee)
        }
        return sum
      }, 0)
      totalsRow.push(periodTotal)
      grandTotalPaid += periodTotal
    })

    if (hasPayout) {
      const totalPayouts = members.reduce((sum, member) => {
        return sum + (member.payout?.amount || 0)
      }, 0)
      totalsRow.push(totalPayouts)
    }

    grandTotalDue = members.reduce((sum, member) => {
      return sum + member.contributions.reduce((s, c) => s + Math.max(0, (c.amount_due || 0) - serviceFee), 0)
    }, 0)

    totalsRow.push(grandTotalPaid)
    totalsRow.push(grandTotalDue)

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    
    // Create main data sheet with totals row
    const wsData = [headers, ...dataRows, [], totalsRow]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    const colWidths = headers.map((header, i) => {
      if (header === 'Member') return { wch: 25 }
      if (header === 'Phone') return { wch: 15 }
      if (header.includes('Amount') || header.includes('Paid') || header.includes('Due')) return { wch: 12 }
      if (header.includes('Date')) return { wch: 12 }
      if (header.includes('Status')) return { wch: 12 }
      return { wch: 10 }
    })
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Member Status')

    // Create summary sheet
    const summaryData = [
      ['Cycle Summary'],
      [''],
      ['Cycle Name', cycle.name],
      ['Total Periods', cycle.total_periods],
      ['Current Period', cycle.current_period],
      ['Contribution Amount', cycle.contribution_amount],
      ['Service Fee', cycle.service_fee || 0],
      ['Status', cycle.status],
      [''],
      ['Statistics'],
      ['Total Members', members.length],
      ['Total Collected', members.reduce((sum, m) => sum + m.contributions.reduce((s, c) => s + Math.max(0, (c.amount_paid || 0) - (cycle.service_fee || 0)), 0), 0)],
      ['Service Fees Collected', isAdmin ? members.reduce((sum, m) => sum + m.contributions.filter(c => c.status === 'paid' || c.status === 'confirmed').length, 0) * (cycle.service_fee || 0) : 'Admin only'],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Generate and download file
    const fileName = `${cycle.name.replace(/[^a-zA-Z0-9]/g, '_')}_member_status_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)

    addToast({
      variant: 'success',
      title: 'Excel Downloaded',
      description: 'Member status data has been exported to Excel.',
    })
  }

  return (
    <div className="space-y-4">
      {/* Pending Confirmations Banner - Creative Design */}
      {isAdmin && pendingConfirmations.length > 0 && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/20 dark:via-blue-950/10 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg animate-pulse" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground">
                    {pendingConfirmations.length} Payment{pendingConfirmations.length !== 1 ? 's' : ''} Ready to Confirm
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confirm to credit savings and finalize transactions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {pendingConfirmations.slice(0, 3).map(({ contribution, member }) => (
                  <button
                    key={contribution.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleConfirmContribution(contribution.id)
                    }}
                    disabled={confirmingIds.has(contribution.id)}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {confirmingIds.has(contribution.id) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">{member.user?.full_name?.split(' ')[0] || 'Member'}</span>
                      </>
                    )}
                  </button>
                ))}
                {pendingConfirmations.length > 3 && (
                  <Badge variant="info" className="text-xs">
                    +{pendingConfirmations.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Member Status</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Contribution status for all cycle members</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
          </div>
        </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                  <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm sticky left-0 bg-card z-10">Member</th>
                  <th className="text-center p-2 sm:p-3 font-semibold text-xs sm:text-sm">Turn</th>
                {((chamaType === 'savings' || chamaType === 'hybrid') || cycle.savings_amount > 0 || members.some(m => m.custom_savings_amount !== null)) && (
                    <th className="text-center p-2 sm:p-3 font-semibold text-xs sm:text-sm">Savings</th>
                )}
                {periods.map((period) => (
                    <th key={period} className="text-center p-1.5 sm:p-2 font-semibold text-[10px] sm:text-sm min-w-[60px] sm:min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span>P{period}</span>
                    {period === cycle.current_period && (
                          <Badge variant="info" className="text-[9px] px-1 py-0">
                        Current
                      </Badge>
                    )}
                      </div>
                  </th>
                ))}
                  {(chamaType === 'merry_go_round' || chamaType === 'hybrid') && (
                    <th className="text-center p-2 sm:p-3 font-semibold text-xs sm:text-sm">Payout</th>
                  )}
                  {isAdmin && <th className="text-center p-2 sm:p-3 font-semibold text-xs sm:text-sm">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const serviceFee = cycle.service_fee || 0
                // Subtract service fee from each contribution's amount_paid
                const totalPaidAfterFees = member.contributions.reduce(
                  (sum, c) => sum + Math.max(0, (c.amount_paid || 0) - serviceFee),
                  0
                )
                // Also subtract service fee from amount_due for consistency
                const totalDueAfterFees = member.contributions.reduce(
                  (sum, c) => sum + Math.max(0, c.amount_due - serviceFee),
                  0
                )

                const savingsInfo = getSavingsAmount(member)

                return (
                  <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 sm:p-3 sticky left-0 bg-card z-10 min-w-[120px] max-w-[180px]">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Avatar
                          name={member.user?.full_name || 'Unknown'}
                          size="sm"
                        />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm truncate">
                            {member.user?.full_name || 'Unknown Member'}
                          </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {totalPaidAfterFees > 0
                              ? `${formatCurrency(totalPaidAfterFees)} / ${formatCurrency(totalDueAfterFees)}`
                              : formatCurrency(totalDueAfterFees)}
                          </p>
                        </div>
                      </div>
                    </td>
                      <td className="text-center p-2 sm:p-3">
                        <Badge variant="default" className="text-xs">{member.turn_order}</Badge>
                    </td>
                    {((chamaType === 'savings' || chamaType === 'hybrid') || cycle.savings_amount > 0 || members.some(m => m.custom_savings_amount !== null)) && (
                        <td className="text-center p-2 sm:p-3">
                        {editingSavings === member.id ? (
                          <div className="flex flex-col items-center gap-2">
                            <Input
                              type="number"
                              value={savingsValue}
                              onChange={(e) => setSavingsValue(e.target.value)}
                              placeholder="Default"
                                className="w-20 sm:w-24 text-center text-xs sm:text-sm"
                              min={0}
                              disabled={isSaving}
                            />
                            <div className="flex items-center gap-1">
                              <Button
                                variant="primary"
                                size="sm"
                                  className="h-5 sm:h-6 px-1.5 sm:px-2 bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white"
                                onClick={() => handleSaveSavings(member)}
                                disabled={isSaving}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                  className="h-5 sm:h-6 px-1.5 sm:px-2"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-xs sm:text-sm font-medium">
                                {savingsInfo.display}
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleStartEdit(member)}
                                    className="text-primary hover:text-primary/80 transition-colors p-0.5 sm:p-1 rounded hover:bg-primary/10"
                                  title="Edit savings amount"
                                  type="button"
                                >
                                    <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              )}
                            </div>
                            {!savingsInfo.isHidden && (
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                {savingsInfo.isCustom && (
                                    <Badge variant="info" className="text-[9px] sm:text-xs">
                                    Custom
                                  </Badge>
                                )}
                                {!savingsInfo.isCustom && (
                                    <span className="text-[9px] sm:text-xs text-muted-foreground">Default</span>
                                )}
                                {isAdmin && member.hide_savings === 1 && (
                                    <Badge variant="warning" className="text-[9px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                                      <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Hidden
                                  </Badge>
                                )}
                              </div>
                            )}
                            {savingsInfo.isHidden && !isAdmin && (
                                <span className="text-[9px] sm:text-xs text-muted-foreground italic">Hidden</span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                    {periods.map((period) => {
                      const status = getContributionStatus(member, period)
                      const contribution = member.contributions.find(
                        (c) => c.period_number === period
                      )
                      const isConfirming = contribution && confirmingIds.has(contribution.id)
                      const needsConfirmation = isAdmin && contribution && contribution.status === 'paid' && contribution.amount_paid >= contribution.amount_due

                      // Format due date for tooltip
                      const dueDate = contribution?.due_date 
                        ? new Date(contribution.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : null
                      const tooltipText = dueDate 
                        ? `Due: ${dueDate}${isAdmin && !needsConfirmation ? ' • Click to record payment' : ''}`
                        : (isAdmin && !needsConfirmation ? 'Click to record payment' : status?.label)

                      // Calculate days until due for color coding (only for unpaid contributions)
                      let urgencyClass = ''
                      if (contribution?.due_date && contribution.status !== 'confirmed' && contribution.status !== 'paid') {
                        const now = new Date()
                        now.setHours(0, 0, 0, 0)
                        const due = new Date(contribution.due_date)
                        due.setHours(0, 0, 0, 0)
                        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        
                        if (daysUntilDue < 1) {
                          urgencyClass = 'bg-orange-100 dark:bg-orange-900/30'
                        } else if (daysUntilDue < 3) {
                          urgencyClass = 'bg-yellow-100 dark:bg-yellow-900/30'
                        }
                      }

                      return (
                          <td 
                            key={period} 
                            className={`text-center p-1 sm:p-2 relative ${urgencyClass} ${isAdmin && !needsConfirmation ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                            onClick={isAdmin && !needsConfirmation ? () => handleOpenPaymentModal(member, period) : undefined}
                            title={tooltipText}
                          >
                          {status ? (
                              <div className="flex flex-col items-center gap-0.5 sm:gap-1 relative">
                              {status.isConfirmed && (
                                <div className="absolute -inset-1 bg-green-500/20 rounded-full blur-sm animate-pulse" />
                              )}
                              <div className="relative flex items-center gap-1">
                                <status.icon
                                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${status.color} ${status.isConfirmed ? 'drop-shadow-lg' : ''}`}
                                />
                                {status.isConfirmed && (
                                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-400 animate-pulse" />
                                )}
                              </div>
                              {contribution && contribution.amount_paid > 0 && (
                                  <span className={`text-[9px] sm:text-xs ${status.isConfirmed ? 'font-semibold text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                  {formatCurrency(Math.max(0, contribution.amount_paid - (cycle.service_fee || 0)))}
                                </span>
                              )}
                              {needsConfirmation && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleConfirmContribution(contribution.id, e)
                                  }}
                                  disabled={isConfirming}
                                  className="mt-0.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Confirm payment"
                                >
                                  {isConfirming ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <>
                                      <Zap className="h-2.5 w-2.5" />
                                      <span>Confirm</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                              <span className="text-[9px] sm:text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )
                    })}
                      {(chamaType === 'merry_go_round' || chamaType === 'hybrid') && (
                        <td className="text-center p-2 sm:p-3">
                          {member.payout ? (
                            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                              <Gift
                                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                                  member.payout.status === 'paid' ||
                                  member.payout.status === 'confirmed'
                                    ? 'text-green-500'
                                    : 'text-gray-500'
                                }`}
                              />
                              <Badge
                                variant={
                                  member.payout.status === 'paid' ||
                                  member.payout.status === 'confirmed'
                                    ? 'success'
                                    : 'default'
                                }
                                className="text-[9px] sm:text-xs"
                              >
                                {member.payout.status}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-[9px] sm:text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                    {isAdmin && (
                        <td className="text-center p-2 sm:p-3">
                        <button
                            className="text-[9px] sm:text-xs text-primary hover:underline"
                          onClick={() => onMemberAction?.(member.id, 'view_details')}
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            {/* Service Fee Summary Row - Admin only */}
            {isAdmin && cycle.service_fee > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-muted/30">
                  <td className="p-2 sm:p-3 sticky left-0 bg-muted/30 z-10 font-semibold text-xs sm:text-sm">
                    Service Fee Collected
                  </td>
                  <td className="text-center p-2 sm:p-3"></td>
                  {((chamaType === 'savings' || chamaType === 'hybrid') || cycle.savings_amount > 0 || members.some(m => m.custom_savings_amount !== null)) && (
                    <td className="text-center p-2 sm:p-3"></td>
                  )}
                  {periods.map((period) => {
                    // Count confirmed/paid contributions for this period
                    const paidContributionsCount = members.filter(member => {
                      const contribution = member.contributions.find(c => c.period_number === period)
                      return contribution && (contribution.status === 'confirmed' || contribution.status === 'paid') && contribution.amount_paid > 0
                    }).length
                    const serviceFeeCollected = paidContributionsCount * (cycle.service_fee || 0)
                    
                    return (
                      <td key={period} className="text-center p-1.5 sm:p-2 text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {serviceFeeCollected > 0 ? formatCurrency(serviceFeeCollected) : '—'}
                      </td>
                    )
                  })}
                  {(chamaType === 'merry_go_round' || chamaType === 'hybrid') && (
                    <td className="text-center p-2 sm:p-3"></td>
                  )}
                  {isAdmin && <td className="text-center p-2 sm:p-3"></td>}
                </tr>
              </tfoot>
            )}
          </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
              <Sparkles className="absolute -top-0.5 -right-0.5 h-2 w-2 text-green-400" />
            </div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
            <span>Partial/Late</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
            <span>Missed</span>
          </div>
        </div>
      </CardContent>
      </Card>
      {/* Payment Recording Modal */}
      <Modal open={paymentModal.open} onOpenChange={(open) => !open && handleClosePaymentModal()}>
        <ModalContent>
          <ModalClose onClose={handleClosePaymentModal} />
          <ModalHeader>
            <ModalTitle>Record Payment</ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
            {paymentModal.member && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar name={paymentModal.member.user?.full_name || 'Unknown'} size="md" />
                <div>
                  <p className="font-semibold">{paymentModal.member.user?.full_name || 'Unknown Member'}</p>
                  <p className="text-sm text-muted-foreground">Period {paymentModal.period}</p>
                </div>
              </div>
            )}

            {!paymentModal.contribution && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  No contribution exists for this period. A new contribution will be created when you record the payment.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-sm text-muted-foreground">Amount Due:</span>
                <span className="font-semibold">
                  {paymentModal.contribution 
                    ? formatCurrency(paymentModal.contribution.amount_due)
                    : formatCurrency(cycle.contribution_amount)}
                </span>
              </div>
              {paymentModal.contribution && paymentModal.contribution.amount_paid > 0 && (
                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <span className="text-sm text-muted-foreground">Already Paid:</span>
                  <span className="font-semibold">{formatCurrency(paymentModal.contribution.amount_paid)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="text-sm text-muted-foreground">Remaining:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(
                    (paymentModal.contribution?.amount_due || cycle.contribution_amount) - 
                    (paymentModal.contribution?.amount_paid || 0)
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Amount (KES)</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                min={0}
                max={paymentModal.contribution ? paymentModal.contribution.amount_due : undefined}
                disabled={isRecordingPayment}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(paymentModal.contribution?.amount_due || cycle.contribution_amount)}
              </p>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={handleClosePaymentModal} disabled={isRecordingPayment}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isRecordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              {isRecordingPayment ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Recording...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

