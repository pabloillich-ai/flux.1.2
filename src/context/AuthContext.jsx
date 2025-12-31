import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get Session
        const getSession = async () => {
            try {

                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                const session = data?.session;


                setUser(session?.user ?? null);
                setLoading(false); // OPTIMIZATION: Release UI immediately

                if (session?.user) {
                    fetchProfile(session.user.id);
                }
            } catch (error) {
                console.error("AuthContext: Error getting session:", error);
                setLoading(false);
            }
        };

        getSession();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    const value = {
        user,
        profile,
        signIn,
        signOut,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <div className="min-h-screen flex items-center justify-center">Cargando aplicación...</div> : children}
        </AuthContext.Provider>
    );
};
