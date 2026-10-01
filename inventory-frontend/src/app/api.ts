import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  reorderLevel: number;
  supplier: Supplier;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

export interface InventoryItem {
  id: number;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  lastUpdated: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  status: OrderStatus;
  orderDate: string;
}

@Injectable({ providedIn: 'root' })
export class NoticeService {
  readonly current = signal<{ message: string; error: boolean } | null>(null);
  private timeout?: ReturnType<typeof setTimeout>;

  show(message: string, error = false): void {
    clearTimeout(this.timeout);
    this.current.set({ message, error });
    this.timeout = setTimeout(() => this.current.set(null), 5000);
  }

  clear(): void {
    clearTimeout(this.timeout);
    this.current.set(null);
  }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly http = inject(HttpClient);
  private readonly notice = inject(NoticeService);

  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    return this.handle(this.http.get<T>(this.baseUrl + path, { params: params as never }));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.handle(this.http.post<T>(this.baseUrl + path, body));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.handle(this.http.put<T>(this.baseUrl + path, body));
  }

  delete(path: string): Observable<void> {
    return this.handle(this.http.delete<void>(this.baseUrl + path));
  }

  private handle<T>(request: Observable<T>): Observable<T> {
    return request.pipe(catchError((error: unknown) => {
      this.notice.show(this.errorMessage(error), true);
      return throwError(() => error);
    }));
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach the backend at localhost:8080. Start Spring Boot and try again.';
      }
      const message = error.error?.message;
      return typeof message === 'string' && message.length > 0
        ? message
        : `The request failed (${error.status}). Please try again.`;
    }
    return 'Something went wrong. Please try again.';
  }
}
