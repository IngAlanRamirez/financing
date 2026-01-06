/**
 * Interfaces relacionadas con pagos y ofertas
 */

export interface PaymentOffer {
  id: number;
  tipo: 'MSI' | 'MCI';
  noMeses: string; // '3', '6', '9', '12', '18', '24'
  totalPago: number | null; // null para MSI, número para MCI
  interesMensual: number | null; // null para MSI, número decimal para MCI
}

export interface Payment {
  id: number;
  nomCom: string;
  fechaCompra: string;
  montoCompra: number;
  ofertas: PaymentOffer[];
  // Campos adicionales para el estado de la aplicación
  offer?: boolean;
  offerIdTest?: number;
  month?: string;
  type?: 'MSI' | 'MCI';
  total?: number;
  rate?: number;
  msi?: string;
  mci?: string;
}

export interface DifferedPayment {
  id: number;
  nomCom: string;
  fechaModificacion: string;
  montoCompra: number;
  ofertas: PaymentOffer[];
  offerIdTest?: number;
}

export interface PaymentGroup {
  id: number;
  title: string;
  date: string;
  amount: number;
  offer: boolean;
  offerIdTest?: number;
  month: string;
  type: 'MSI' | 'MCI';
  total: number;
  rate: number;
  msi?: string;
  mci?: string;
}

export interface ConfirmPayment {
  month: string;
  paymentTotalMonth: number;
  paymentTotalRate: number;
  paymentAnualRate: number;
  paymentMonthRate: number;
  paymentTotalAmount: number;
  invoice?: number;
  datetime?: string;
  differedPayments?: PaymentGroup[];
  numPayments?: number;
}

export interface TicketData extends ConfirmPayment {
  differedPayments: PaymentGroup[];
  numPayments: number;
  invoice: number;
  datetime: string;
}

