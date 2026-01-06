import { Injectable, signal, computed } from '@angular/core';
import { Payment, PaymentGroup, DifferedPayment, ConfirmPayment } from '../../models';

/**
 * State Service para gestión de pagos usando Signals
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentsStateService {
  // Signals privados
  private _paymentsToDiffer = signal<Payment[]>([]);
  private _differedPayments = signal<DifferedPayment[]>([]);
  private _processPayment = signal<PaymentGroup[][]>([]);
  private _processPaymentGroup = signal<PaymentGroup[][]>([]);
  private _processPaymentConfirm = signal<PaymentGroup[][]>([]);
  private _confirmPayment = signal<ConfirmPayment | null>(null);
  private _paymentGeneralCounter = signal<number>(0);

  // Signals públicos (readonly)
  readonly paymentsToDifferSignal = this._paymentsToDiffer.asReadonly();
  readonly differedPaymentsSignal = this._differedPayments.asReadonly();
  readonly processPaymentSignal = this._processPayment.asReadonly();
  readonly processPaymentGroupSignal = this._processPaymentGroup.asReadonly();
  readonly processPaymentConfirmSignal = this._processPaymentConfirm.asReadonly();
  readonly confirmPaymentSignal = this._confirmPayment.asReadonly();
  readonly paymentGeneralCounterSignal = this._paymentGeneralCounter.asReadonly();

  // Computed signals
  readonly totalSelectedPayments = computed(() => {
    const allPayments: PaymentGroup[] = ([] as PaymentGroup[]).concat(...this._processPayment());
    return allPayments.filter((p: PaymentGroup) => p.offer).length;
  });

  readonly totalAmount = computed(() => {
    const allPayments: PaymentGroup[] = ([] as PaymentGroup[]).concat(...this._processPayment());
    return allPayments
      .filter((p: PaymentGroup) => p.offer)
      .reduce((sum: number, p: PaymentGroup) => sum + (p.total || p.amount), 0);
  });

  // Métodos para actualizar estado
  setPaymentsToDiffer(payments: Payment[]): void {
    this._paymentsToDiffer.set(payments);
  }

  setDifferedPayments(payments: DifferedPayment[]): void {
    this._differedPayments.set(payments);
  }

  setProcessPayment(payments: PaymentGroup[][]): void {
    this._processPayment.set(payments);
  }

  setProcessPaymentGroup(payments: PaymentGroup[][]): void {
    this._processPaymentGroup.set(payments);
  }

  setProcessPaymentConfirm(payments: PaymentGroup[][]): void {
    this._processPaymentConfirm.set(payments);
  }

  setConfirmPayment(confirm: ConfirmPayment): void {
    this._confirmPayment.set(confirm);
  }

  setPaymentGeneralCounter(count: number): void {
    this._paymentGeneralCounter.set(count);
  }

  // Métodos de utilidad
  reset(): void {
    this._paymentsToDiffer.set([]);
    this._differedPayments.set([]);
    this._processPayment.set([]);
    this._processPaymentGroup.set([]);
    this._processPaymentConfirm.set([]);
    this._confirmPayment.set(null);
    this._paymentGeneralCounter.set(0);
  }

  /**
   * Limpiar solo las selecciones de compras (sin afectar los pagos disponibles)
   */
  clearSelections(): void {
    // Limpiar arrays de grupos
    this._processPayment.set([]);
    this._processPaymentGroup.set([]);
    this._processPaymentConfirm.set([]);
    this._confirmPayment.set(null);
    this._paymentGeneralCounter.set(0);
  }
}

