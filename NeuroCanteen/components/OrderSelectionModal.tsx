import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

type Order = {
  orderId: number;
  orderedRole: string;
  orderedName: string;
  itemName: string;
  quantity: number;
  price: number;
  orderStatus: string;
  paymentType: string;
  paymentRecived: boolean;
  address: string;
  deliveryStatus: string;
  orderDateTime: string;
  phoneNo?: string;
  deliveryPriority?: number;
};

type OrderSelectionModalProps = {
  isVisible: boolean;
  orders: Order[];
  onSelect: (order: Order) => void;
  onClose: () => void;
};

export default function OrderSelectionModal({
  isVisible, orders, onSelect, onClose
}: OrderSelectionModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Choose an order for this priority slot:</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderId}>ID</Text>
            <Text style={styles.tableHeaderAddress}>Address</Text>
          </View>

          <ScrollView style={styles.orderListContainer}>
            {orders.length === 0 ? (
              <Text style={styles.noOrdersText}>No orders available.</Text>
            ) : (
              orders.map((order) => (
                <TouchableOpacity
                  key={order.orderId}
                  style={styles.orderItem}
                  onPress={() => onSelect(order)}
                >
                  <Text style={styles.orderItemId}>#{order.orderId}</Text>
                  <Text style={styles.orderItemAddress} numberOfLines={2} ellipsizeMode="tail">{order.address}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  tableHeaderId: {
    width: '25%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  tableHeaderAddress: {
    width: '75%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'left',
    paddingLeft: 10,
  },
  orderListContainer: {
    width: '100%',
    maxHeight: '70%', // Limit height to ensure cancel button is visible
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  orderItemId: {
    width: '25%',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  orderItemAddress: {
    width: '75%',
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    paddingLeft: 10,
  },
  noOrdersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 