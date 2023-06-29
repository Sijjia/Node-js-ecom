const { default: mongoose } = require("mongoose")

const dbConnect = () => {
    try {
        const conn = mongoose.connect(process.env.MONGODB_URL)
        console.log("DB Uspeshno podklychilos")
    } catch (error) {
        console.log("Oshybka BD")
    }
};
module.exports = dbConnect;