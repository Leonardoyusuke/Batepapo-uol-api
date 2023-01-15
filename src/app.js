import express  from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi"
import dayjs from 'dayjs';


const server = express()
server.use(express.json())
server.use(cors())
const PORT = 5001

dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;

const userSchema = joi.object({
  name: joi.string().required()
})

try {
    await mongoClient.connect()
    db = mongoClient.db()
  } catch (error) {
    console.log(error)
  }

server.post("/participants", async (request, response) => {   
  const participant = request.body
  const validation = userSchema.validate(participant, { abortEarly: false }) //validacao
  const time = Date.now();
   if(validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return response.sendStatus(422).send(errors)}

  try {
    const nameInUse = await db.collection("participants").findOne(participant) //procurar nome igual
    if(nameInUse){
      return response.sendStatus(409)
    }
    await db.collection("participants").insertOne({...participant, lastStatus: time })
    await db.collection("messages").insertOne({
      from:participant.name,
      to: "todos",
      text: "entrou na sala...",
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

server.get("/messages"), async (request, response) => {
    
}

server.listen(PORT, () => {
    console.log(`server on port ${PORT}`)
  })