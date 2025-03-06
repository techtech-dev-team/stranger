const Customer = require('../models/Customer');
const Vision = require('../models/Vision');

// Fetch customer and vision entries with filters

exports.updateCustomerStatus = async (req, res) => {
    try {
      const { customerId } = req.params;
      const { status, remark, verified } = req.body;
  
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { status, remark, verified },
        { new: true }
      );
  
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
  
      res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  
  exports.getCustomerStatuses = async (req, res) => {
    try {
        const customers = await Customer.find({}, 'status remark verified'); // Fetch only required fields

        res.status(200).json({ customers });
    } catch (error) {
        console.error('Error fetching customer statuses:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};