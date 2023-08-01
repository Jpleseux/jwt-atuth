require("dotenv").config()
const express = require("express")
const bcypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const session  = require("express-session")

const port = 4000

const app = express();
//////////////////////////
app.use(express.json())

app.use(session({
    secret:"123456789",
    resave:false,
    saveUninitialized:true,
    cookie: {
        expires: new Date(Date.now() + 30 * 60 * 1000),
        maxAge: 30 * 60 * 1000 
      }
}))
//mongoDB
const conection = require("./db/conection")
conection()
//models
const users = require("./models/User")
//middlewares
function checkToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]
    console.log(authHeader)
    if(!token){
        return res.status(401).json({msg:"Acesso negado"})
    }
    try {
        const secret= process.env.SECRET

        jwt.verify(token, secret)

        next()
    } catch (error) {
        res.status(400).json({msg:"Acesso negado"+error,} )
    }
    
}

app.get("/", (req, res)=>{
    res.status(200).json({msg:"Wellcome"+req.session.nome})
})

app.get("/user/:id",checkToken, async(req, res)=>{

    const id = req.params.id

    //check user
    const user = await users.findById(id, "-password")

    if(!user){
        return res.status(404).json({msg: "Usuario não encontrado"})
    }

    res.status(200).json({user})

})

app.post("/auth/register",async(req, res)=>{
    const {nome, email, password} = req.body
    //validation
    if(!nome){
        return res.status(422).json({msg:"O nome é obrigatorio"})
    }
    if(!password){
        return res.status(422).json({msg:"A senha é obrigatoria"})
    }
    if(!email){
        return res.status(422).json({msg:"O email é obrigatorio"})
    }
    const userExist = await users.findOne({email: email})

    if(userExist){
        return res.status(422).json({msg:"Usuario ja existe"})
    }

    //create password
    const salt = await bcypt.genSalt(12)

    const passwordHash = await bcypt.hash(password, salt)

    //create user

    const user =  new users({
        nome,
        email,
        password:passwordHash
    })
    try {
        
        await user.save()

        res.status(201).json({msg:"Usuario criado com sucesso"})

    } catch (error) {
        res.status(500).json({msg:"Erro no servidor"+error})
    }
})

app.post("/auth/login", async(req, res)=>{
    const {email, password} = req.body

    if(!password){
        return res.status(422).json({msg:"A senha é obrigatoria"})
    }
    if(!email){
        return res.status(422).json({msg:"O email é obrigatorio"})
    }
    //---------
    const user = await users.findOne({email: email})

    if(!user){
        return res.status(422).json({msg:"Usuario não existe faça login"})
    }
    //check password
    const checkPassword = await bcypt.compare(password, user.password)

    if(!checkPassword){
        return res.status(422).json({msg:"Senha invalida"})
    }

    try {

        const secret = process.env.SECRET

        const token = jwt.sign(
            {
            id:user._id
            },
            secret
        )
        req.session.nome = user.nome
        req.session.token = token 
        res.status(200).json({msg:"Autenticação feita com sucesso", token})
        
    } catch (error) {
console.log(error)
    }

})


app.listen(port, ()=>{
    console.log(`Server is runing in port ${port}`)
})