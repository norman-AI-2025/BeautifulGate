import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Control Tower | Beautiful Gate Operations',
  description: 'Operations and dispatch management platform for Beautiful Gate Foundation',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
