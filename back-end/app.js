import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";

import {MongoClient, ObjectId} from "mongodb";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

// CONFIGURANDO O BANCO DE DADOS
let dataBase = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);
const promise  = mongoClient.connect();
promise.then(response => {
    dataBase = mongoClient.db("Driven");
    console.log(chalk.green.bold("Banco de dados conectado")); 
});
promise.catch(error => {
    console.log(chalk.red.bold("Banco de dados não conectado"),error)});

app.post("/participants", async (req, res) => {
    const body = req.body;
    const novoParticipante = {
        name: body.name,
        lastStatus: Date.now()
    }
    
    const userSchema = joi.object({
        name: joi.string().required().min(1),
        lastStatus: joi.number().required()
    });
    
    const validarNomeUsuario = userSchema.validate(novoParticipante);
    if(validarNomeUsuario.error){
        res.status(422).send(validarNomeUsuario.error.details.map(descricao => descricao.message));
        return;
    }
    /* const participante = await dataBase.collection("participants").find({name:body.name}).toArray(); */

    

    try{
        const verificacao = await dataBase.collection("participants").findOne({name:body.name});
        if(verificacao){
            res.sendStatus(409);
            return;
        } else {
            await dataBase.collection("participants").insertOne(novoParticipante);
            res.status(201).send(chalk.green.bold("Participante inserido com sucesso"));
        }

    } catch(error) {
        console.log(chalk.red.bold("Erro ao inserir novo participante"),error)
        res.status(500).send("Erro ao inserir novo participante");
    }
});


app.get("/participants", async (req, res) => {
    try{
        const participantes = await dataBase.collection("participants").find({}).toArray();
        res.send(participantes);
    } catch (e){
        res.status(500).send("Erro ao listar participantes");
    }
})



app.listen(5000, () => {
    console.log(chalk.blue.bold("Servidor iniciado na porta 5000"))
});