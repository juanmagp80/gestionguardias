// src/app/page.js
"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient  ';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user || error) {
        router.push('/login'); // Redirige a la página de login
      }
    };

    checkUser();
  }, [router]);

  return (
    <div>
      <h1>Cargando...</h1>
    </div>
  );
}
