import type { Metadata } from 'next';
import { QrKiosk } from '@/components/access/qr-kiosk';

export const metadata: Metadata = {
  title: 'Control de Acceso — Kiosco',
};

export default function KioskAccessPage() {
  return <QrKiosk />;
}
