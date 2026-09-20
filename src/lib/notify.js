import { supabase } from '@/api/supabaseClient';

// Kirim notifikasi sistem ke user terkait (gagal-sunyi: tidak boleh mengganggu aksi utama).
export async function notifyUsers({ title, message = '', type = 'system', targetEmail = '', link = '' }) {
  try {
    // Cari user_id berdasarkan email
    let userId = null;
    if (targetEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();
      userId = profile?.id;
    }

    if (!userId) return;

    await supabase.from('app_notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      action_url: link || null,
      is_read: false,
    });
  } catch {
    /* noop */
  }
}