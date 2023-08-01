const mongoose = require("mongoose")

async function main(){
    try {
        mongoose.set("strictQuery", true)
        
        await mongoose.connect("mongodb+srv://jao:mm24~~92H@cluster0.qizeddr.mongodb.net/?retryWrites=true&w=majority")
        console.log("conection success")
    } catch (error) {
        console.log("Error in conection"+error)
    }
}

module.exports =main