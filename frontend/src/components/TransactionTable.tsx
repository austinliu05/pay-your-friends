import React, { useState, useEffect } from "react";
import { Table, OverlayTrigger, Tooltip, Button } from "react-bootstrap";
import { auth, db, doc, updateDoc, deleteDoc } from "../firebaseConfig";
import { useUser } from "../contexts/UserContext";

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
    const currentUser = auth.currentUser?.displayName || "";
    const { user } = useUser(); // Retrieve user context (including group)
    const group = user.group; // Use the group from context

    // Local copy of transactions for immediate UI updates.
    const [localTransactions, setLocalTransactions] = useState(transactions);
    // State to control sort direction: "desc" for newest-to-oldest, "asc" for oldest-to-newest.
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Sort transactions when the transactions prop or sortDirection state changes.
    useEffect(() => {
        const sortedTransactions = [...transactions].sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
        });
        setLocalTransactions(sortedTransactions);
    }, [transactions, sortDirection]);

    // Toggle payment status when clicking on a user's name in a given transaction.
    const handleTogglePayment = async (transactionId: string, name: string, isPaid: boolean) => {
        try {
            const transactionRef = doc(db, "groups", group, "transactions", transactionId);
            const transaction = localTransactions.find(t => t.id === transactionId);
            if (!transaction) return;

            // Only allow toggling if the name is in the involved list.
            if (!transaction.involved.includes(name)) return;

            // Toggle status.
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

            // Update local state.
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
            const transactionRef = doc(db, "groups", group, "transactions", transactionId);
            await deleteDoc(transactionRef);
            console.log(`Transaction ${transactionId} deleted successfully.`);
            setLocalTransactions(prev => prev.filter(t => t.id !== transactionId));
            window.location.reload();
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };

    // Toggle sort direction between ascending and descending.
    const toggleSortDirection = () => {
        setSortDirection(prev => (prev === "desc" ? "asc" : "desc"));
    };

    return (
        <div>
            {/* Toggle Button */}
            <div style={{ marginBottom: "1rem" }}>
                <Button onClick={toggleSortDirection}>
                    Sort by Date: {sortDirection === "desc" ? "Newest to Oldest" : "Oldest to Newest"}
                </Button>
            </div>
            {/* Responsive Table */}
            <div className="table-responsive">
                <Table
                    striped
                    bordered
                    hover
                    responsive
                    style={{
                        width: "100%",
                        minWidth: "1000px", // Minimum width for the table.
                        fontSize: "clamp(0.5rem, 0.8rem, 1rem)" // Responsive font size.
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ width: "10%", minWidth: "110px" }}>Date</th>
                            <th style={{ width: "20%" }}>Transaction</th>
                            <th style={{ width: "10%", minWidth: "100px" }}>Total ($)</th>
                            <th style={{ width: "10%", minWidth: "80px" }}>Individual ($)</th>
                            <th style={{ width: "6%", minWidth: "50px" }}>Fronted</th>
                            {names.map((name, index) => (
                                <th
                                    key={index}
                                    style={{
                                        width: "80px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        cursor: "pointer",
                                    }}
                                >
                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={<Tooltip id={`tooltip-header-${index}`}>{name}</Tooltip>}
                                        trigger={['hover', 'focus', 'click']}
                                    >
                                        <span>{name.split(" ")[0]}</span>
                                    </OverlayTrigger>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {localTransactions.map((row) => {
                            // Determine if everyone involved is marked as paid.
                            const allPaid = row.involved.every(name => row.paid.includes(name));

                            return (
                                <tr key={row.id}>
                                    <td>{row.date}</td>
                                    <td>
                                        {row.transaction}
                                        {row.user === currentUser && (
                                            <span
                                                style={{
                                                    color: allPaid ? "gray" : "red",
                                                    marginLeft: "8px",
                                                    cursor: allPaid ? "not-allowed" : "pointer",
                                                    fontWeight: "bold",
                                                }}
                                                title={allPaid ? "Cannot delete transaction because everyone is paid" : "Delete Transaction"}
                                                onClick={allPaid ? undefined : () => handleDelete(row.id)}
                                            >
                                                ×
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ minWidth: "80px", whiteSpace: "nowrap" }}>${row.amount}</td>
                                    <td style={{ minWidth: "80px", whiteSpace: "nowrap" }}>${row.individualAmount}</td>
                                    <td>{row.user}</td>
                                    {names.map((name, idx) => {
                                        const isFrontedPerson = row.user === name;
                                        const isPaid = isFrontedPerson || row.paid.includes(name);
                                        const isPending = row.pending.includes(name);

                                        return (
                                            <td
                                                key={idx}
                                                style={{
                                                    cursor:
                                                        row.user === currentUser && row.involved.includes(name) && !isFrontedPerson
                                                            ? "pointer"
                                                            : "default",
                                                    backgroundColor: isPaid
                                                        ? "#d4edda"
                                                        : isPending
                                                            ? "#fff3cd"
                                                            : "inherit",
                                                    whiteSpace: "nowrap",
                                                }}
                                                onClick={() => {
                                                    if (
                                                        row.user === currentUser &&
                                                        row.involved.includes(name) &&
                                                        !isFrontedPerson
                                                    ) {
                                                        handleTogglePayment(row.id, name, row.paid.includes(name));
                                                    }
                                                }}
                                            >
                                                <OverlayTrigger
                                                    placement="top"
                                                    delay={{ show: 250, hide: 400 }}
                                                    overlay={<Tooltip id={`tooltip-cell-${row.id}-${idx}`}>{name}</Tooltip>}
                                                    trigger={['hover', 'focus', 'click']}
                                                >
                                                    <div>
                                                        {isPaid ? "✔️" : isPending ? "⚠️" : ""}
                                                    </div>
                                                </OverlayTrigger>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default TransactionTable;
