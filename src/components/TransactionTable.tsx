import React, { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import { auth, db, doc, updateDoc, deleteDoc } from "../firebaseConfig";

interface TransactionTableProps {
    transactions: {
        id: string;
        date: string;
        transaction: string;
        user: string;
        involved: string[];
        paid: string[];
        pending: string[];
        amount: string;
        individualAmount: string;
    }[];
    names: string[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, names }) => {
    const currentUser = auth.currentUser?.displayName?.split(" ")[0] || "";
    // Create a local copy of transactions for immediate UI updates.
    const [localTransactions, setLocalTransactions] = useState(transactions);

    // Whenever the prop "transactions" changes, update the local copy.
    useEffect(() => {
        setLocalTransactions(transactions);
    }, [transactions]);

    // Toggle payment status when clicking on a user's name in a given transaction.
    const handleTogglePayment = async (transactionId: string, name: string, isPaid: boolean) => {
        try {
            const transactionRef = doc(db, "groups", "no groupcest", "transactions", transactionId);
            const transaction = localTransactions.find(t => t.id === transactionId);
            if (!transaction) return;

            // Only allow toggling if the name is in the involved list.
            if (!transaction.involved.includes(name)) return;

            // Toggle status: if currently paid, remove from paid and add to pending; otherwise, add to paid and remove from pending.
            const updatedPaid = isPaid
                ? transaction.paid.filter(n => n !== name)
                : [...transaction.paid, name];
            const updatedPending = isPaid
                ? [...transaction.pending, name]
                : transaction.pending.filter(n => n !== name);

            // Update Firestore.
            await updateDoc(transactionRef, {
                paid: updatedPaid,
                pending: updatedPending,
            });

            console.log(`Updated payment status for ${name} in transaction ${transactionId}`);

            // Update local state for immediate UX feedback.
            setLocalTransactions(prev =>
                prev.map(t => {
                    if (t.id === transactionId) {
                        return {
                            ...t,
                            paid: updatedPaid,
                            pending: updatedPending,
                        };
                    }
                    return t;
                })
            );
        } catch (error) {
            console.error("Error updating payment status:", error);
        }
    };

    // Delete a transaction.
    const handleDelete = async (transactionId: string) => {
        try {
            const transactionRef = doc(db, "groups", "no groupcest", "transactions", transactionId);
            await deleteDoc(transactionRef);
            console.log(`Transaction ${transactionId} deleted successfully.`);
            setLocalTransactions(prev => prev.filter(t => t.id !== transactionId));
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };

    return (
        <Table striped bordered hover responsive style={{ tableLayout: "fixed", width: "100%" }}>
            <thead>
                <tr>
                    <th style={{ width: "12%" }}>Date</th>
                    <th style={{ width: "40%" }}>Transaction</th>
                    <th style={{ width: "10%" }}>Total ($)</th>
                    <th style={{ width: "10%" }}>Individual ($)</th>
                    <th style={{ width: "15%" }}>Fronted</th>
                    {names.map((name, index) => (
                        <th
                            key={index}
                            style={{
                                width: "10%",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                cursor: "pointer",
                            }}
                            title={name}
                        >
                            {name.split(" ")[0]}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {localTransactions.map((row) => (
                    <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>
                            {row.transaction}
                            {/* If the current user is the fronted person, display a delete (×) icon */}
                            {row.user === currentUser && (
                                <span
                                    style={{
                                        color: "red",
                                        marginLeft: "8px",
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                    }}
                                    title="Delete Transaction"
                                    onClick={() => handleDelete(row.id)}
                                >
                                    ×
                                </span>
                            )}
                        </td>
                        <td>${row.amount}</td>
                        <td>${row.individualAmount}</td>
                        <td>{row.user}</td>
                        {names.map((name, idx) => {
                            const isPaid = row.paid.includes(name);
                            const isPending = row.pending.includes(name);
                            const isFrontedPerson = row.user === name;
                            return (
                                <td
                                    key={idx}
                                    style={{
                                        cursor:
                                            row.user === currentUser && row.involved.includes(name) && !isFrontedPerson
                                                ? "pointer"
                                                : "default",
                                        backgroundColor: isPaid
                                            ? "#d4edda" // Light green for paid
                                            : isPending
                                            ? "#fff3cd" // Light yellow for pending
                                            : "inherit",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                    title={name}
                                    onClick={() => {
                                        // Allow toggling only if the logged-in user is the fronted person,
                                        // the name is in the involved list,
                                        // and the name is NOT the fronted person's name.
                                        if (row.user === currentUser && row.involved.includes(name) && !isFrontedPerson) {
                                            handleTogglePayment(row.id, name, isPaid);
                                        }
                                    }}
                                >
                                    {isPaid ? "✔️" : isPending ? "Pending" : ""}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default TransactionTable;
