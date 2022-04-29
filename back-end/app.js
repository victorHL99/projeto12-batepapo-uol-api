import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import {MongoClient} from "mongodb";

const app = express();
app.use(cors());
app.use(json());
app.listen(5000, () => {
    console.log(chalk.red.bold("Servidor iniciado na porta 5000"))
});

const participants = [];

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

app.get("/participants", (req, res) => {
    res.send(participants)
})