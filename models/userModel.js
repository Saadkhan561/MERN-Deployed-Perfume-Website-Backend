const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  password: {
    type: String,
    required: function () {
      return !this.isGuest;
    },
  },
  phone: { type: Number, required: true },
  address: { type: String, default: undefined },
  city: { type: String, default: undefined },
  role: { type: String, default: "user" },
  isGuest: { type: Boolean, default: false },
  passwordResetToken: { type: String, default: undefined },
  passwordResetExpiry: { type: Date, default: undefined },
}, {timestamp: true});

module.exports = mongoose.model("perfume_users", userSchema);
