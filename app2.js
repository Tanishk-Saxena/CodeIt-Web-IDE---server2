const express = require("express");
const cors = require("cors");
const { config } = require("dotenv");
config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT2 || 5555;

app.listen(port, ()=>{
    console.log(`Server up and running successfully at port ${port}.`);
})

app.post('/run', (req, res)=>{
    res.send("Hello");
})