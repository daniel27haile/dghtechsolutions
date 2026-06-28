import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface CartItem {
  resourceId: string;
  title: string;
  thumbnailUrl?: string;
  price: number;
  oldPrice?: number;
  discountPct?: number;
}

export interface CartData {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  subtotal: number;
  total: number;
  itemCount: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly base = `${environment.apiUrl}/cart`;
  private http = inject(HttpClient);

  private _cart  = signal<CartData>({ items: [], couponCode: null, couponDiscount: 0, subtotal: 0, total: 0, itemCount: 0 });
  private _open  = signal(false);
  private _loading = signal(false);

  readonly cart    = this._cart.asReadonly();
  readonly open    = this._open.asReadonly();
  readonly loading = this._loading.asReadonly();

  openDrawer():  void { this._open.set(true); }
  closeDrawer(): void { this._open.set(false); }
  toggleDrawer():void { this._open.update(v => !v); }

  load(): void {
    this._loading.set(true);
    this.http.get<ApiResponse<CartData>>(this.base).subscribe({
      next:  r => { this._cart.set(r.data ?? this.empty()); this._loading.set(false); },
      error: () => this._loading.set(false),
    });
  }

  addItem(resourceId: string): Observable<ApiResponse<CartData>> {
    return this.http.post<ApiResponse<CartData>>(`${this.base}/items`, { resourceId }).pipe(
      tap(r => { if (r.data) this._cart.set(r.data); })
    );
  }

  removeItem(resourceId: string): Observable<ApiResponse<CartData>> {
    return this.http.delete<ApiResponse<CartData>>(`${this.base}/items/${resourceId}`).pipe(
      tap(r => { if (r.data) this._cart.set(r.data); })
    );
  }

  clear(): Observable<ApiResponse<CartData>> {
    return this.http.delete<ApiResponse<CartData>>(this.base).pipe(
      tap(r => { if (r.data) this._cart.set(r.data); })
    );
  }

  applyCoupon(code: string): Observable<ApiResponse<CartData>> {
    return this.http.post<ApiResponse<CartData>>(`${this.base}/coupon`, { code }).pipe(
      tap(r => { if (r.data) this._cart.set(r.data); })
    );
  }

  removeCoupon(): Observable<ApiResponse<CartData>> {
    return this.http.delete<ApiResponse<CartData>>(`${this.base}/coupon`).pipe(
      tap(r => { if (r.data) this._cart.set(r.data); })
    );
  }

  squareCheckout(): Observable<ApiResponse<{ url: string; orderId: string; free?: boolean }>> {
    return this.http.post<ApiResponse<{ url: string; orderId: string; free?: boolean }>>(
      `${environment.apiUrl}/square/checkout`, {}
    );
  }

  isInCart(resourceId: string): boolean {
    return this._cart().items.some(i => i.resourceId === resourceId);
  }

  private empty(): CartData {
    return { items: [], couponCode: null, couponDiscount: 0, subtotal: 0, total: 0, itemCount: 0 };
  }
}
