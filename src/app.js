import express  from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient, MongoClient } from "mongodb";

const MongoClient = new MongoClient()
let db;

MongoClient.connect().then(() => {
    db = MongoClient.db("")
}).catch((err) => {
    console.log("erro")
})

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 5001
