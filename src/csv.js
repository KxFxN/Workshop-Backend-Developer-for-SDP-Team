const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("fast-csv");
const Data = require("./model");

const mongoUri =
  "mongodb+srv://sakarin14184:385739@cluster0.vu9kpok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const importCSV = () => {
  fs.createReadStream("./DataBase.csv")
    .pipe(csv.parse({ headers: true }))
    .on("data", async (row) => {
      try {
        const data = new Data({
          _id: row._id,
          Seed_RepDate: row.Seed_RepDate,
          Seed_Year: row.Seed_Year,
          Seeds_YearWeek: row.Seeds_YearWeek,
          Seed_Varity: row.Seed_Varity,
          Seed_RDCSD: row.Seed_RDCSD,
          Seed_Stock2Sale: parseFloat(row.Seed_Stock2Sale.replace(/,/g, "")),
          Seed_Season: row.Seed_Season,
          Seed_Crop_Year: row["Seed_Crop _Year"],
        });
        await data.save();
      } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะบันทึกข้อมูล:", error);
      }
    })
    .on("end", () => {
      console.log("นำเข้าไฟล์เสร็จสิ้น");
    });
};

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("เชื่อมต่อฐานข้อมูลเรียบร้อย");
    importCSV();
  })
  .catch((err) => {
    console.error("เกิดข้อผิดพลาดขณะเชื่อมต่อฐานข้อมูล:", err);
  });

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("ปิดการเชื่อมต่อ MongoDB");
  process.exit(0);
});
