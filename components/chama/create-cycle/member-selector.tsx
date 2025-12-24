'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
          <h3 className="text-base font-semibold">Select Members</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
              Choose members to include in this cycle ({selectedMemberIds.size} selected)
          </p>
          </div>
          <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSelectAll}
            className="border-2 hover:border-primary/50 transition-all"
          >
              Select All
            </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSelectNone}
            className="border-2 hover:border-primary/50 transition-all"
          >
              Select None
            </Button>
          </div>
        </div>
      <div className="space-y-2.5">
          {members.map((member) => {
            const isSelected = selectedMemberIds.has(member.chama_member_id)
            const hasCustomSavings = memberSavings.has(member.chama_member_id)
            const customSavingsAmount = memberSavings.get(member.chama_member_id) ?? null
            const hideSavings = memberHideSavings.get(member.chama_member_id) ?? 0
            const [showSavingsInput, setShowSavingsInput] = useState(hasCustomSavings && customSavingsAmount !== null)

            return (
              <div
                key={member.id}
              className={`group rounded-lg border-2 p-3 space-y-3 transition-all ${
                isSelected 
                  ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent shadow-md' 
                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
              }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(member.chama_member_id)}
                  className="h-5 w-5"
                  />
                  <Avatar name={member.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.phone_number}</p>
                  </div>
                  {member.role === 'admin' && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary flex-shrink-0">
                      Admin
                    </span>
                  )}
                </div>

                {isSelected && showSavingsOptions && (
                <div className="ml-8 space-y-3 border-t border-border/50 pt-3">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
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
                      <Label htmlFor={`custom-savings-${member.id}`} className="text-xs font-medium cursor-pointer">
                          Use custom savings amount
                        </Label>
                        <div className="group relative">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="absolute left-0 top-6 hidden w-56 rounded-lg border border-border/50 bg-popover p-2 text-[10px] text-popover-foreground shadow-xl group-hover:block z-10">
                            Default: {formatCurrency(defaultSavingsAmount || 0)}. Set a custom amount for this member.
                          </div>
                        </div>
                      </div>
                    </div>

                    {showSavingsInput && (
                    <div className="space-y-1.5">
                      <Label htmlFor={`savings-amount-${member.id}`} className="text-xs font-medium">
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
                        className="max-w-[200px]"
                        />
                      <p className="text-[10px] text-muted-foreground">
                          Default: {formatCurrency(defaultSavingsAmount || 0)}
                          {contributionAmount && (
                            <span className="ml-2">
                              (Max: {formatCurrency(contributionAmount)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                    <div className="flex items-center gap-2 flex-1">
                        <Switch
                          checked={hideSavings === 1}
                          onCheckedChange={(checked) => {
                            onHideSavingsChange(member.chama_member_id, checked ? 1 : 0)
                          }}
                        />
                      <Label htmlFor={`hide-savings-${member.id}`} className="text-xs cursor-pointer">
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
          <div className="rounded-lg border border-dashed border-border/50 bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No members found
            </p>
          </div>
          )}
        </div>
    </div>
  )
}

