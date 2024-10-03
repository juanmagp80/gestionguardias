// app/actions/signUpUser.js
import { supabase } from '../lib/supabaseClient';

// Función para registrar un usuario
export async function signUpUser(email, password, userType) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Error al registrar el usuario:', error);
        return;
    }

    const userId = data.user.id;

    // Insertar el nuevo usuario en la tabla `users`
    const { error: insertError } = await supabase
        .from('users')
        .insert([{ id: userId, email, user_type: userType }]);

    if (insertError) {
        console.error('Error al insertar en users:', insertError);
    }
}
