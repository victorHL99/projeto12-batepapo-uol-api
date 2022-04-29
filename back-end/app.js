import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import {MongoClient} from "mongodb";

const app = express();
app.use(cors());
app.use(json());
app.listen(5000, () => {console.log(chalk.red.bold("Servidor iniciado na porta 5000"))});