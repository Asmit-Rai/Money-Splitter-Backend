exports.addExpense = async (req, res) => {
    try {
      const { expenseName, amount, payer, participants, groupId } = req.body;
  
      console.log('Received Request Body:', req.body); // Log the request body
  
      // Validate required fields
      if (!expenseName || !amount || !payer || !participants || !groupId) {
        return res.status(400).json({ message: 'All fields are required: expenseName, amount, payer, participants, groupId.' });
      }
  
      // Validate group existence
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: `Group with ID "${groupId}" not found.` });
      }
  
     
      // Create a new expense
      const newExpense = new Expense({
        expenseName,
        amount,
        payer: payerUser._id,
        participants: updatedParticipants,
        group: group._id,
      });
  
      // Save the expense to the database
      await newExpense.save();
  
      res.status(201).json({
        message: 'Expense added successfully.',
        expense: newExpense,
      });
    } catch (error) {
      console.error('Error adding expense:', error.message);
      res.status(500).json({ message: 'Server error. Please try again later.', error: error.message });
    }
  };
  