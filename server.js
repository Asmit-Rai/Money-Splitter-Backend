// QRScreen.js

import React, { useState, useEffect } from "react"; 
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { Text, Button, TextInput, List, Checkbox } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios'; // Import Axios

const BACKEND_URL = 'https://money-splitter-backend.onrender.com'; // Define your backend URL

const QRScreen = () => {
  const route = useRoute();
  const { participants, currentGroupId } = route.params;
  const navigation = useNavigation();

  const [userId, setUserId] = useState(null);
  const [billAmount, setBillAmount] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [splitAmount, setSplitAmount] = useState("");
  const [checked, setChecked] = useState(true);
  const [amounts, setAmounts] = useState({});
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState("");

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        console.error("User ID not found in AsyncStorage");
      }
      setUserId(storedUserId);
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (billAmount) {
      initializePaymentSheet();
    }
  }, [billAmount]);

  // Function to store data on IPFS and the blockchain via the backend API
  const storeDataOnBlockchain = async (data) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/store-data`, {
        data,
      });

      if (response.status === 200) {
        console.log('Data stored on IPFS and blockchain successfully:', response.data);
        return response.data;
      } else {
        console.error('Failed to store data on blockchain:', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error storing data on blockchain:', error);
      return null;
    }
  };

  const openPaymentSheet = async () => {
    if (!loading) return;

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert("Payment Failed", error.message);
        return;
      }

      Alert.alert("Payment Success", "Your payment is confirmed!");

      let splitDetails = checked
        ? participants.map((participant) => ({
            participant: participant._id,
            owedAmount: parseFloat(splitAmount),
          }))
        : participants.map((participant) => ({
            participant: participant._id,
            owedAmount: parseFloat(amounts[participant.name] || "0"),
          }));

      const expenseData = {
        expenseName,
        amount: parseFloat(billAmount),
        participants: participants.map((p) => p._id),
        groupId: currentGroupId,
        payer: userId,
        paymentIntentId: paymentIntentId,
        splitDetails,
      };

      console.log("Submitting expense to server:", expenseData);
      console.log("Participants IDs:", participants.map((p) => p._id));

      // Store data on IPFS and blockchain
      const blockchainResponse = await storeDataOnBlockchain(expenseData);

      if (blockchainResponse) {
        // Store the IPFS hash and transaction hash in your expenseData
        expenseData.ipfsHash = blockchainResponse.ipfsHash;
        expenseData.transactionHash = blockchainResponse.transactionHash;
      }

      const response = await axios.post(`${BACKEND_URL}/api/expenses/confirmPaymentAndAddExpense`, expenseData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Server response:", response.data);

      if (response.status !== 201) {
        Alert.alert(
          "Error Adding Expense",
          response.data.message || "Failed to add expense."
        );
        return;
      }

      const result = response.data;
      console.log("Expense added successfully:", result.expense);

      // Optionally, navigate to another screen or reset form
      // navigation.navigate("Expenses");
    } catch (err) {
      console.error("Error in openPaymentSheet:", err);

      if (err instanceof SyntaxError) {
        Alert.alert("Server Error", "Invalid response from the server.");
      } else {
        Alert.alert("Error", err.message || "An unexpected error occurred.");
      }
    }
  };

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/payment-sheet`, {
        expenseName,
        billAmount: parseFloat(billAmount),
        splitDetails: checked
          ? participants.map((p) => ({
              name: p.name,
              amount: splitAmount,
            }))
          : Object.entries(amounts).map(([name, amount]) => ({
              name,
              amount: parseFloat(amount),
            })),
      });

      const {
        paymentIntentId,
        paymentIntentClientSecret,
        ephemeralKey,
        customer,
      } = response.data;

      console.log("Payment sheet params:", {
        paymentIntentId,
        paymentIntentClientSecret,
        ephemeralKey,
        customer,
      });

      setPaymentIntentId(paymentIntentId);
      setPaymentIntentClientSecret(paymentIntentClientSecret);

      return {
        paymentIntentClientSecret,
        ephemeralKey,
        customer,
      };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      Alert.alert("Error", "Failed to initialize payment sheet.");
      return null;
    }
  };

  const initializePaymentSheet = async () => {
    try {
      const paymentSheetParams = await fetchPaymentSheetParams();
      if (!paymentSheetParams) return;

      const { paymentIntentClientSecret, ephemeralKey, customer } = paymentSheetParams;

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Money Splitter Inc.",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntentClientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: "Jane Doe",
        },
      });

      if (!error) {
        setLoading(true);
      } else {
        console.error("Error initializing payment sheet:", error);
        Alert.alert("Error", "Failed to initialize payment sheet.");
      }
    } catch (error) {
      console.error("Error initializing payment sheet:", error);
      Alert.alert("Error", "Failed to initialize payment sheet.");
    }
  };

  const calculateSplit = () => {
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Bill Amount", "Please enter a valid bill amount.");
      return;
    }

    if (participants.length === 0) {
      Alert.alert(
        "No Participants",
        "There are no participants to split the bill."
      );
      return;
    }

    if (checked) {
      const perPerson = (amount / participants.length).toFixed(2);
      setSplitAmount(perPerson);

      const equalAmounts = {};
      participants.forEach((participant) => {
        equalAmounts[participant.name] = perPerson;
      });
      setAmounts(equalAmounts);
    } else {
      const totalEntered = Object.values(amounts).reduce(
        (sum, val) => sum + parseFloat(val || "0"),
        0
      );

      if (isNaN(totalEntered) || totalEntered <= 0) {
        Alert.alert(
          "Invalid Amounts",
          "Please enter valid amounts for participants."
        );
        return;
      }

      if (totalEntered !== amount) {
        Alert.alert(
          "Amounts Mismatch",
          `The total of individual amounts (${totalEntered.toFixed(
            2
          )}) does not equal the bill amount (${amount.toFixed(2)}).`
        );
        return;
      }
      setSplitAmount("");
    }
  };

  const handleAmountChange = (name, value) => {
    setAmounts({ ...amounts, [name]: value });
  };

  return (
    <StripeProvider publishableKey="pk_test_51QIsU3EbklFJ2mKnHm8ptUIow6AueGIYorOvFKJRAzzfZk7AHYCqAqGMZ2tx1vlUe8nDCltXQUIQPIA8mcLBLdt100oydNPXKQ">
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          mode="outlined"
          label="Enter Expense Name"
          value={expenseName}
          onChangeText={setExpenseName}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Enter Bill Amount"
          keyboardType="numeric"
          value={billAmount}
          onChangeText={setBillAmount}
          style={styles.input}
        />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Checkbox
            status={checked ? "checked" : "unchecked"}
            onPress={() => setChecked(!checked)}
          />
          <Text style={{ fontSize: 16, marginLeft: 8, marginTop: 8 }}>
            Split Money Equally
          </Text>
        </View>

        {!checked && (
          <List.Section>
            {participants.map((participant, index) => (
              <View key={index} style={styles.participantRow}>
                <List.Item
                  title={participant.name}
                  left={() => <List.Icon icon="account" />}
                  style={{ flex: 1 }}
                />
                <TextInput
                  mode="outlined"
                  label="Amount"
                  keyboardType="numeric"
                  value={amounts[participant.name] || ""}
                  onChangeText={(value) =>
                    handleAmountChange(participant.name, value)
                  }
                  style={styles.amountInput}
                />
              </View>
            ))}
          </List.Section>
        )}

        {checked && splitAmount ? (
          <Text style={styles.splitText}>
            Each participant needs to pay: ₹ {splitAmount}
          </Text>
        ) : null}

        <Button mode="contained" onPress={calculateSplit} style={styles.button}>
          {checked ? "Calculate Equal Split" : "Validate Amounts"}
        </Button>

        <Button
          mode="contained"
          onPress={openPaymentSheet}
          style={[styles.button, styles.checkoutButton]}
          disabled={!loading}
        >
          Checkout
        </Button>
      </ScrollView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginVertical: 10,
  },
  button: {
    marginVertical: 10,
  },
  checkoutButton: {
    backgroundColor: "#008000",
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  amountInput: {
    flex: 1,
    marginLeft: 10,
  },
  splitText: {
    fontSize: 16,
    marginVertical: 10,
  },
});

export default QRScreen;
