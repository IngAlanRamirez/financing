import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonButton
} from '@ionic/angular/standalone';
import { DifferedPaymentsService } from '../../../shared/services/differed.payments.service';
import { UIStateService } from '../../../core/state/ui.state.service';
import { DifferedPayment, PaymentOffer } from '../../../models';

interface PaymentDetail {
  label: string;
  value: string;
}

@Component({
  selector: 'app-differed',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonButton
  ],
  templateUrl: './differed.component.html',
  styleUrls: ['./differed.component.scss']
})
export class DifferedComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private differedPaymentsService = inject(DifferedPaymentsService);
  private uiState = inject(UIStateService);

  differedPayment: DifferedPayment | null = null;
  isLoading = this.uiState.isLoadingSignal;
  id: string | null = null;

  // Computed para obtener los detalles de la oferta
  paymentDetails = computed(() => {
    if (!this.differedPayment || !this.differedPayment.ofertas || this.differedPayment.ofertas.length === 0) {
      return [];
    }

    const offer = this.differedPayment.ofertas[0];
    const details: PaymentDetail[] = [];

    // Monto de compra
    details.push({
      label: 'Monto de compra',
      value: `${this.differedPayment.montoCompra.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
    });

    // Tasa de interés anual (calcular desde mensual)
    if (offer.interesMensual) {
      const annualRate = (offer.interesMensual * 12 * 100).toFixed(2);
      details.push({
        label: 'Tasa de interés anual',
        value: `${annualRate}%`
      });

      // Tasa de interés mensual
      const monthlyRate = (offer.interesMensual * 100).toFixed(2);
      details.push({
        label: 'Tasa de interés mensual',
        value: `${monthlyRate}%`
      });
    }

    // Plazo
    details.push({
      label: 'Plazo',
      value: `${offer.noMeses} meses`
    });

    // Pago mensual
    if (offer.totalPago) {
      const monthlyPayment = offer.totalPago / parseInt(offer.noMeses);
      details.push({
        label: 'Pago mensual',
        value: `${monthlyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
      });
    }

    return details;
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadDifferedPayment();
  }

  loadDifferedPayment(): void {
    this.uiState.setLoading(true);
    
    this.differedPaymentsService.getDifferedPayments().subscribe({
      next: (data) => {
        if (this.id) {
          this.differedPayment = this.findPaymentById(data, this.id);
        }
        this.uiState.setLoading(false);
      },
      error: (err) => {
        console.error('Error loading differed payment:', err);
        this.uiState.showError('Error al cargar la compra diferida');
        this.uiState.setLoading(false);
      }
    });
  }

  findPaymentById(payments: DifferedPayment[], id: string): DifferedPayment | null {
    const paymentId = parseInt(id, 10);
    return payments.find(p => p.id === paymentId) || null;
  }

  goBack(): void {
    this.location.back();
  }
}

