import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { MembershipTypesClient } from '@/components/membership-types/membership-types-client';

export const metadata: Metadata = { title: 'Tipos de Membresía — GymApp' };

interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_frequency: string;
  duration_days: number;
  max_freezes: number;
  max_freeze_days: number;
  features: string[];
  is_active: boolean;
  is_trial: boolean;
  sort_order: number;
  activeCount: number;
  created_at: string;
}

export default async function MembershipTypesPage() {
  const types = await serverFetch<MembershipType[]>('/api/v1/membership-types');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tipos de Membresía</h1>
          <p className="text-sm text-muted-foreground">Catálogo de planes que ofrece tu gimnasio</p>
        </div>
      </div>

      <MembershipTypesClient initialTypes={types ?? []} />
    </div>
  );
}
