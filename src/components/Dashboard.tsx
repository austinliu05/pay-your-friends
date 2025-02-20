import React, { useState, useEffect } from "react";
import { Container, Card, Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db, doc, getDoc, collection, addDoc, getDocs } from "../firebaseConfig";
import TransactionTable from "../components/TransactionTable";
import TransactionForm from "../components/TransactionForm";
import { onAuthStateChanged } from "firebase/auth"; // Import this function

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [transactions, setTransactions] = useState<
        { id: string; date: string; transaction: string; user: string; amount: string; involved: string[] }[]
    >([]);
    const [formData, setFormData] = useState({
        date: "",
        transaction: "",
        user: "",
        amount: "",
        involved: [] as string[],
    });
    const [names, setNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Users for Dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const docRef = doc(db, "groups", "no groupcest");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const extractedNames = Object.keys(data);
                    setNames(extractedNames);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Fetch Transactions from Firestore
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const transactionsRef = collection(db, "groups", "no groupcest", "transactions");
                const querySnapshot = await getDocs(transactionsRef);
                
                const fetchedTransactions = querySnapshot.docs.map(doc => ({
                    id: doc.id, // Firestore Document ID
                    ...(doc.data() as { date: string; transaction: string; user: string; amount: string; involved: string[] })
                }));

                setTransactions(fetchedTransactions);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            }
        };

        fetchTransactions();
    }, []);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.displayName) {
                const firstName = user.displayName.split(" ")[0];
                setFormData(prev => ({ ...prev, user: firstName }));
            }
        });
    
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Sign-out error:", error);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            involved: checked
                ? [...prev.involved, value]
                : prev.involved.filter(name => name !== value),
        }));
    };

    const handleSubmit = async () => {
        try {
            const frontedBy = formData.user;
            const paid = [frontedBy]; // Fronted person automatically in paid
            const pending = formData.involved.filter(name => name !== frontedBy); // Others in pending

            const newTransaction = {
                date: formData.date,
                amount: formData.amount,
                transaction: formData.transaction,
                user: frontedBy,
                involved: [...paid, ...pending],
                paid,
                pending
            };

            // Save to Firestore inside `transactions` collection of `no groupcest`
            const docRef = await addDoc(collection(db, "groups", "no groupcest", "transactions"), newTransaction);
            console.log("Transaction added with ID: ", docRef.id);

            // Ensure local state also includes the `id`
            setTransactions(prev => [
                ...prev,
                {
                    ...newTransaction,
                    id: docRef.id, // Add Firestore-generated ID
                }
            ]);

            setShowModal(false);
            setFormData(prev => ({ ...prev, transaction: "", amount: "", involved: [] }));
        } catch (error) {
            console.error("Error adding transaction: ", error);
        }
    };

    return (
        <Container className="d-flex flex-column align-items-center justify-content-start vh-100 mt-4 w-100">
            <h1 className="mb-4">Dashboard</h1> {/* Shifted to the top */}

            <Card className="p-4 shadow-lg text-center w-100">
                <p>Welcome to No Groupcest!</p>
                <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
                    Add Transaction
                </Button>
                <Button variant="danger" onClick={handleSignOut} className="mb-3">
                    Sign Out
                </Button>

                {/* Transaction Table Component */}
                <TransactionTable transactions={transactions} names={names} />
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
                            onSubmit={handleSubmit}
                            onCancel={() => setShowModal(false)}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default Dashboard;
