import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import {MongoClient} from "mongodb";

const app = express();
app.use(cors());
app.use(json());
app.listen(5000, () => {
    console.log(chalk.blue.bold("Servidor iniciado na porta 5000"))
});

// CONFIGURANDO O BANCO DE DADOS
let dataBase = null;
const mongoClient = new MongoClient("mongodb://localhost:27017");
const promise  = mongoClient.connect();
promise.then(response => {
    dataBase = mongoClient.db("test");
    console.log(chalk.green.bold("Banco de dados conectado"));
});
promise.catch(error => console.log(chalk.red.bold("Banco de dados não conectado"),error));

//Post /participants 
app.post("/participants", (req, res) => {
    const {name} = req.body;
    //Validar: (caso algum erro seja encontrado, retornar status 422)
    //name deve ser strings não vazio
    if(!name) {
        res.sendStatus(422);
    } else {
        console.log(name);
        participants.push(name);
        res.send("ok");

    }
})

// Get /participants
app.get("/participants", (req, res) => {
    // retornar a lista de todos os participantes
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