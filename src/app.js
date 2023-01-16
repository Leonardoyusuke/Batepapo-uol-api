import express  from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi"
import dayjs from 'dayjs';


const server = express()
server.use(express.json())
server.use(cors())
const PORT = 5000

dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;

const userSchema = joi.object({
  name: joi.string().required()
})

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message").valid("private_message")
})

setTimeout(removeInative,15000)

async function removeInative(){
const users = await db.collection("participants").find().toArray()
 users.forEach((u) => {
  if((Date.now()-u.lastStatus) > 10000 ){
    db.collection("participants").deleteOne({name:u.name})
    db.collection("messages").insertOne({
      from:u.name,
      to:"todos",
      text:"sai da sala...",
      type:"status",
      time: dayjs().format("HH:mm:ss")
    })
  }
 })
}

try {
    await mongoClient.connect()
    db = mongoClient.db()
    console.log("conectando mongo")
  } catch (error) {
    console.log(error)
  }

server.post("/participants", async (request, response) => {   
  const participant = request.body
  const validation = userSchema.validate(participant, { abortEarly: false }) //validacao
  const time = Date.now();
  const participantPost = {
    name: participant.name,
    lastStatus: time
  }
  if(validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return response.sendStatus(422).send(errors)}

  try {
    const nameInUse = await db.collection("participants").findOne(participant) //procurar nome igual
    if(nameInUse){
      return response.sendStatus(409)
    }
    await db.collection("participants").insertOne(participantPost)
    await db.collection("messages").insertOne({
      from:participant.name,
      to: "todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs(Date.now()).format("HH:mm:ss")
    })
    return response.sendStatus(201)
    console.log("deu")
    }
  catch (error) {
    response.send(error)
    console.log(error)
  }
  })

server.get("/participants", async (request, response) => {
    try { 
      const participants = await db.collection("participants").find().toArray()
      return response.send(participants)
    } catch (error) {
        res.status(500).send("Deu um erro no servidor de banco de dados")

    }   
})

server.post("/messages", async (request, response) => {
  const { to, text, type } = request.body
  const { user } = request.headers
  const validation = messageSchema.validate(request.body,{abortEarly:true})
  if (validation.error){
    response.sendStatus(422)
  }
  try {
    const validateUser = await db.collection("participants").findOne({name:user})
    if(!validateUser){
      response.sendStatus(404)
    }
    else{
      response.sendStatus(201)
    }

    await db.collection("messages").insertOne({
      from: user,
      to,
      text,
      type,
      time: dayjs(Date.now()).format("HH:mm:ss")
    })
    return response.sendStatus(201)
  } catch (error) {
    response.sendStatus(500)
  }

})


server.get("/messages", async (request, response) => {
  const { limit } = request.query
  const { user } = request.headers 
  
  try {
    const messages = await db.collection("messages").find({ $or:[{from: user },{to: user},{to:"todos"},{type:"status"},{type:"message"}]}).toArray()
    const reverseMsg = messages.reverse()
    if(!limit){
      response.send(reverseMsg)
      }
    else if(limit <= 0){
      response.sendStatus(422)
    }
    else{
      const msg = reverseMsg.slice(-limit)
      response.send(msg)
    }
  } catch (error) {
    response.send(error)
      
  }
})

server.listen(PORT, () => {
    console.log(`server on port ${PORT}`)
  })