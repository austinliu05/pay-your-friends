// src/components/Login.tsx
import React, { useState } from "react";
import {
    auth,
    provider,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    signInWithEmailAndPassword
} from "../firebaseConfig";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
    });
    const navigate = useNavigate();

    // Common Google authentication handler (used for both sign in and sign up)
    const handleGoogleAuth = async () => {
        setLocalError(null);
        setIsLoading(true);
        try {
            await signInWithPopup(auth, provider);
            navigate("/dashboard");
        } catch (error) {
            console.error("Google auth error:", error);
            setLocalError("Google authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Email sign in handler
    const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            navigate("/dashboard");
        } catch (error) {
            console.error("Email sign-in error:", error);
            setLocalError("Email sign-in failed. Please check your credentials and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Email sign up handler
    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);
        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: formData.name });
            }
            // Optionally, save the phone number to your database here.
            navigate("/dashboard");
        } catch (error) {
            console.error("Sign-up error:", error);
            setLocalError("Sign-up failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Update form data on input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
            <Card className="p-4 shadow-lg text-center" style={{ maxWidth: "400px" }}>
                <h2 className="mb-4">{isSignUp ? "Sign Up" : "Sign In"}</h2>
                {/* {localError ? (
                    <Alert variant="danger">{localError}</Alert>
                ) : (
                    <div style={{ minHeight: "48px" }}></div>
                )} */}
                {isSignUp ? (
                    <>
                        <Form onSubmit={handleSignUp}>
                            <Form.Group className="mb-3" controlId="formName">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter your name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formPhone">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formEmail">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter your password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                        <span className="ms-2">Signing up...</span>
                                    </>
                                ) : (
                                    "Sign Up"
                                )}
                            </Button>
                        </Form>
                        <hr className="my-3" />
                        <Button
                            variant="outline-danger"
                            onClick={handleGoogleAuth}
                            disabled={isLoading}
                            className="w-100"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                    <span className="ms-2">Processing...</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-google"></i> Sign up with Google
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <Form onSubmit={handleEmailSignIn}>
                            <Form.Group className="mb-3" controlId="formEmail">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter your password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                        <span className="ms-2">Signing in...</span>
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </Form>
                        <hr className="my-3" />
                        <Button
                            variant="outline-danger"
                            onClick={handleGoogleAuth}
                            disabled={isLoading}
                            className="w-100"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                    <span className="ms-2">Processing...</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-google"></i> Sign in with Google
                                </>
                            )}
                        </Button>
                    </>
                )}
                <div className="mt-3">
                    <Button
                        variant="link"
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp
                            ? "Already have an account? Sign In"
                            : "Don't have an account? Sign Up"}
                    </Button>
                </div>
            </Card>
        </Container>
    );
};

export default Login;
