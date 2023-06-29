const mongoose = require("mongoose")
const validateMongoDbId = (id) => {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new Error ("Eto id ne valid ili ne naiden"); 
};
module.exports = validateMongoDbId;