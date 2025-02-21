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

interface Spender {
    user: string;
    totalSpent: number;
}

const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
    const [incompleteMap, setIncompleteMap] = useState<{ [key: string]: number }>({});
    const [totalIncomplete, setTotalIncomplete] = useState<number>(0);
    const [bestFriend, setBestFriend] = useState<UserAnalytics | null>(null);
    const [worstFriend, setWorstFriend] = useState<UserAnalytics | null>(null);
    const [monthlySpending, setMonthlySpending] = useState<number>(0);
    const [biggestSpender, setBiggestSpender] = useState<Spender | null>(null);
    const [worstOwes, setWorstOwes] = useState<number>(0);
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

                // Aggregate incomplete payments per user (by count) for total incomplete payments.
                const incMap: { [key: string]: number } = {};
                transactions.forEach((t) => {
                    t.involved.forEach((name) => {
                        if (!t.paid.includes(name)) {
                            incMap[name] = (incMap[name] || 0) + 1;
                        }
                    });
                });

                // Calculate total incomplete payments.
                const totalInc = Object.values(incMap).reduce((sum, val) => sum + val, 0);

                // Determine the best friend as the user who fronted the most.
                const bestFriendData = Object.values(analyticsMap).reduce(
                    (max, curr) => (curr.totalFronted > max.totalFronted ? curr : max),
                    { user: "", totalFronted: 0, count: 0 } as UserAnalytics
                );

                // Calculate monthly spending for transactions within the last month.
                const now = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                const monthlyTotal = transactions.reduce((sum, t) => {
                    const tDate = new Date(t.date);
                    if (tDate >= oneMonthAgo && tDate <= now) {
                        return sum + (parseFloat(t.amount) || 0);
                    }
                    return sum;
                }, 0);

                // Compute biggest spender by summing up the individualAmount for every user who paid.
                const spenderMap: { [key: string]: number } = {};
                transactions.forEach((t) => {
                    const indAmount = parseFloat(t.individualAmount) || 0;
                    t.paid.forEach((user) => {
                        spenderMap[user] = (spenderMap[user] || 0) + indAmount;
                    });
                });
                const biggestSpenderEntry = Object.entries(spenderMap).reduce(
                    (maxEntry, currentEntry) =>
                        currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry,
                    ["", 0]
                );

                // New logic: Determine the worst friend as the user who owes the most.
                // Sum the individualAmount for each user that is still pending.
                const owesMap: { [key: string]: number } = {};
                transactions.forEach((t) => {
                    const indAmount = parseFloat(t.individualAmount) || 0;
                    t.pending.forEach((user) => {
                        owesMap[user] = (owesMap[user] || 0) + indAmount;
                    });
                });
                const worstOwesEntry = Object.entries(owesMap).reduce(
                    (maxEntry, currentEntry) =>
                        currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry,
                    ["", 0]
                );

                // Update state.
                setAnalytics(Object.values(analyticsMap));
                setIncompleteMap(incMap);
                setTotalIncomplete(totalInc);
                setBestFriend(bestFriendData);
                setWorstFriend({ user: worstOwesEntry[0], totalFronted: 0, count: 0 });
                setMonthlySpending(monthlyTotal);
                setBiggestSpender({ user: biggestSpenderEntry[0], totalSpent: biggestSpenderEntry[1] });
                setWorstOwes(worstOwesEntry[1]);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

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

    // Prepare data for the pie charts.
    const frontedLabels = analytics.map((data) => data.user);
    const timesData = analytics.map((data) => data.count);
    const amountData = analytics.map((data) => data.totalFronted);

    const incompleteLabels = Object.keys(incompleteMap);
    const incompleteData = Object.values(incompleteMap);

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
                    {/* First Metrics Row */}
                    <Row className="g-4 mb-4">
                        <Col xs={12} sm={6} md={3}>
                            <Card
                                className="shadow-sm bg-warning text-dark text-center d-flex flex-column justify-content-center"
                                style={{ height: "200px" }}
                            >
                                <h5>Total Incomplete Payments</h5>
                                <h3 className="fw-bold">{totalIncomplete}</h3>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={3}>
                            <Card
                                className="shadow-sm bg-danger text-white text-center d-flex flex-column justify-content-center"
                                style={{ height: "200px" }}
                            >
                                <h5>Worst Friend</h5>
                                <h3 className="fw-bold">
                                    {worstFriend?.user} (${worstOwes.toFixed(2)})
                                </h3>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={3}>
                            {bestFriend && bestFriend.user && (
                                <Card
                                    className="shadow-sm bg-success text-white text-center d-flex flex-column justify-content-center"
                                    style={{ height: "200px" }}
                                >
                                    <h5>Best Friend</h5>
                                    <h3 className="fw-bold">
                                        {bestFriend.user} (${bestFriend.totalFronted.toFixed(2)})
                                    </h3>
                                </Card>
                            )}
                        </Col>
                        <Col xs={12} sm={6} md={3}>
                            <Card
                                className="shadow-sm bg-info text-white text-center d-flex flex-column justify-content-center"
                                style={{ height: "200px" }}
                            >
                                <h5>Group Monthly Spending</h5>
                                <h3 className="fw-bold">${monthlySpending.toFixed(2)}</h3>
                                <small>Last Month</small>
                            </Card>
                        </Col>
                    </Row>

                    {/* Second Metrics Row */}
                    <Row className="g-4 mb-4">
                        <Col xs={12} sm={6}>
                            {biggestSpender && biggestSpender.user && (
                                <Card
                                    className="shadow-sm bg-secondary text-white text-center d-flex flex-column justify-content-center"
                                    style={{ height: "200px" }}
                                >
                                    <h5>Biggest Spender</h5>
                                    <h3 className="fw-bold">
                                        {biggestSpender.user} (${biggestSpender.totalSpent.toFixed(2)})
                                    </h3>
                                </Card>
                            )}
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
