/**
 * Unit Tests for Financial Calculator
 * 
 * Tests precise calculations, installment generation, and validation
 */

import { useTuitionCalculator } from '../useTuitionCalculator';
import Big from 'big.js';

describe('useTuitionCalculator', () => {
  const { calculate, preview, validateInput } = useTuitionCalculator();
  
  describe('Basic Calculations', () => {
    test('should calculate cash payment with no discounts', () => {
      const result = calculate({
        basePrice: 100000,
        vatRate: 0.18,
        discounts: [],
        paymentMethod: 'cash'
      });
      
      // 100,000 + 18% VAT = 118,000
      expect(result.basePrice).toBe('100000.00');
      expect(result.totalDiscount).toBe('0.00');
      expect(result.vatAmount).toBe('18000.00');
      expect(result.totalPrice).toBe('118000.00');
    });
    
    test('should apply single discount correctly', () => {
      const result = calculate({
        basePrice: 100000,
        vatRate: 0.18,
        discounts: [
          { type: 'sibling', amount: 10000, label: 'Kardeş İndirimi' }
        ],
        paymentMethod: 'cash'
      });
      
      // (100,000 - 10,000) + 18% VAT = 106,200
      expect(result.discountedPrice).toBe('90000.00');
      expect(result.vatAmount).toBe('16200.00');
      expect(result.totalPrice).toBe('106200.00');
    });
    
    test('should apply multiple discounts', () => {
      const result = calculate({
        basePrice: 100000,
        vatRate: 0.18,
        discounts: [
          { type: 'sibling', amount: 10000, label: 'Kardeş' },
          { type: 'earlyBird', amount: 5000, label: 'Erken Kayıt' },
          { type: 'staff', amount: 20000, label: 'Personel' }
        ],
        paymentMethod: 'cash'
      });
      
      // (100,000 - 35,000) + 18% VAT = 76,700
      expect(result.totalDiscount).toBe('35000.00');
      expect(result.discountedPrice).toBe('65000.00');
      expect(result.vatAmount).toBe('11700.00');
      expect(result.totalPrice).toBe('76700.00');
    });
    
    test('should apply cash discount', () => {
      const result = calculate({
        basePrice: 100000,
        vatRate: 0.18,
        discounts: [],
        paymentMethod: 'cash',
        cashDiscountRate: 0.05 // 5%
      });
      
      // (100,000 - 5%) + 18% VAT = 111,900
      expect(result.discountedPrice).toBe('95000.00');
      expect(result.vatAmount).toBe('17100.00');
      expect(result.totalPrice).toBe('112100.00');
    });
  });
  
  describe('Installment Generation', () => {
    test('should generate equal installments for divisible amount', () => {
      const result = calculate({
        basePrice: 120000,
        vatRate: 0,
        discounts: [],
        paymentMethod: 'installment',
        installmentCount: 12,
        startDate: '2025-01-01'
      });
      
      expect(result.installmentPlan).toHaveLength(12);
      expect(result.installmentPlan![0].amount).toBe('10000.00');
      expect(result.installmentPlan![11].amount).toBe('10000.00');
      
      // Verify total
      const total = result.installmentPlan!.reduce((sum, inst) => {
        return sum.plus(new Big(inst.amount));
      }, new Big(0));
      expect(total.toFixed(2)).toBe('120000.00');
    });
    
    test('should handle rounding difference in last installment', () => {
      const result = calculate({
        basePrice: 100000,
        vatRate: 0.18,
        discounts: [],
        paymentMethod: 'installment',
        installmentCount: 12,
        startDate: '2025-01-01'
      });
      
      // 118,000 / 12 = 9,833.333...
      expect(result.totalPrice).toBe('118000.00');
      expect(result.installmentPlan).toHaveLength(12);
      
      // First 11 installments
      expect(result.installmentPlan![0].amount).toBe('9833.33');
      
      // Last installment includes rounding difference
      expect(result.installmentPlan![11].amount).toBe('9833.37');
      
      // Verify exact total (no kuruş farkı)
      const total = result.installmentPlan!.reduce((sum, inst) => {
        return sum.plus(new Big(inst.amount));
      }, new Big(0));
      expect(total.toFixed(2)).toBe('118000.00');
    });
    
    test('should generate correct due dates', () => {
      const result = calculate({
        basePrice: 100000,
        vatRate: 0,
        discounts: [],
        paymentMethod: 'installment',
        installmentCount: 3,
        startDate: '2025-01-15'
      });
      
      expect(result.installmentPlan![0].dueDate).toBe('2025-01-15');
      expect(result.installmentPlan![1].dueDate).toBe('2025-02-15');
      expect(result.installmentPlan![2].dueDate).toBe('2025-03-15');
    });
  });
  
  describe('Validation', () => {
    test('should reject zero base price', () => {
      expect(() => {
        calculate({
          basePrice: 0,
          vatRate: 0.18,
          discounts: [],
          paymentMethod: 'cash'
        });
      }).toThrow('Brüt ücret 0\'dan büyük olmalıdır');
    });
    
    test('should reject invalid VAT rate', () => {
      expect(() => {
        calculate({
          basePrice: 100000,
          vatRate: 1.5, // >100%
          discounts: [],
          paymentMethod: 'cash'
        });
      }).toThrow('KDV oranı 0 ile 1 arasında olmalıdır');
    });
    
    test('should reject installment without count', () => {
      expect(() => {
        calculate({
          basePrice: 100000,
          vatRate: 0.18,
          discounts: [],
          paymentMethod: 'installment'
          // Missing installmentCount
        });
      }).toThrow('Taksit sayısı belirtilmelidir');
    });
    
    test('should reject excessive installment count', () => {
      expect(() => {
        calculate({
          basePrice: 100000,
          vatRate: 0.18,
          discounts: [],
          paymentMethod: 'installment',
          installmentCount: 24
        });
      }).toThrow('Maksimum 12 taksit yapılabilir');
    });
    
    test('should reject discount exceeding base price', () => {
      expect(() => {
        calculate({
          basePrice: 100000,
          vatRate: 0.18,
          discounts: [
            { type: 'scholarship', amount: 150000, label: 'Burs' }
          ],
          paymentMethod: 'cash'
        });
      }).toThrow('İndirim tutarı brüt ücreti aşamaz');
    });
  });
  
  describe('Preview Mode', () => {
    test('should provide quick calculation without full validation', () => {
      const result = preview({
        basePrice: 100000,
        vatRate: 0.18
      });
      
      expect(result.totalPrice).toBe('118000.00');
    });
    
    test('should handle missing base price gracefully', () => {
      const result = preview({});
      
      expect(result.basePrice).toBe('0.00');
      expect(result.totalPrice).toBe('0.00');
    });
  });
  
  describe('Precision Tests', () => {
    test('should handle precise decimal calculations', () => {
      const result = calculate({
        basePrice: 99999.99,
        vatRate: 0.18,
        discounts: [
          { type: 'sibling', amount: 9999.99, label: 'Test' }
        ],
        paymentMethod: 'cash'
      });
      
      // (99,999.99 - 9,999.99) * 1.18 = 106,200.00
      expect(result.totalPrice).toBe('106200.00');
    });
    
    test('should maintain precision with many operations', () => {
      const result = calculate({
        basePrice: 123456.78,
        vatRate: 0.18,
        discounts: [
          { type: 'sibling', amount: 12345.67, label: 'A' },
          { type: 'earlyBird', amount: 1234.56, label: 'B' },
          { type: 'staff', amount: 123.45, label: 'C' }
        ],
        paymentMethod: 'installment',
        installmentCount: 7
      });
      
      // Verify sum of installments = total price
      const sum = result.installmentPlan!.reduce((acc, inst) => {
        return acc.plus(new Big(inst.amount));
      }, new Big(0));
      
      expect(sum.toFixed(2)).toBe(result.totalPrice);
    });
  });
});

