import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

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

// CONFIGURANDO POST/PARTICIPANTS
app.post("/participants", async (req, res) => {
    const {name} = req.body;
    const novoParticipante = {
        name,
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

    try{
        const verificacao = await dataBase.collection("participants").findOne({name});
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

//CONFIGURAÇÃO GET/PARTICIPANTS
app.get("/participants", async (req, res) => {
    try{
        const participantes = await dataBase.collection("participants").find({}).toArray();
        res.send(participantes);
    } catch (e){
        res.status(500).send("Erro ao listar participantes");
    }
})

//CONFIGURAÇÃO POST/MESSAGES
app.post("/messages", async (req, res) => {
const {to,text,type} = req.body;
const {user} = req.headers;
const tempoAtual = dayjs().format("HH:mm:ss");
const novaMensagem = {
    from: user,
    to,
    text,
    type,
    time : tempoAtual
}

const messageSchema = joi.object({
    to: joi.string().required().min(1),
    text: joi.string().required().min(1),
    type: joi.valid('message', 'private_message').required(),
})

try{
    await messageSchema.validate(novaMensagem, {abortEarly: false});
} catch(error){
    res.sendStatus(422);
    return;
}

try{
    const validacaoParticipante = await dataBase.collection("participants").findOne({name: user});
    if(!validacaoParticipante){
        res.sendStatus(422);
        return;
    }
    await dataBase.collection("messages").insertOne(novaMensagem);
    res.sendStatus(201);
} catch (error){
    res.sendStatus(422);
}

})

app.get("/messages", async (req, res) => {
    
})

app.listen(5000, () => {
    console.log(chalk.blue.bold("Servidor iniciado na porta 5000"))
});