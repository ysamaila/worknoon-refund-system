'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Order, RefundRecord } from '@/lib/types';
import { getCustomers, getCustomerOrders, submitRefund } from '@/lib/api';
import { CustomerPicker } from '@/components/customer/customer-picker';
import { OrderList } from '@/components/customer/order-list';
import { RefundForm } from '@/components/customer/refund-form';
import { DecisionCard } from '@/components/customer/decision-card';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export default function CustomerPortalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | undefined>();
  const [activeRefund, setActiveRefund] = useState<RefundRecord | null>(null);

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load customers on boot
  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoadingCustomers(true);
        const data = await getCustomers();
        setCustomers(data);
        if (data.length > 0) {
          setSelectedCustomerId(data[0].id);
        }
      } catch (err: any) {
        setApiError('Unable to connect to API server at http://localhost:4000. Ensure the backend is running.');
      } finally {
        setIsLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  // Fetch orders when selected customer changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    async function loadOrders() {
      try {
        setIsLoadingOrders(true);
        const data = await getCustomerOrders(selectedCustomerId);
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrderNumber(data[0].orderNumber);
        } else {
          setSelectedOrderNumber(undefined);
        }
        setActiveRefund(null);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    }
    loadOrders();
  }, [selectedCustomerId]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderNumber(order.orderNumber);
  };

  const handleSubmitRefund = async (payload: { rawMessage: string; orderNumber?: string; isPartialClaim?: boolean }) => {
    setIsSubmitting(true);
    try {
      const result = await submitRefund({
        customerId: selectedCustomerId,
        orderNumber: payload.orderNumber,
        rawMessage: payload.rawMessage,
        isPartialClaim: payload.isPartialClaim,
      });
      setActiveRefund(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Customer Self-Service Refund Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Submit returns in conversational natural language. Our system verifies order eligibility against deterministic policies, explains outcomes clearly, and safeguards financial integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>Select any seeded customer profile to test return rules.</span>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-sm font-medium shadow-2xs">
          {apiError}
        </div>
      )}

      {/* Customer Profile Picker */}
      <CustomerPicker
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelect={handleSelectCustomer}
        isLoading={isLoadingCustomers}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Purchase History */}
        <div className="lg:col-span-5 space-y-4">
          <OrderList
            orders={orders}
            selectedOrderNumber={selectedOrderNumber}
            onSelectOrder={handleSelectOrder}
            isLoading={isLoadingOrders}
          />
        </div>

        {/* Right Column: Refund Submission Form & Real-Time Decision Card */}
        <div className="lg:col-span-7 space-y-6">
          <RefundForm
            selectedOrderNumber={selectedOrderNumber}
            onSubmit={handleSubmitRefund}
            isSubmitting={isSubmitting}
          />

          {activeRefund && <DecisionCard refund={activeRefund} />}
        </div>
      </div>
    </div>
  );
}
