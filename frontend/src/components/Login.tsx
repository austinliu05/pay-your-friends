// src/components/Login.tsx
import React, { useState } from "react";
import { auth, provider, signInWithPopup } from "../firebaseConfig";
import { Container, Card, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const [localError, setLocalError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
            // The UserProvider's onAuthStateChanged will update your context.
            navigate("/dashboard");
        } catch (error) {
            console.error("Sign-in error:", error);
            setLocalError("Sign-in failed.");
        }
    };

    return (
        <Container className="d-flex flex-column align-items-center justify-content-center vh-100 w-80">
            <Card className="p-4 shadow-lg text-center" style={{ maxWidth: "400px" }}>
                <h2 className="mb-4">Google Sign-In</h2>
                {localError && <Alert variant="danger">{localError}</Alert>}
                <Button variant="primary" onClick={handleSignIn}>
                    <i className="bi bi-google"></i> Sign in with Google
                </Button>
            </Card>
        </Container>
    );
};

export default Login;
