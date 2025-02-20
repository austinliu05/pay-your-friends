import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db, collection, getDocs } from "../firebaseConfig";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Transaction {
    id: string;
    date: string;
    transaction: string;
    user: string;
    involved: string[];
    paid: string[];
    pending: string[];
    amount: string;
    individualAmount: string;
}

interface UserAnalytics {
    user: string;
    totalFronted: number;
    count: number;
}

const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
    const [incompleteMap, setIncompleteMap] = useState<{ [key: string]: number }>({});
    const [totalIncomplete, setTotalIncomplete] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const transactionsRef = collection(db, "groups", "no groupcest", "transactions");
                const querySnapshot = await getDocs(transactionsRef);
                const transactions: Transaction[] = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    transactions.push({
                        id: docSnap.id,
                        date: data.date,
                        transaction: data.transaction,
                        user: data.user,
                        involved: data.involved,
                        paid: data.paid,
                        pending: data.pending,
                        amount: data.amount,
                        individualAmount: data.individualAmount,
                    });
                });

                // Aggregate analytics for fronted transactions.
                const analyticsMap: { [key: string]: UserAnalytics } = {};
                transactions.forEach((t) => {
                    const amount = parseFloat(t.amount) || 0;
                    if (analyticsMap[t.user]) {
                        analyticsMap[t.user].totalFronted += amount;
                        analyticsMap[t.user].count += 1;
                    } else {
                        analyticsMap[t.user] = { user: t.user, totalFronted: amount, count: 1 };
                    }
                });

                // Aggregate incomplete payments per user.
                const incMap: { [key: string]: number } = {};
                transactions.forEach((t) => {
                    // For each user involved in a transaction, if they haven't paid, count it as incomplete.
                    t.involved.forEach((name) => {
                        if (!t.paid.includes(name)) {
                            incMap[name] = (incMap[name] || 0) + 1;
                        }
                    });
                });

                // Calculate total incomplete payments.
                const totalInc = Object.values(incMap).reduce((sum, val) => sum + val, 0);

                setAnalytics(Object.values(analyticsMap));
                setIncompleteMap(incMap);
                setTotalIncomplete(totalInc);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Prepare data for the pie charts.
    const frontedLabels = analytics.map((data) => data.user);
    const timesData = analytics.map((data) => data.count);
    const amountData = analytics.map((data) => data.totalFronted);

    const incompleteLabels = Object.keys(incompleteMap);
    const incompleteData = Object.values(incompleteMap);

    // Determine the worst friend (user with the most incomplete payments).
    const worstEntry = Object.entries(incompleteMap).reduce(
        (maxEntry, currentEntry) => (currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry),
        ["", 0]
    );
    const worstFriend = worstEntry[0];
    const worstCount = worstEntry[1];

    // Define a palette of colors.
    const backgroundColors = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#8e44ad",
        "#e74c3c",
    ];

    const timesPieData = {
        labels: frontedLabels,
        datasets: [
            {
                label: "Times Fronted",
                data: timesData,
                backgroundColor: frontedLabels.map((_, i) => backgroundColors[i % backgroundColors.length]),
                borderColor: frontedLabels.map(() => "#fff"),
                borderWidth: 1,
            },
        ],
    };

    const amountPieData = {
        labels: frontedLabels,
        datasets: [
            {
                label: "Total Amount Fronted ($)",
                data: amountData,
                backgroundColor: frontedLabels.map((_, i) => backgroundColors[i % backgroundColors.length]),
                borderColor: frontedLabels.map(() => "#fff"),
                borderWidth: 1,
            },
        ],
    };

    const incompletePieData = {
        labels: incompleteLabels,
        datasets: [
            {
                label: "Incomplete Payments",
                data: incompleteData,
                backgroundColor: incompleteLabels.map((_, i) => backgroundColors[i % backgroundColors.length]),
                borderColor: incompleteLabels.map(() => "#fff"),
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container className="py-4">
            {/* Back Button */}
            <Button variant="secondary" onClick={() => navigate("/dashboard")} className="mb-4">
                Back to Dashboard
            </Button>
            <h2 className="text-center mb-4">Analytics</h2>
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <>
                    {/* Total Incomplete Payments Section */}
                    <Row className="mb-4">
                        <Col xs={12}>
                            <Card className="shadow-sm bg-warning text-dark text-center p-3">
                                <h4>Total Incomplete Payments</h4>
                                <h2 className="fw-bold">{totalIncomplete}</h2>
                            </Card>
                        </Col>
                    </Row>

                    {/* Worst Friend Section */}
                    <Row className="mb-4">
                        <Col xs={12}>
                            <Card className="shadow-sm bg-danger text-white text-center p-3">
                                <h4>Worst Friend</h4>
                                <h2 className="fw-bold">
                                    {worstFriend} ({worstCount})
                                </h2>
                            </Card>
                        </Col>
                    </Row>

                    {/* Pie Charts Section */}
                    <Row className="g-4">
                        <Col xs={12} md={6}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <Card.Title className="mb-4 text-center">Times Fronted</Card.Title>
                                    <Pie data={timesPieData} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body>
                                    <Card.Title className="mb-4 text-center">Total Amount Fronted ($)</Card.Title>
                                    <Pie data={amountPieData} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Incomplete Payments Pie Chart */}
                    <Row className="g-4 mt-4">
                        <Col xs={12} md={6}>
                            <Card className="h-100 shadow-sm">
                                <Card.Body className="text-center">
                                    <Card.Title className="mb-4">Incomplete Payments Breakdown</Card.Title>
                                    <Pie data={incompletePieData} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default Analytics;
