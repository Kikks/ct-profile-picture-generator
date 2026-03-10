'use client';

import { useRouter } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} title="Log out">
      <LogOutIcon className="h-4 w-4" />
    </Button>
  );
}
