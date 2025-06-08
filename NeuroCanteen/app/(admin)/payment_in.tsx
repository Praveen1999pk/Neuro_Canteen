import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { DataTable } from 'react-native-paper';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

export default function PaymentIn() {
    type Order = {
        orderId: string;
        orderedUserId: string;
        orderedRole: string;
        price: number;
        paymentType: string;
        paymentRecived: boolean; 
    };

    type Summary = {
        orderedUserId: string;
        orderedRole: string;
        totalPrice: number;
        paymentType: string;
        allPaid: boolean;
        orderIds: string[];
    };

    const [orders, setOrders] = useState<Order[]>([]);
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState<{[userId: string]: boolean}>({});

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axiosInstance.get<Order[]>("/orders/filter/Credit", {
                params: {
                    orderedRole: "Staff",
                    paymentType: "CREDIT",
                    paymentStatus: null
                }
            });

            const originalData = response.data;

            if (!Array.isArray(originalData)) {
                console.error("Unexpected response format:", originalData);
                return;
            }

            setOrders(originalData);
            summarizeOrders(originalData);
        } catch (error) {
            if (error instanceof Error) {
                console.error("Error fetching filtered orders:", error.message);
            } else {
                console.error("Error fetching filtered orders:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const summarizeOrders = (orders: Order[]) => {
        const grouped: { [userId: string]: Summary } = {};

        orders.forEach((order) => {
            const userId = order.orderedUserId;

            if (!grouped[userId]) {
                grouped[userId] = {
                    orderedUserId: userId,
                    orderedRole: order.orderedRole,
                    totalPrice: 0,
                    paymentType: order.paymentType,
                    allPaid: true,
                    orderIds: []
                };
            }

            grouped[userId].totalPrice += order.price;
            grouped[userId].orderIds.push(order.orderId);

            if (!order.paymentRecived) {  
                grouped[userId].allPaid = false;
            }
        });

        setSummaries(Object.values(grouped));
    };

    const markAsPaid = async (userId: string) => {
        setProcessingPayment(prev => ({...prev, [userId]: true}));
        
        try {
            const unpaidOrders = orders.filter(
                (o) => o.orderedUserId === userId && !o.paymentRecived
            );

            const unpaidOrderIds = unpaidOrders.map((o) => o.orderId);

            if (unpaidOrderIds.length === 0) {
                alert("No unpaid orders to mark as paid.");
                return;
            }

            await axiosInstance.put("/orders/markPaid", unpaidOrderIds);
            fetchOrders();
        } catch (error) {
            let errorMessage = "Failed to mark as paid";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message;
            }
            alert(errorMessage);
        } finally {
            setProcessingPayment(prev => ({...prev, [userId]: false}));
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchOrders}
                    colors={['#2E7D32']}
                />
            }
        >
            {loading ? (
                <ActivityIndicator size="large" color="#2E7D32" />
            ) : summaries.length === 0 ? (
                <Text style={styles.noOrdersText}>No orders found.</Text>
            ) : (
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>User ID</DataTable.Title>
                        <DataTable.Title>Role</DataTable.Title>
                        <DataTable.Title numeric>Total Price</DataTable.Title>
                        <DataTable.Title>Payment</DataTable.Title>
                        <DataTable.Title>Action</DataTable.Title>
                    </DataTable.Header>

                    {summaries.map((summary) => (
                        <DataTable.Row key={summary.orderedUserId}>
                            <DataTable.Cell>{summary.orderedUserId}</DataTable.Cell>
                            <DataTable.Cell>{summary.orderedRole}</DataTable.Cell>
                            <DataTable.Cell numeric>
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR'
                                }).format(summary.totalPrice)}
                            </DataTable.Cell>
                            <DataTable.Cell>{summary.paymentType}</DataTable.Cell>
                            <DataTable.Cell>
                                {!summary.allPaid ? (
                                    <TouchableOpacity 
                                        style={styles.payButton}
                                        onPress={() => markAsPaid(summary.orderedUserId)}
                                        disabled={processingPayment[summary.orderedUserId]}
                                    >
                                        {processingPayment[summary.orderedUserId] ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text style={styles.payButtonText}>Mark Paid</Text>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.paidText}>✓ Paid</Text>
                                )}
                            </DataTable.Cell>
                        </DataTable.Row>
                    ))}
                </DataTable>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    noOrdersText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#757575',
    },
    payButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        minWidth: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payButtonText: {
        color: 'white',
        fontSize: 14,
    },
    paidText: {
        color: '#2E7D32',
        fontWeight: 'bold',
    },
});