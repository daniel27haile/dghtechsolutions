import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, forkJoin, of, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

const GUEST_CART_KEY = 'dgh_guest_cart';

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

  private _cart        = signal<CartData>({ items: [], couponCode: null, couponDiscount: 0, subtotal: 0, total: 0, itemCount: 0 });
  private _guestItems  = signal<CartItem[]>(this.loadGuestCart());
  private _open        = signal(false);
  private _loading     = signal(false);

  readonly cart           = this._cart.asReadonly();
  readonly guestItems     = this._guestItems.asReadonly();
  readonly open           = this._open.asReadonly();
  readonly loading        = this._loading.asReadonly();
  readonly totalItemCount = computed(() => this._cart().itemCount + this._guestItems().length);

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

  stripeCartCheckout(): Observable<ApiResponse<{ url: string; sessionId: string; free?: boolean }>> {
    return this.http.post<ApiResponse<{ url: string; sessionId: string; free?: boolean }>>(
      `${environment.apiUrl}/payments/checkout/cart`, {}
    );
  }

  isInCart(resourceId: string): boolean {
    return this._cart().items.some(i => i.resourceId === resourceId) ||
      this._guestItems().some(i => i.resourceId === resourceId);
  }

  // ── Guest cart (unauthenticated) ───────────────────────────────────────────

  addToGuestCart(item: CartItem): void {
    const items = this._guestItems();
    if (items.some(i => i.resourceId === item.resourceId)) return;
    const updated = [...items, item];
    this._guestItems.set(updated);
    this.saveGuestCart(updated);
  }

  removeFromGuestCart(resourceId: string): void {
    const updated = this._guestItems().filter(i => i.resourceId !== resourceId);
    this._guestItems.set(updated);
    this.saveGuestCart(updated);
  }

  clearGuestCart(): void {
    this._guestItems.set([]);
    localStorage.removeItem(GUEST_CART_KEY);
  }

  /** Merge guest cart into backend cart after login/signup. Clears guest cart on success. */
  mergeGuestCart(): Observable<void> {
    const items = this._guestItems();
    if (!items.length) return of(undefined as void);
    const adds = items.map(item =>
      this.addItem(item.resourceId).pipe(catchError(() => of(null)))
    );
    return forkJoin(adds).pipe(
      tap(() => this.clearGuestCart()),
      map(() => undefined as void),
    );
  }

  private empty(): CartData {
    return { items: [], couponCode: null, couponDiscount: 0, subtotal: 0, total: 0, itemCount: 0 };
  }

  private loadGuestCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch { return []; }
  }

  private saveGuestCart(items: CartItem[]): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  }
}
