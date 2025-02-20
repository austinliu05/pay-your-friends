import React, { useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut, db, doc, getDoc } from "../firebaseConfig";
import { Container, Card, Button, Image, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const [user, setUser] = useState<{ name: string; email: string; photo: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    // Function to check if user is in Firestore document
    const checkUserInFirestore = async (email: string) => {
        try {
            const docRef = doc(db, "groups", "no groupcest"); // Reference to the document
            const docSnap = await getDoc(docRef); // Fetch document data
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (Object.values(data).includes(email)) {
                    return true; // User email found
                }
            }
        } catch (error) {
            console.error("Firestore error:", error);
        }
        return false;
    };

    useEffect(() => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const email = user.email || "";
                const isUserInGroup = await checkUserInFirestore(email);
                
                if (isUserInGroup) {
                    setUser({ name: user.displayName || "", email, photo: user.photoURL || "" });
                    navigate("/dashboard");
                } else {
                    setErrorMessage("You are not authorized to access this group.");
                    await signOut(auth); // Sign out unauthorized users
                }
            }
        });
    }, [navigate]);

    const handleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const email = result.user.email || "";
            const isUserInGroup = await checkUserInFirestore(email);

            if (isUserInGroup) {
                setUser({ name: result.user.displayName || "", email, photo: result.user.photoURL || "" });
                navigate("/dashboard");
            } else {
                setErrorMessage("You are not authorized to access this group.");
                await signOut(auth); // Sign out unauthorized users
            }
        } catch (error) {
            console.error("Sign-in error:", error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Sign-out error:", error);
        }
    };

    return (
        <Container className="d-flex flex-column align-items-center justify-content-center vh-100 w-80">
            <Card className="p-4 shadow-lg text-center" style={{ maxWidth: "400px" }}>
                <h2 className="mb-4">Google Sign-In</h2>
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                {user ? (
                    <div>
                        <Image src={user.photo} alt={user.name} roundedCircle width={80} className="mb-3" />
                        <h5>{user.name}</h5>
                        <p className="text-muted">{user.email}</p>
                        <Button variant="danger" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                ) : (
                    <Button variant="primary" onClick={handleSignIn}>
                        <i className="bi bi-google"></i> Sign in with Google
                    </Button>
                )}
            </Card>
        </Container>
    );
};

export default Login;
