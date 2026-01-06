import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonIcon,
  IonModal,
  IonFooter
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, chevronForwardOutline } from 'ionicons/icons';
import { PaymentsStateService } from '../../../core/state/payments.state.service';
import { TermsService } from '../../../shared/services/terms.service';
import { CardService } from '../../../shared/services/card.service';
import { UIStateService } from '../../../core/state/ui.state.service';
import { ConfirmPayment } from '../../../models';

interface SummaryRow {
  title: string;
  value: string;
}

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonModal,
    IonFooter
  ],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  private paymentsState = inject(PaymentsStateService);
  private termsService = inject(TermsService);
  private cardService = inject(CardService);
  private uiState = inject(UIStateService);
  private router = inject(Router);
  private modalController = inject(ModalController);

  // Signals
  termsAccepted = signal<boolean>(false);
  showTermsModal = signal<boolean>(false);
  terms = signal<string>('');
  canConfirm = signal<boolean>(false);

  // Obtener datos del resumen
  summaryData = computed(() => {
    const payments = this.paymentsState.processPaymentConfirmSignal();
    if (!payments || payments.length === 0 || payments[0].length === 0) {
      return null;
    }

    const selectedPayments = payments[0].filter(p => p.offer);
    if (selectedPayments.length === 0) {
      return null;
    }

    const totalAmount = selectedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalWithInterest = selectedPayments.reduce((sum, p) => sum + (p.total || p.amount || 0), 0);
    const monthlyPayment = selectedPayments.reduce((sum, p) => {
      const months = parseInt(p.month || '6');
      return sum + ((p.total || p.amount || 0) / months);
    }, 0);
    
    const firstPayment = selectedPayments[0];
    const monthlyRate = firstPayment?.rate || 0;
    const annualRate = monthlyRate * 12 * 100;
    const months = firstPayment?.month || '6';

    return {
      totalAmount,
      totalWithInterest,
      monthlyPayment,
      annualRate: annualRate.toFixed(2),
      monthlyRate: (monthlyRate * 100).toFixed(2),
      months,
      count: selectedPayments.length,
      type: firstPayment?.type || 'MCI'
    };
  });

  // Resumen para mostrar
  summaryRows = computed(() => {
    const data = this.summaryData();
    if (!data) return [];

    const rows: SummaryRow[] = [
      {
        title: `Total de ${data.count === 1 ? 'una compra' : 'las ' + data.count + ' compras'}`,
        value: `${data.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
      },
      {
        title: 'Tasa de interés anual',
        value: `${data.annualRate}%`
      },
      {
        title: 'Tasa de interés mensual',
        value: `${data.monthlyRate}%`
      },
      {
        title: 'Total a pagar con intereses sin IVA',
        value: `${data.totalWithInterest.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
      },
      {
        title: 'Plazo',
        value: `${data.months} meses`
      },
      {
        title: data.type === 'MCI' ? 'Pago mensual con intereses sin IVA' : 'Pago mensual sin intereses',
        value: `${data.monthlyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
      }
    ];

    return rows;
  });

  // Información de la tarjeta
  cardInfo = computed(() => {
    // Obtener información de la tarjeta del servicio
    const cardData = this.cardService.getCardInfo();
    return {
      name: cardData.name || 'Tarjeta de Crédito',
      number: cardData.number || '****',
      imageUrl: cardData.imageUrl || ''
    };
  });

  constructor() {
    addIcons({ closeOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    // Cargar términos y condiciones
    this.termsService.getTermsAndConditions().subscribe({
      next: (data) => {
        if (data && data.description) {
          this.terms.set(data.description);
        }
      },
      error: (err) => {
        console.error('Error loading terms:', err);
      }
    });

    // Actualizar canConfirm cuando se aceptan términos
    this.termsAccepted.set(false);
    this.canConfirm.set(false);
  }

  toggleTerms(): void {
    const newValue = !this.termsAccepted();
    this.termsAccepted.set(newValue);
    this.canConfirm.set(newValue);
  }

  openTermsModal(): void {
    this.showTermsModal.set(true);
  }

  closeTermsModal(): void {
    this.showTermsModal.set(false);
  }

  acceptTermsFromModal(): void {
    this.termsAccepted.set(true);
    this.canConfirm.set(true);
    this.showTermsModal.set(false);
  }

  async confirmDiffer(): Promise<void> {
    if (!this.canConfirm()) return;

    const data = this.summaryData();
    if (!data) return;

    // Deshabilitar el botón mientras se procesa
    this.canConfirm.set(false);

    // Crear objeto de confirmación
    const confirmPayment: ConfirmPayment = {
      month: data.months,
      paymentTotalMonth: data.monthlyPayment,
      paymentTotalRate: data.totalWithInterest,
      paymentAnualRate: parseFloat(data.annualRate),
      paymentMonthRate: parseFloat(data.monthlyRate),
      paymentTotalAmount: data.totalAmount,
      invoice: Math.floor(Math.random() * 1000000000),
      datetime: new Date().toISOString(),
      differedPayments: this.paymentsState.processPaymentConfirmSignal()[0] || [],
      numPayments: data.count
    };

    // Guardar en el estado
    this.paymentsState.setConfirmPayment(confirmPayment);

    // Cerrar el modal
    await this.modalController.dismiss();

    // Navegar al ticket después de un pequeño delay
    setTimeout(() => {
      this.router.navigate(['/products/ticket']);
    }, 300);
  }

  async cancel(): Promise<void> {
    await this.modalController.dismiss();
  }
}

