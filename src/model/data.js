const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
  _id: String,
  Seed_RepDate: Number,
  Seed_Year: Number,
  Seeds_YearWeek: Number,
  Seed_Varity: String,
  Seed_RDCSD: String,
  Seed_Stock2Sale: Number,
  Seed_Season: Number,
  Seed_Crop_Year: String,
});

const Data = mongoose.model("Data", DataSchema);

module.exports = Data;
