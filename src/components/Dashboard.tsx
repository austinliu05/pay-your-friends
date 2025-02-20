import React, { useState, useEffect } from "react";
import { Container, Card, Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
    auth,
    db,
    doc,
    collection,
    addDoc,
    getDocs,
} from "../firebaseConfig";
import TransactionTable from "../components/TransactionTable";
import TransactionForm from "../components/TransactionForm";

interface Transaction {
    id: string;
    date: string;
    transaction: string;
    user: string;
    amount: string;
    individualAmount: string;
    involved: string[];
    paid: string[];
    pending: string[];
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [formData, setFormData] = useState({
        date: "",
        transaction: "",
        user: "",
        amount: "",
        involved: [] as string[],
    });
    const [names, setNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Users from: groups -> "no groupcest" -> users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "groups", "no groupcest", "users");
                const querySnapshot = await getDocs(usersRef);
                const extractedNames = querySnapshot.docs.map((docSnap) => docSnap.id);
                setNames(extractedNames);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // 2. Fetch Transactions from: groups -> "no groupcest" -> transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const transactionsRef = collection(db, "groups", "no groupcest", "transactions");
                const querySnapshot = await getDocs(transactionsRef);
                const fetchedTransactions: Transaction[] = querySnapshot.docs.map((docSnap) => {
                    const data = docSnap.data() as {
                        date: string;
                        transaction: string;
                        user: string;
                        amount: string;
                        involved: string[];
                        individualAmount?: string;
                        paid?: string[];
                        pending?: string[];
                    };
                    const involvedCount = data.involved.length;
                    const individualAmount = data.individualAmount
                        ? data.individualAmount
                        : involvedCount > 0
                            ? (parseFloat(data.amount) / involvedCount).toFixed(2)
                            : "0.00";

                    return {
                        id: docSnap.id,
                        date: data.date,
                        transaction: data.transaction,
                        user: data.user,
                        amount: data.amount,
                        individualAmount,
                        involved: data.involved,
                        paid: data.paid || [],
                        pending: data.pending || [],
                    };
                });

                setTransactions(fetchedTransactions);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            }
        };

        fetchTransactions();
    }, []);

    // 3. Listen for Auth State to fill in the user field
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const fullName = user.displayName || "";
                setFormData((prev) => ({ ...prev, user: fullName }));
            }
        });
        return () => unsubscribe();
    }, []);

    // 4. Set today's date
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, date: today }));
    }, []);

    // 5. Handle Sign Out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Sign-out error:", error);
        }
    };

    // 6. Handle Input Changes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSelectAllChange = (selected: boolean) => {
        const friendNames = names.filter((name) => name !== formData.user);
        setFormData((prev) => ({
            ...prev,
            involved: selected ? friendNames : [],
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            involved: checked
                ? [...prev.involved, value]
                : prev.involved.filter((name) => name !== value),
        }));
    };

    // 7. Add a New Transaction
    const handleSubmit = async () => {
        try {
            const frontedBy = formData.user;
            const paid = [frontedBy];
            const pending = formData.involved.filter((name) => name !== frontedBy);
            const involvedCount = [...paid, ...pending].length;
            const individualAmount =
                involvedCount > 0
                    ? (parseFloat(formData.amount) / involvedCount).toFixed(2)
                    : "0.00";

            const newTransaction = {
                date: formData.date,
                amount: formData.amount,
                individualAmount,
                transaction: formData.transaction,
                user: frontedBy,
                involved: [...paid, ...pending],
                paid,
                pending,
            };

            const docRef = await addDoc(
                collection(db, "groups", "no groupcest", "transactions"),
                newTransaction
            );

            console.log("Transaction added with ID:", docRef.id);
            setTransactions((prev) => [
                ...prev,
                { ...newTransaction, id: docRef.id },
            ]);

            setShowModal(false);
            setFormData((prev) => ({
                ...prev,
                transaction: "",
                amount: "",
                involved: [],
            }));
        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    };

    return (
        <>
            {/* Main Dashboard Container */}
            <Container
                className="d-flex flex-column align-items-center justify-content-start mt-4"
                style={{ width: "100vw", maxWidth: "100%" }}
            >
                <h1 className="mb-4">Dashboard</h1>
                <Card className="p-4 shadow-lg text-center w-100">
                    <p>Welcome to the Payment Tracker!</p>
                    <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
                        Add Transaction
                    </Button>
                    <Button variant="danger" onClick={handleSignOut} className="mb-3">
                        Sign Out
                    </Button>
                </Card>

                {/* Transaction Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add New Transaction</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loading ? (
                            <Spinner animation="border" />
                        ) : (
                            <TransactionForm
                                formData={formData}
                                names={names}
                                onInputChange={handleInputChange}
                                onCheckboxChange={handleCheckboxChange}
                                onSelectAllChange={handleSelectAllChange}
                                onSubmit={handleSubmit}
                                onCancel={() => setShowModal(false)}
                            />
                        )}
                    </Modal.Body>
                </Modal>
            </Container>

            {/* Separate Container for Transaction Table */}
            <Container className="mt-4" style={{ width: "100vw", maxWidth: "100%" }}>
                <TransactionTable transactions={transactions} names={names} />
            </Container>
        </>
    );
};

export default Dashboard;
