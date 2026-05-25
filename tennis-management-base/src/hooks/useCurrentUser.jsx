import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useCurrentUser() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        // Initial load
        supabase.auth.getUser().then(({ data }) => {
            if (!cancelled) {
                setUser(data.user);
                setIsLoading(false);
            }
        });

        // Listen for login/logout while the component is mounted
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            cancelled = true;
            subscription.subscription?.unsubscribe();
        };
    }, []);

    return { user, userId: user?.id, isLoading };
}