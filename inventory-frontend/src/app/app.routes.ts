import { Routes } from '@angular/router';
import { Products } from './products';
import { InventoryPage } from './inventory';
import { Orders } from './orders';
import { Dashboard } from './dashboard';
import { Suppliers } from './suppliers';
import { StockOperations } from './stock-operations';
import { Warehouses } from './warehouses';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard },
  { path: 'products', component: Products },
  { path: 'inventory', component: InventoryPage },
  { path: 'stock-operations', component: StockOperations },
  { path: 'suppliers', component: Suppliers },
  { path: 'warehouses', component: Warehouses },
  { path: 'orders', component: Orders },
  { path: '**', redirectTo: 'dashboard' },
];
