import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(json());
app.listen(5000, () => {
    console.log(chalk.blue.bold("Servidor iniciado na porta 5000"))
});

// CONFIGURANDO O BANCO DE DADOS
let dataBase = null;
dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URL);
const promise  = mongoClient.connect();
promise.then(response => {
    dataBase = mongoClient.db("Driven");
    console.log(chalk.green.bold("Banco de dados conectado"));
});
promise.catch(error => {
    console.log(chalk.red.bold("Banco de dados não conectado"),error)});

//Post /participants 
app.post("/participants", (req, res) => {
    const {name} = req.body;

    const novoParticipante = {
        name,
        lastStatus: Date.now()
    }

    if(!name) {
        res.sendStatus(422);
        return;
    }

    const promise = dataBase.collection("participantes").insertOne(novoParticipante);
    promise.then((confirmacao)=>{
        console.log(confirmacao);
        res.status(201).send(chalk.green.bold("Participante inserido com sucesso"));
    });
    promise.catch((error) =>{ 
        console.log(chalk.red.bold("Erro ao inserir novo participante"),error)
        res.status(500).send("Erro ao inserir novo participante")});
    
})

app.get("/participants", (req, res) => {
    // retornar a lista de todos os participantes
    const promise = dataBase.collection("participantes").find({}).toArray();
    promise.then((participantes) => {
        res.send(participantes);
    });
    promise.catch((error) => {
        console.log(chalk.red.bold("Erro ao buscar participantes"),error)
        res.status(500).send("Erro ao buscar participantes");
    })
})

// Post /messages
app.post("/messages", (req, res) => {
    const {to, text, type} = req.body;
})

// Get /messages
app.get("/messages", (req,res) => {

})

//Post /status
app.post("/status", (req, res) => {

})