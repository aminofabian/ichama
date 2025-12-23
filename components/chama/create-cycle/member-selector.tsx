'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface Member {
  id: string
  chama_member_id: string
  user_id: string
  full_name: string
  phone_number: string
  role: string
}

interface MemberSelectorProps {
  members: Member[]
  selectedMemberIds: Set<string>
  onToggle: (memberId: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
  chamaType: 'savings' | 'merry_go_round' | 'hybrid'
  defaultSavingsAmount: number | null
  contributionAmount: number | null
  memberSavings: Map<string, number | null>
  onSavingsChange: (memberId: string, amount: number | null) => void
  memberHideSavings: Map<string, number>
  onHideSavingsChange: (memberId: string, hide: number) => void
}

export function MemberSelector({
  members,
  selectedMemberIds,
  onToggle,
  onSelectAll,
  onSelectNone,
  chamaType,
  defaultSavingsAmount,
  contributionAmount,
  memberSavings,
  onSavingsChange,
  memberHideSavings,
  onHideSavingsChange,
}: MemberSelectorProps) {
  const allSelected = members.length > 0 && selectedMemberIds.size === members.length
  const someSelected = selectedMemberIds.size > 0 && selectedMemberIds.size < members.length
  const showSavingsOptions = chamaType !== 'merry_go_round' && defaultSavingsAmount !== null && defaultSavingsAmount > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Members</CardTitle>
            <CardDescription>
              Choose members to include in this cycle ({selectedMemberIds.size} selected)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="primary" size="sm" onClick={onSelectNone}>
              Select None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const isSelected = selectedMemberIds.has(member.chama_member_id)
            const hasCustomSavings = memberSavings.has(member.chama_member_id)
            const customSavingsAmount = memberSavings.get(member.chama_member_id) ?? null
            const hideSavings = memberHideSavings.get(member.chama_member_id) ?? 0
            const [showSavingsInput, setShowSavingsInput] = useState(hasCustomSavings && customSavingsAmount !== null)

            return (
              <div
                key={member.id}
                className="rounded-lg border p-3 space-y-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(member.chama_member_id)}
                  />
                  <Avatar name={member.full_name} size="sm" />
                  <div className="flex-1">
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.phone_number}</p>
                  </div>
                  {member.role === 'admin' && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Admin
                    </span>
                  )}
                </div>

                {isSelected && showSavingsOptions && (
                  <div className="ml-11 space-y-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={showSavingsInput}
                          onCheckedChange={(checked) => {
                            setShowSavingsInput(checked)
                            if (!checked) {
                              onSavingsChange(member.chama_member_id, null)
                            } else {
                              onSavingsChange(member.chama_member_id, defaultSavingsAmount)
                            }
                          }}
                        />
                        <Label htmlFor={`custom-savings-${member.id}`} className="text-sm font-medium">
                          Use custom savings amount
                        </Label>
                        <div className="group relative">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <div className="absolute left-0 top-6 hidden w-64 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:block z-10">
                            Default: {formatCurrency(defaultSavingsAmount || 0)}. Set a custom amount for this member.
                          </div>
                        </div>
                      </div>
                    </div>

                    {showSavingsInput && (
                      <div className="space-y-2">
                        <Label htmlFor={`savings-amount-${member.id}`} className="text-sm">
                          Savings Amount (KES)
                        </Label>
                        <Input
                          id={`savings-amount-${member.id}`}
                          type="number"
                          min="0"
                          max={contributionAmount || undefined}
                          value={customSavingsAmount?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
                            if (value === null || (!isNaN(value) && value >= 0)) {
                              onSavingsChange(member.chama_member_id, value)
                            }
                          }}
                          placeholder={defaultSavingsAmount?.toString() || '0'}
                          className="max-w-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Default: {formatCurrency(defaultSavingsAmount || 0)}
                          {contributionAmount && (
                            <span className="ml-2">
                              (Max: {formatCurrency(contributionAmount)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hideSavings === 1}
                          onCheckedChange={(checked) => {
                            onHideSavingsChange(member.chama_member_id, checked ? 1 : 0)
                          }}
                        />
                        <Label htmlFor={`hide-savings-${member.id}`} className="text-sm">
                          Hide my savings amount from other members
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {members.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No members found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

