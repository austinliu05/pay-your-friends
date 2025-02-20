import React from "react";
import { Form, Button } from "react-bootstrap";

interface TransactionFormProps {
    formData: { date: string; transaction: string; user: string; amount: string; involved: string[] };
    names: string[];
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
    formData,
    names,
    onInputChange,
    onCheckboxChange,
    onSubmit,
    onCancel,
}) => {
    return (
        <Form>
            <Form.Group className="mb-3">
                <Form.Label>Your Name</Form.Label>
                {/* Autofilled and disabled */}
                <Form.Control
                    type="text"
                    name="user"
                    value={formData.user}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                    disabled
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                {/* Preset with today's date */}
                <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Transaction Name</Form.Label>
                <Form.Control
                    type="text"
                    name="transaction"
                    value={formData.transaction}
                    onChange={onInputChange as React.ChangeEventHandler<any>}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Amount ($)</Form.Label>
                <Form.Control type="number" name="amount" value={formData.amount} onChange={onInputChange as React.ChangeEventHandler<any>} />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Select Friends Involved</Form.Label>
                {names
                    .filter((name) => name.split(" ")[0] !== formData.user)
                    .map((name, index) => (
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
                <Button variant="success" onClick={onSubmit}>
                    Add Transaction
                </Button>
            </div>
        </Form>
    );
};

export default TransactionForm;
