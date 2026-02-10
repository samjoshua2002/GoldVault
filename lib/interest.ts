import { differenceInMonths, startOfMonth, isAfter } from 'date-fns';
import Loan, { ILoan } from '@/models/Loan';
import CompletedLoan from '@/models/CompletedLoan';
import dbConnect from '@/lib/mongodb';

export const INTEREST_RATE = 0.02; // 2% per month

/**
 * Calculates current interest for a loan based on principal and elapsed months.
 * Interest is applied on the 1st of every month.
 */
export async function updateLoanInterest(loan: ILoan) {
    const now = new Date();
    const lastUpdated = new Date(loan.lastInterestUpdated);
    const startDate = new Date(loan.startDate);

    // We base interest on the full duration since start date, NOT incrementally since last update
    // because incremental updates can be tricky if dates are corrupted.
    // However, to respect "1st of month" logic:
    // Interest is due for every "start of month" that has passed since startDate.
    // Example: Start Jan 15.
    // Feb 1: 1 month interest due? 
    // User requirement: "feb 24 if mar 1 comes also it consider as 1 month because month changed from 2 to 3"
    // So distinct monthcount = differenceInMonths(startOfMonth(now), startOfMonth(startDate))

    // BUT we must not double-count interest already added.
    // So better:
    // Calculate total interest that SHOULD be there = monthsPassed * monthlyRate
    // Update currentInterest to match that.

    // Let's stick to existing logic but reset lastInterestUpdated only if we actually add interest?
    // Actually the safest way is:
    // Total Expected Interest = differenceInMonths(startOfMonth(now), startOfMonth(startDate)) * (Principal * 0.02)
    // Then loan.currentInterest = Total Expected Interest
    // This is idempotent and self-correcting.

    const totalMonths = differenceInMonths(startOfMonth(now), startOfMonth(startDate));

    // Ensure we don't have negative months (future date case?)
    const validMonths = Math.max(0, totalMonths);

    const monthlyInterest = loan.principalAmount * INTEREST_RATE;
    const totalExpectedInterest = monthlyInterest * validMonths;

    if (loan.currentInterest !== totalExpectedInterest) {
        loan.currentInterest = totalExpectedInterest;
        loan.totalAmount = loan.principalAmount + loan.currentInterest - loan.amountPaid;
        loan.lastInterestUpdated = now;
        await loan.save();
    }

    // Check for 1-year condition (12 months)
    // This check uses actual date difference, not just month boundaries usually?
    // Let's stick to month boundaries to be consistent
    if (validMonths >= 12) {
        await completeLoan(loan, 'expired');
    }
}

/**
 * Moves a loan to the completedLoans collection.
 */
export async function completeLoan(loan: ILoan, reason: 'repaid' | 'expired') {
    await dbConnect();

    const durationMonths = differenceInMonths(new Date(), new Date(loan.startDate));

    const completed = new CompletedLoan({
        loanId: loan.loanId,
        userId: loan.userId,
        goldId: loan.goldId,
        principalAmount: loan.principalAmount,
        totalPaid: loan.amountPaid,
        startDate: loan.startDate,
        completedDate: new Date(),
        durationMonths,
    });

    await completed.save();

    // Update status or remove
    loan.status = 'completed';
    await loan.save();

    // In some systems, we might delete it from Loan collection, 
    // but keeping it with status 'completed' is often safer.
    // The README says "Remove from loan collection (optional)". 
    // I'll keep it but filtered in the UI.
}

/**
 * Batch update for all active loans.
 */
export async function updateAllActiveLoans() {
    await dbConnect();
    const activeLoans = await Loan.find({ status: 'active' });

    for (const loan of activeLoans) {
        try {
            await updateLoanInterest(loan);
        } catch (e) {
            console.error(`Failed to update interest for loan ${loan.loanId}:`, e);
        }
    }
}
