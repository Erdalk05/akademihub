import { addMonths } from 'date-fns';

// Local types for payment calculation
interface PaymentDiscount {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  amount?: number;
}

interface PaymentInstallment {
  no: number;
  date: Date;
  amount: number;
  label?: string;
  isPaid?: boolean;
  dueDate?: string;
  status?: 'pending' | 'paid' | 'overdue';
}

export const AVAILABLE_DISCOUNTS: PaymentDiscount[] = [
  { id: 'sibling', name: 'Kardeş İndirimi', rate: 0.08, type: 'percentage' },
  { id: 'early', name: 'Erken Kayıt İndirimi', rate: 0.05, type: 'percentage' },
  { id: 'teacher', name: 'Öğretmen Çocuğu', rate: 0.10, type: 'percentage' },
];

export const CASH_DISCOUNT_RATE = 0.12; // Peşin ödemede %12

export function calculateFinancials(
  basePrice: number,
  selectedDiscounts: string[],
  paymentType: 'cash' | 'installment'
) {
  let totalDiscountAmount = 0;
  const appliedDiscounts: PaymentDiscount[] = [];

  // Peşin ödeme indirimi
  if (paymentType === 'cash') {
    const amount = basePrice * CASH_DISCOUNT_RATE;
    totalDiscountAmount += amount;
    appliedDiscounts.push({
      id: 'cash',
      name: 'Peşin Ödeme İndirimi',
      rate: CASH_DISCOUNT_RATE,
      type: 'percentage',
      amount
    });
  } else {
    // Diğer indirimler (Sadece taksitlide veya ek olarak uygulanabilir, promptta peşinde sadece %12 dendiği için böyle yorumluyorum ama kümülatif de olabilir. 
    // Prompt: "Peşin seçilirse: %12 indirim direkt uygulanır". Diğer indirimler opsiyonel kısmında checkbox ile seçiliyor. 
    // Varsayım: Peşin seçilirse sadece peşin indirimi uygulanır VEYA peşin indirimi + diğerleri. 
    // Prompttaki hesaplama örneğinde "İndirimler: -9.600 (Kardeş %8)" diyor. Peşin seçeneği ayrı.
    // Basitlik adına: Peşin seçilirse SADECE %12 (veya diğerleri de eklenirse çok düşer). 
    // Ancak kullanıcı "Peşin seçilirse %12 indirim uygulanır" demiş, diğer indirimleri engelle dememiş.
    // Yine de genelde peşin indirimi en büyüktür ve diğerleriyle birleşmez.
    // Kodda: Eğer peşinse sadece peşin indirimi, değilse seçili indirimler.
    
    // DÜZELTME: Prompttaki UI'da "Peşin Ödeme (%12 İndirim)" bir seçenek, "İndirimler (Opsiyonel)" ayrı bir bölüm.
    // Taksitli seçildiğinde opsiyonel indirimler seçilebiliyor.
    // Peşin seçildiğinde opsiyonel indirimler pasif mi? Genelde evet. 
    // Şimdilik Taksitli -> Seçili İndirimler, Peşin -> Sadece %12 olarak yapıyorum.
    
    selectedDiscounts.forEach(id => {
      const discount = AVAILABLE_DISCOUNTS.find(d => d.id === id);
      if (discount) {
        const amount = basePrice * discount.rate;
        totalDiscountAmount += amount;
        appliedDiscounts.push({ ...discount, amount });
      }
    });
  }

  const netAmount = Math.round(basePrice - totalDiscountAmount);

  return {
    basePrice,
    totalDiscountAmount,
    netAmount,
    appliedDiscounts
  };
}

export function generatePaymentPlan(
  netAmount: number,
  downPayment: number,
  installmentsCount: number,
  startDate: Date
): PaymentInstallment[] {
  const plan: PaymentInstallment[] = [];
  
  // Peşinat
  if (downPayment > 0) {
    plan.push({
      no: 0,
      date: new Date(), // Bugün
      amount: downPayment,
      label: 'Peşinat',
      isPaid: false // Henüz ödenmedi
    });
  }

  const remainingAmount = netAmount - downPayment;
  
  if (remainingAmount <= 0 && installmentsCount > 0) {
    // Hata durumu veya tam ödeme
    return plan;
  }

  if (installmentsCount > 0) {
    const monthlyAmount = Math.floor(remainingAmount / installmentsCount); // Küsürat sorunu için floor
    const remainder = remainingAmount - (monthlyAmount * installmentsCount); // Kalan kuruşlar

    for (let i = 1; i <= installmentsCount; i++) {
      const date = addMonths(startDate, i - 1);
      // Son taksite kalanı ekle veya ilk taksite ekle. Genelde ilk veya son. Son taksite ekleyelim.
      const amount = i === installmentsCount ? monthlyAmount + remainder : monthlyAmount;
      
      plan.push({
        no: i,
        date,
        amount,
        label: `${i}. Taksit`
      });
    }
  }

  return plan;
}



