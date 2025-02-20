import React, { useState } from "react";
import { Table, Form } from "react-bootstrap";
import { auth, db, doc, updateDoc } from "../firebaseConfig";

interface TransactionTableProps {
    transactions: { date: string; transaction: string; user: string; involved: string[], amount: string; id: string }[];
    names: string[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, names }) => {
    const currentUser = auth.currentUser?.displayName?.split(" ")[0] || ""; // Get first name of logged-in user
    const [editableTransaction, setEditableTransaction] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<{ [key: string]: string }>({});

    // Enable editing mode for a row
    const handleEditClick = (id: string, transaction: any) => {
        setEditableTransaction(id);
        setEditedData({
            date: transaction.date,
            transaction: transaction.transaction,
            amount: transaction.amount,
        });
    };

    const handleChange = (e: React.ChangeEvent<any>, field: string) => {
        setEditedData(prev => ({
            ...prev,
            [field]: (e.target as HTMLInputElement).value, // Explicitly cast to HTMLInputElement
        }));
    };
    

    // Save updates to Firestore
    const handleSave = async (id: string) => {
        try {
            const transactionRef = doc(db, "groups", "no groupcest", "transactions", id);
            await updateDoc(transactionRef, {
                date: editedData.date,
                transaction: editedData.transaction,
                amount: editedData.amount,
            });

            setEditableTransaction(null);
            console.log("Transaction updated successfully!");
        } catch (error) {
            console.error("Error updating transaction:", error);
        }
    };

    return (
        <Table striped bordered hover responsive style={{ tableLayout: "fixed", width: "100%" }}>
            <thead>
                <tr>
                    <th style={{ width: "12%" }}>Date</th>
                    <th style={{ width: "40%" }}>Transaction</th>
                    <th style={{ width: "15%" }}>($)</th>
                    <th style={{ width: "15%" }}>Fronted</th>
                    {names.map((name, index) => (
                        <th key={index} style={{
                            width: "10%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }} title={name}>
                            {name.split(" ")[0]}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {transactions.map((row, index) => (
                    <tr key={index}>
                        {/* Editable Date */}
                        <td>
                            {editableTransaction === row.id ? (
                                <Form.Control
                                    type="date"
                                    value={editedData.date}
                                    onChange={(e) => handleChange(e, "date")}
                                />
                            ) : (
                                row.date
                            )}
                        </td>

                        {/* Editable Transaction Name */}
                        <td>
                            {editableTransaction === row.id ? (
                                <Form.Control
                                    type="text"
                                    value={editedData.transaction}
                                    onChange={(e) => handleChange(e, "transaction")}
                                />
                            ) : (
                                row.transaction
                            )}
                        </td>

                        {/* Editable Amount */}
                        <td>
                            {editableTransaction === row.id ? (
                                <Form.Control
                                    type="number"
                                    value={editedData.amount}
                                    onChange={(e) => handleChange(e, "amount")}
                                />
                            ) : (
                                `$${row.amount}`
                            )}
                        </td>

                        {/* Fronted By */}
                        <td>{row.user}</td>

                        {/* Involved Users */}
                        {names.map((name, idx) => (
                            <td key={idx}>{row.involved.includes(name) ? "✔️" : ""}</td>
                        ))}

                        {/* Edit & Save Buttons */}
                        <td>
                            {row.user === currentUser ? (
                                editableTransaction === row.id ? (
                                    <button onClick={() => handleSave(row.id)}>Save</button>
                                ) : (
                                    <button onClick={() => handleEditClick(row.id, row)}>Edit</button>
                                )
                            ) : null}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default TransactionTable;
