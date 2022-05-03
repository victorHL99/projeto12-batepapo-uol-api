import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import dotenv from "dotenv";
import Joi from "joi";
import dayjs from "dayjs";

import {MongoClient} from "mongodb";

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

//CONFIGURAÇAO DE SCHEMA
const userSchema = Joi.object({
    name: Joi.string().required(),
});

const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.valid("message", "private_message").required(),
})


// CONFIGURANDO POST/PARTICIPANTS
app.post("/participants", async (req, res) => {
    const {name} = req.body;
    const novoParticipante = {
        name,
        lastStatus: Date.now()
    }
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
        res.sendStatus(500);
    }
})

//CONFIGURAÇÃO POST/MESSAGES
app.post("/messages", async (req, res) => {
const {to,text,type} = req.body;
const {user} = req.header;
const novaMensagem = {
    from: user,
    to: to,
    text: text,
    type: type,
    time : dayjs().format("HH:mm:ss")
}



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

//CONFIGURAÇÃO GET/MESSAGES
app.get("/messages", async (req, res) => {
    let {limit} = req.query;
    const {user} = req.header;

    if(!limit){
        limit = 100;
    } 
        

    try{
        const mensagens = await dataBase.collection("messages").find({$or: [{from:user},{to:user},{to:"Todos"}]}).toArray();
        const messagesInvertidas = mensagens.reverse();
        const novasMensagens = [];
        for(let i = 0; i < messagesInvertidas.length; i++){
            if(i<limit){
                novasMensagens.push(messagesInvertidas[i]);
            } else {
                break;
            }
        }

        res.send(novasMensagens.reverse());
    } catch(error){
        res.sendStatus(422);
    }
})

app.post("/status", async (req, res) => {
    const {user} = req.header;
    
    try{
        const validarUsuario = await dataBase.collection("participants").findOne({name: user});
        if(validarUsuario.error){
            res.sendStatus(404);
            return;
        }

        await dataBase.collection("participants").updateOne({name: user}, {$set: {lastStatus: Date.now()}});
        res.sendStatus(200);
    } catch (error){
        res.sendStatus(404);
    }
});


setInterval(async () => {
    try {
        const participants = await dataBase.collection("participants").find({}).toArray();

        const validarTempoParticipante = participants.filter(participant => {
            if (Math.abs(participant.lastStatus - Date.now()) > 10000) {
                return true;
            }

            return false
        });

        for (let i = 0; i < validarTempoParticipante.length; i++) {
            await dataBase.collection('participants').deleteOne({name: validarTempoParticipante[i].name});
            await dataBase.collection('messages').insertOne({
                from: validarTempoParticipante[i].name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss')
            });
        }
    } catch(e) {
        console.log(chalk.bold.red('Deu erro no autoRemove', e));
    }
}
, 15000);

app.listen(5000, () => {
    console.log(chalk.blue.bold("Servidor iniciado na porta 5000"))
});