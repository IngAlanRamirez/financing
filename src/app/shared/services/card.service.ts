import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CARD_IMAGE, CARD_IMAGES } from '../../constants/app.constants';

export interface CardInfo {
  name: string;
  number: string;
  imageUrl: string;
  codStamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private http = inject(HttpClient);

  /**
   * Obtener imagen de tarjeta según código de estampado
   */
  getImageCard(codStamp: string | null): string {
    if (!codStamp) {
      return CARD_IMAGE.URL + CARD_IMAGES.SNTNDR_GENERICA;
    }

    let urlImage = '';

    switch (codStamp) {
      case '700': urlImage = CARD_IMAGE.URL + CARD_IMAGES.SNTDR_SF; break;
      case '701': urlImage = CARD_IMAGE.URL + CARD_IMAGES.SNTDR_ORO; break;
      case '702': urlImage = CARD_IMAGE.URL + CARD_IMAGES.SNTDR_ACC; break;
      case '703': urlImage = CARD_IMAGE.URL + CARD_IMAGES.SNTDR_ACC; break;
      case '641': urlImage = CARD_IMAGE.URL + CARD_IMAGES.LIKEU_BLUE; break;
      case '642': urlImage = CARD_IMAGE.URL + CARD_IMAGES.LIKEU_RED; break;
      case '643': urlImage = CARD_IMAGE.URL + CARD_IMAGES.LIKEU_STAR; break;
      case '644': urlImage = CARD_IMAGE.URL + CARD_IMAGES.LIKEU_PINK; break;
      case '645': urlImage = CARD_IMAGE.URL + CARD_IMAGES.LIKEU_GREEN; break;
      case '646': urlImage = CARD_IMAGE.URL + CARD_IMAGES.LIKEU_WHITE; break;
      default: urlImage = CARD_IMAGE.URL + CARD_IMAGES.SNTNDR_GENERICA; break;
    }

    return urlImage;
  }

  /**
   * Obtener información de la tarjeta desde datos dummy
   */
  getCardInfo(): CardInfo {
    // Por ahora retornar datos dummy, luego se puede cargar desde un servicio
    const cardData = sessionStorage.getItem('cardInfo');
    if (cardData) {
      try {
        const parsed = JSON.parse(cardData);
        return {
          name: parsed.name || 'LikeU Red',
          number: parsed.number || '*0942',
          imageUrl: parsed.codStamp ? this.getImageCard(parsed.codStamp) : '',
          codStamp: parsed.codStamp
        };
      } catch {
        // Si hay error, usar valores por defecto
      }
    }

    // Valores por defecto - Tarjeta Rockstar
    return {
      name: 'Tarjeta Rockstar',
      number: '5038',
      imageUrl: 'assets/cards/card-1.png',
      codStamp: undefined
    };
  }
}

