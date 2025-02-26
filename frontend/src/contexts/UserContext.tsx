import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db, signOut } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";

interface User {
    name: string;
    email: string;
    photo: string;
    group: string;
}

interface UserContextType {
    user: User;
    setUser: (user: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUserState] = useState<User>({
        name: "",
        email: "",
        photo: "",
        group: "",
    });

    // Helper: Retrieve the user's group from Firestore based on email.
    const getUserGroupFromFirestore = async (email: string): Promise<string | null> => {
        try {
            const usersCollectionRef = collection(db, "users");
            const q = query(usersCollectionRef, where(documentId(), "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                return docData.group || null;
            }
            return null;
        } catch (error) {
            console.error("Firestore error:", error);
            return null;
        }
    };

    const setUser = (userUpdates: Partial<User>) => {
        setUserState((prev) => ({ ...prev, ...userUpdates }));
    };

    // Listen for auth state changes and update the user context accordingly.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const email = firebaseUser.email || "";
                const group = await getUserGroupFromFirestore(email);
                if (group) {
                    setUserState({
                        name: firebaseUser.displayName || "",
                        email,
                        photo: firebaseUser.photoURL || "",
                        group,
                    });
                } else {
                    // If no group is found, sign out.
                    await signOut(auth);
                }
            } else {
                // Clear user data on sign out.
                setUserState({
                    name: "",
                    email: "",
                    photo: "",
                    group: "",
                });
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
