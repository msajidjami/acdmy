'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SubscriptionInfo {
  _id: string;
  planId: string;
  planName: string;
  studentLimit: number;
  billingCycle: 'monthly' | 'yearly';
  amountUSD: number;
  amountPKR: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface AcademyInfo {
  _id: string;
  name: string;
  isPublic: boolean;
  studentLimit: number;
  currentStudentCount: number;
  planId: string;
}

export interface SubscriptionResponse {
  subscription: SubscriptionInfo | null;
  academy: AcademyInfo | null;
  isExpired: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [academy, setAcademy] = useState<AcademyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/subscription/status', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SubscriptionResponse = await res.json();
      setSubscription(data.subscription);
      setAcademy(data.academy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const now = new Date();
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysRemaining = endDate
    ? Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return {
    subscription,
    academy,
    loading,
    error,
    refetch: fetchSubscription,
    isActive: subscription?.status === 'active' || subscription?.status === 'trial',
    isExpired: subscription
      ? new Date(subscription.endDate) < now
      : true,
    studentLimit: subscription?.studentLimit ?? 0,
    currentStudents: academy?.currentStudentCount ?? 0,
    planId: subscription?.planId ?? 'free',
    daysRemaining,
    canAddStudent:
      academy !== null &&
      academy.isPublic &&
      (subscription?.studentLimit === -1 ||
        (subscription?.studentLimit ?? 0) > academy.currentStudentCount),
  };
}