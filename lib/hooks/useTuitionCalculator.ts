/**
 * Financial Calculation Engine for Turkish Private School Tuition
 * 
 * Uses Big.js for precise decimal arithmetic (no floating point errors)
 * Complies with Turkish KDV (VAT) regulations and MEB pricing rules
 * 
 * @author AkademiHub System Architect
 * @version 2.0.0
 */

import Big from 'big.js';

// Configure Big.js for financial precision
Big.DP = 2; // 2 decimal places (Turkish Lira has 2 decimal kuruş)
Big.RM = Big.roundHalfUp; // Standard commercial rounding

/**
 * Discount Types
 */
export interface Discount {
  type: 'sibling' | 'earlyBird' | 'staff' | 'scholarship' | 'cash';
  amount: number;
  label: string;
}

/**
 * Payment Method
 */
export type PaymentMethod = 'cash' | 'upfront' | 'installment';

/**
 * Installment Plan
 */
export interface InstallmentPlan {
  installmentNumber: number;
  dueDate: string;
  amount: string; // Big.js toString()
  isPaid: boolean;
  description: string;
}

/**
 * Financial Calculation Input
 */
export interface TuitionCalculationInput {
  basePrice: number;          // Gross tuition fee (brüt ücret)
  vatRate: number;            // KDV rate (typically 0.18 for 18%)
  discounts: Discount[];      // Applied discounts
  paymentMethod: PaymentMethod;
  installmentCount?: number;  // Required if paymentMethod is 'installment'
  startDate?: string;         // Start date for installment schedule (ISO format)
  cashDiscountRate?: number;  // Additional discount for cash payment (e.g., 0.05 for 5%)
}

/**
 * Financial Calculation Output
 */
export interface TuitionCalculationOutput {
  // Price Breakdown
  basePrice: string;
  totalDiscount: string;
  discountedPrice: string;
  vatAmount: string;
  totalPrice: string;
  
  // Discount Details
  appliedDiscounts: Array<{
    type: string;
    label: string;
    amount: string;
  }>;
  
  // Payment Details
  paymentMethod: PaymentMethod;
  installmentPlan?: InstallmentPlan[];
  
  // Metadata
  calculatedAt: string;
  currency: 'TRY';
}

/**
 * Tuition Calculator Hook
 */
export function useTuitionCalculator() {
  
  /**
   * Main calculation function
   */
  const calculate = (input: TuitionCalculationInput): TuitionCalculationOutput => {
    try {
      // Validate input
      validateInput(input);
      
      // Step 1: Calculate discounted price
      const basePrice = new Big(input.basePrice);
      const totalDiscount = calculateTotalDiscount(input.discounts);
      const discountedPrice = basePrice.minus(totalDiscount);
      
      // Step 2: Apply cash discount if applicable
      let finalDiscountedPrice = discountedPrice;
      let cashDiscountAmount = new Big(0);
      
      if (input.paymentMethod === 'cash' && input.cashDiscountRate) {
        cashDiscountAmount = discountedPrice.times(input.cashDiscountRate);
        finalDiscountedPrice = discountedPrice.minus(cashDiscountAmount);
      }
      
      // Step 3: Calculate VAT (KDV) on discounted price
      const vatRate = new Big(input.vatRate);
      const vatAmount = finalDiscountedPrice.times(vatRate);
      
      // Step 4: Calculate total price (discounted + VAT)
      const totalPrice = finalDiscountedPrice.plus(vatAmount);
      
      // Step 5: Generate installment plan if needed
      let installmentPlan: InstallmentPlan[] | undefined;
      
      if (input.paymentMethod === 'installment' && input.installmentCount) {
        installmentPlan = generateInstallmentPlan(
          totalPrice,
          input.installmentCount,
          input.startDate || new Date().toISOString()
        );
      }
      
      // Step 6: Build discount details
      const appliedDiscounts = input.discounts.map(d => ({
        type: d.type,
        label: d.label,
        amount: new Big(d.amount).toFixed(2)
      }));
      
      // Add cash discount if applied
      if (cashDiscountAmount.gt(0)) {
        appliedDiscounts.push({
          type: 'cash',
          label: 'Peşin Ödeme İndirimi',
          amount: cashDiscountAmount.toFixed(2)
        });
      }
      
      // Step 7: Return calculation output
      return {
        basePrice: basePrice.toFixed(2),
        totalDiscount: totalDiscount.plus(cashDiscountAmount).toFixed(2),
        discountedPrice: finalDiscountedPrice.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        appliedDiscounts,
        paymentMethod: input.paymentMethod,
        installmentPlan,
        calculatedAt: new Date().toISOString(),
        currency: 'TRY'
      };
      
    } catch (error) {
      console.error('Tuition calculation error:', error);
      throw new Error('Ücret hesaplama hatası: ' + (error as Error).message);
    }
  };
  
  /**
   * Calculate total discount from discount array
   */
  const calculateTotalDiscount = (discounts: Discount[]): Big => {
    return discounts.reduce((total, discount) => {
      return total.plus(new Big(discount.amount));
    }, new Big(0));
  };
  
  /**
   * Generate installment plan with proper rounding
   * Ensures: Sum(Installments) === Total Price (no kuruş farkı)
   */
  const generateInstallmentPlan = (
    totalPrice: Big,
    installmentCount: number,
    startDateISO: string
  ): InstallmentPlan[] => {
    
    // Calculate base installment amount
    const baseInstallmentAmount = totalPrice.div(installmentCount);
    
    // Round down to 2 decimals
    const roundedInstallment = new Big(baseInstallmentAmount.toFixed(2, Big.roundDown));
    
    // Calculate rounding difference (kuruş farkı)
    const totalRounded = roundedInstallment.times(installmentCount);
    const roundingDifference = totalPrice.minus(totalRounded);
    
    // Generate installment schedule
    const plan: InstallmentPlan[] = [];
    const startDate = new Date(startDateISO);
    
    for (let i = 0; i < installmentCount; i++) {
      let installmentAmount = roundedInstallment;
      
      // Add rounding difference to the last installment
      if (i === installmentCount - 1) {
        installmentAmount = installmentAmount.plus(roundingDifference);
      }
      
      // Calculate due date (monthly intervals)
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      plan.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
        amount: installmentAmount.toFixed(2),
        isPaid: false,
        description: `${i + 1}. Taksit`
      });
    }
    
    // Validate: Sum of installments must equal total price
    const calculatedTotal = plan.reduce((sum, inst) => {
      return sum.plus(new Big(inst.amount));
    }, new Big(0));
    
    if (!calculatedTotal.eq(totalPrice)) {
      throw new Error('Taksit toplamı eşleşmiyor! Hesaplama hatası.');
    }
    
    return plan;
  };
  
  /**
   * Validate calculation input
   */
  const validateInput = (input: TuitionCalculationInput): void => {
    if (input.basePrice <= 0) {
      throw new Error('Brüt ücret 0\'dan büyük olmalıdır.');
    }
    
    if (input.vatRate < 0 || input.vatRate > 1) {
      throw new Error('KDV oranı 0 ile 1 arasında olmalıdır.');
    }
    
    if (input.paymentMethod === 'installment') {
      if (!input.installmentCount || input.installmentCount < 1) {
        throw new Error('Taksit sayısı belirtilmelidir.');
      }
      
      if (input.installmentCount > 12) {
        throw new Error('Maksimum 12 taksit yapılabilir.');
      }
    }
    
    // Validate discounts don't exceed base price
    const totalDiscount = input.discounts.reduce((sum, d) => sum + d.amount, 0);
    if (totalDiscount > input.basePrice) {
      throw new Error('İndirim tutarı brüt ücreti aşamaz.');
    }
  };
  
  /**
   * Preview calculation without generating full output
   */
  const preview = (input: Partial<TuitionCalculationInput>): Partial<TuitionCalculationOutput> => {
    try {
      if (!input.basePrice) {
        return { basePrice: '0.00', totalPrice: '0.00', currency: 'TRY' };
      }
      
      const basePrice = new Big(input.basePrice);
      const discounts = input.discounts || [];
      const vatRate = new Big(input.vatRate || 0.18);
      
      const totalDiscount = calculateTotalDiscount(discounts);
      const discountedPrice = basePrice.minus(totalDiscount);
      const vatAmount = discountedPrice.times(vatRate);
      const totalPrice = discountedPrice.plus(vatAmount);
      
      return {
        basePrice: basePrice.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        discountedPrice: discountedPrice.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        currency: 'TRY'
      };
    } catch (error) {
      console.error('Preview calculation error:', error);
      return { basePrice: '0.00', totalPrice: '0.00', currency: 'TRY' };
    }
  };
  
  return {
    calculate,
    preview,
    validateInput
  };
}

/**
 * Utility: Format Turkish Lira
 */
export const formatTRY = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Utility: Parse Turkish formatted number
 */
export const parseTRY = (formatted: string): number => {
  // Remove currency symbol, spaces, and convert Turkish decimal separator
  const cleaned = formatted
    .replace(/[₺\s]/g, '')
    .replace('.', '')  // Remove thousand separator
    .replace(',', '.'); // Convert decimal separator
  
  return parseFloat(cleaned);
};

