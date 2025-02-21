import React from "react";
import { Form, Button } from "react-bootstrap";

interface TransactionFormProps {
    formData: { date: string; transaction: string; user: string; amount: string; involved: string[] };
    names: string[];
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectAllChange: (selected: boolean) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
    formData,
    names,
    onInputChange,
    onCheckboxChange,
    onSelectAllChange,
    onSubmit,
    onCancel,
}) => {
    const individualAmount =
        formData.amount && !isNaN(parseFloat(formData.amount))
            ? (parseFloat(formData.amount) / (formData.involved.length + 1)).toFixed(2)
            : "0.00";

    const friendNames = names.filter((name) => name !== formData.user);
    const allSelected = friendNames.every((name) => formData.involved.includes(name));

    // Wrap your onSubmit prop so it doesn't conflict with form validation
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity()) {
            // If the form is valid, call your provided onSubmit
            onSubmit();
        }
        // If the form is invalid, the browser will display validation messages.
    };

    return (
        <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
                <Form.Label>Your Name</Form.Label>
                <Form.Control
                    type="text"
                    name="user"
                    value={formData.user}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                    disabled
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Transaction Name</Form.Label>
                <Form.Control
                    type="text"
                    name="transaction"
                    value={formData.transaction}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Amount ($)</Form.Label>
                <Form.Control
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Individual Amount ($)</Form.Label>
                <Form.Control
                    type="text"
                    name="individualAmount"
                    value={individualAmount}
                    disabled
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Select Friends Involved</Form.Label>
                <Form.Check
                    type="checkbox"
                    label="Select All"
                    checked={allSelected}
                    onChange={(e) => onSelectAllChange(e.target.checked)}
                    className="mb-2"
                />
                {friendNames.map((name, index) => (
                    <Form.Check
                        key={index}
                        type="checkbox"
                        label={name}
                        value={name}
                        checked={formData.involved.includes(name)}
                        onChange={onCheckboxChange}
                    />
                ))}
            </Form.Group>

            <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="success" type="submit">
                    Add Transaction
                </Button>
            </div>
        </Form>
    );
};

export default TransactionForm;
