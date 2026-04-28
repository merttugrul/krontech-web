import type { Metadata } from 'next';
import { UserEditPage } from '@/components/admin/users/UserEditPage';

export const metadata: Metadata = { title: 'Kullanıcı Düzenle' };

export default function AdminUserEditPage({ params }: { params: { id: string } }) {
  return <UserEditPage id={params.id} />;
}
