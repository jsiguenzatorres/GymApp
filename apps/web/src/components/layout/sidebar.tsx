import { auth } from '@/auth';
import { SidebarClient } from './sidebar-client';

export async function Sidebar() {
  const session = await auth();
  return (
    <SidebarClient
      userName={session?.user?.name ?? session?.user?.email ?? '—'}
      userEmail={session?.user?.email ?? ''}
    />
  );
}
