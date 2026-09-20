'use client';

import React from 'react';
import { Order } from '@/lib/types';
import { Package, Calendar, Tag, ArrowRight } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  selectedOrderNumber?: string;
  onSelectOrder: (order: Order) => void;
  isLoading?: boolean;
}

export function OrderList({
  orders,
  selectedOrderNumber,
  onSelectOrder,
  isLoading,
}: OrderListProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-16 bg-slate-100 rounded-lg"></div>
        <div className="h-16 bg-slate-100 rounded-lg"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">No orders found for this customer account.</p>
        <p className="text-xs text-slate-400 mt-1">Select another customer from the demo selector.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-indigo-600" />
          Customer Order History ({orders.length})
        </h3>
        <span className="text-xs text-slate-500">Click an order to cite in your refund claim</span>
      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {orders.map((order) => {
          const isSelected = order.orderNumber === selectedOrderNumber;
          const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'Not Delivered';

          let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
          if (order.status === 'DELIVERED') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          if (order.status === 'SHIPPED') statusColor = 'bg-sky-50 text-sky-700 border-sky-200';
          if (order.status === 'CANCELLED') statusColor = 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {order.status}
                  </span>
                  {order.isFinalSale && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <Tag className="w-3 h-3 text-amber-600" />
                      Final Sale
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delivered: {deliveryDate}</span>
                </div>

                <div className="flex items-center gap-1 text-indigo-600 font-medium">
                  <span>Select</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap gap-1">
                  {order.items.map((item, idx) => (
                    <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      {item.quantity}x {item.name} (${Number(item.unitPrice).toFixed(2)})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
