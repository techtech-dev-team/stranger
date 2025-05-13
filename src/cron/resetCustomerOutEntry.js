const cron = require("node-cron");
const moment = require("moment-timezone");
const Customer = require("../models/Customer");

const scheduleCustomerOutReset = () => {
  cron.schedule("30 18 * * *", async () => {
    try {
      const nowIST = moment().tz("Asia/Kolkata").toDate();
      console.log(`[${moment().tz("Asia/Kolkata").format()}] Running customer out reset job`);

      const result = await Customer.updateMany(
        {},
        {
          $set: {
            paymentCash2: 0,
            paymentOnline2: 0,
            cashCommission: 0,
            onlineCommission: 0,
            remark2: "System automated",
            outTime: nowIST,
          },
        }
      );

      console.log(`✅ Customer out entries reset: ${result.modifiedCount} updated`);
    } catch (err) {
      console.error("❌ Error resetting customer out entries:", err);
    }
  });
};

module.exports = scheduleCustomerOutReset;
