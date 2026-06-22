import { redirect } from 'next/navigation';

// La raíz redirige al dashboard o al login según la sesión
export default function HomePage() {
  redirect('/dashboard');
}
