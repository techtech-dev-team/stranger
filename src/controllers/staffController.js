const Staff = require('../models/Staff');

// Add new staff
exports.addStaff = async (req, res) => {
  try {
    const { name, number, aadharOrPanNumber, email, staffRole, status } = req.body;

    const existingStaff = await Staff.findOne({ number });
    if (existingStaff) {
      return res.status(400).json({ message: 'Staff with this number already exists' });
    }

    const newStaff = new Staff({ name, number, aadharOrPanNumber, email, staffRole, status });
    await newStaff.save();

    res.status(201).json({ message: 'Staff added successfully', staff: newStaff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    
    const staff = await Staff.findByIdAndDelete(staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark staff absent
exports.markAbsent = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    if (staff.attendance.absent < staff.attendance.totalWorkingDays) {
      staff.attendance.absent += 1;
      await staff.save();
      return res.status(200).json({ message: 'Staff marked absent', attendance: staff.attendance });
    }

    res.status(400).json({ message: 'Cannot mark absent beyond total working days' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance report
exports.getAttendanceReport = async (req, res) => {
  try {
    const staffList = await Staff.find();

    const report = staffList.map(staff => {
      const presentDays = staff.attendance.totalWorkingDays - staff.attendance.absent;
      return {
        name: staff.name,
        number: staff.number,
        present: presentDays,
        absent: staff.attendance.absent,
        totalWorkingDays: staff.attendance.totalWorkingDays
      };
    });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
