import { nanoid } from 'nanoid'
import db from '../client'
import type { Loan, LoanGuarantor, LoanPayment } from '../../types/financial'

export async function createLoan(data: {
  user_id: string
  chama_id: string
  amount: number
  interest_rate?: number
  repayment_period_days?: number
  due_date?: string
  notes?: string
}): Promise<Loan> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO loans (
      id, user_id, chama_id, amount, status, interest_rate, repayment_period_days,
      due_date, amount_paid, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 0, ?, ?, ?)`,
    args: [
      id,
      data.user_id,
      data.chama_id,
      data.amount,
      data.interest_rate || 0,
      data.repayment_period_days || null,
      data.due_date || null,
      data.notes || null,
      now,
      now,
    ],
  })

  const loan = await getLoanById(id)
  if (!loan) {
    throw new Error('Failed to create loan')
  }
  return loan
}

export async function getLoanById(id: string): Promise<Loan | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM loans WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Loan
}

export async function getUserLoans(userId: string): Promise<Loan[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  })

  return result.rows as unknown as Loan[]
}

export async function getActiveLoansByUser(userId: string): Promise<Loan[]> {
  const result = await db.execute({
    sql: `SELECT * FROM loans 
          WHERE user_id = ? 
          AND status IN ('pending', 'approved', 'active')
          ORDER BY created_at DESC`,
    args: [userId],
  })

  return result.rows as unknown as Loan[]
}

export async function addLoanGuarantor(data: {
  loan_id: string
  guarantor_user_id: string
  notes?: string
}): Promise<LoanGuarantor> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO loan_guarantors (
      id, loan_id, guarantor_user_id, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
    args: [
      id,
      data.loan_id,
      data.guarantor_user_id,
      data.notes || null,
      now,
      now,
    ],
  })

  const guarantor = await getLoanGuarantorById(id)
  if (!guarantor) {
    throw new Error('Failed to create loan guarantor')
  }
  return guarantor
}

export async function getLoanGuarantorById(id: string): Promise<LoanGuarantor | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM loan_guarantors WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as LoanGuarantor
}

export async function getLoanGuarantors(loanId: string): Promise<LoanGuarantor[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM loan_guarantors WHERE loan_id = ?',
    args: [loanId],
  })

  return result.rows as unknown as LoanGuarantor[]
}

export async function getActiveGuaranteesByUser(userId: string): Promise<LoanGuarantor[]> {
  const result = await db.execute({
    sql: `SELECT lg.* FROM loan_guarantors lg
          INNER JOIN loans l ON lg.loan_id = l.id
          WHERE lg.guarantor_user_id = ?
          AND lg.status IN ('pending', 'approved')
          AND l.status IN ('pending', 'approved', 'active')
          ORDER BY lg.created_at DESC`,
    args: [userId],
  })

  return result.rows as unknown as LoanGuarantor[]
}

export async function updateLoanGuarantorStatus(
  id: string,
  status: 'approved' | 'rejected' | 'cancelled'
): Promise<LoanGuarantor> {
  const now = new Date().toISOString()
  const updateField = status === 'approved' ? 'approved_at' : 'rejected_at'

  await db.execute({
    sql: `UPDATE loan_guarantors 
          SET status = ?, ${updateField} = ?, updated_at = ?
          WHERE id = ?`,
    args: [status, now, now, id],
  })

  const guarantor = await getLoanGuarantorById(id)
  if (!guarantor) {
    throw new Error('Failed to update loan guarantor')
  }
  return guarantor
}

export async function updateLoanStatus(
  id: string,
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted' | 'cancelled',
  approvedBy?: string
): Promise<Loan> {
  const now = new Date().toISOString()
  let sql = `UPDATE loans SET status = ?, updated_at = ?`
  const args: (string | number | null)[] = [status, now]

  if (status === 'approved' && approvedBy) {
    sql += `, approved_at = ?, approved_by = ?`
    args.push(now, approvedBy)
  } else if (status === 'active') {
    sql += `, disbursed_at = ?`
    args.push(now)
  } else if (status === 'paid') {
    sql += `, paid_at = ?`
    args.push(now)
  }

  sql += ` WHERE id = ?`
  args.push(id)

  await (db.execute as any)({ sql, args })

  const loan = await getLoanById(id)
  if (!loan) {
    throw new Error('Failed to update loan')
  }
  return loan
}

export async function addLoanPayment(data: {
  loan_id: string
  amount: number
  payment_method?: string
  reference_id?: string
  notes?: string
}): Promise<LoanPayment> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO loan_payments (
      id, loan_id, amount, payment_method, reference_id, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.loan_id,
      data.amount,
      data.payment_method || null,
      data.reference_id || null,
      data.notes || null,
      now,
    ],
  })

  const payment = await getLoanPaymentById(id)
  if (!payment) {
    throw new Error('Failed to create loan payment')
  }

  const loan = await getLoanById(data.loan_id)
  if (!loan) {
    throw new Error('Loan not found')
  }

  const newAmountPaid = (loan.amount_paid || 0) + data.amount
  await db.execute({
    sql: `UPDATE loans SET amount_paid = ?, updated_at = ? WHERE id = ?`,
    args: [newAmountPaid, now, data.loan_id],
  })

  // Calculate total loan amount with interest
  const interestRate = loan.interest_rate || 0
  const principalAmount = loan.amount
  const interestAmount = (principalAmount * interestRate) / 100
  const totalLoanAmount = principalAmount + interestAmount

  // Only mark as paid if total (including interest) is fully paid
  if (newAmountPaid >= totalLoanAmount) {
    await updateLoanStatus(data.loan_id, 'paid')
  }

  return payment
}

export async function getLoanPaymentById(id: string): Promise<LoanPayment | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM loan_payments WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as LoanPayment
}

export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY created_at DESC',
    args: [loanId],
  })

  return result.rows as unknown as LoanPayment[]
}

