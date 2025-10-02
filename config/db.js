const connectToDb = async () => {
    const { default: mongoose, Schema } = require("mongoose");

    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/final_year_project')
        console.log('Connected to DB')
    } catch (error) {
        console.log(error)
    }

    const mymodel = mongoose.model('Test', new Schema({ name: String}) );

    const data = await mymodel.findOne()
    console.log(data)
}

module.exports = connectToDb;