const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { config } = require("dotenv");
config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT1 || 5555;

app.listen(port, ()=>{
    console.log(`Server up and running successfully at port ${port}.`);
})

app.post('/run', (req, res)=>{
    console.log(req.body);
    let output = {};
    let token;

    const executeOptions = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions',
      params: {base64_encoded: 'true', fields: '*'},
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': '6962acde68msh61513431cdeb116p1d9f8djsnb1268a51e9a8',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: req.body.jsonData
    };
    axios.request(executeOptions).then(function async (response) {
        console.log(response.data);
        token = response.data.token;
    }).then(()=>{
        const receiveOptions = {
            method: 'GET',
            url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
            params: {base64_encoded: 'true', fields: '*'},
            headers: {
                'X-RapidAPI-Key': '6962acde68msh61513431cdeb116p1d9f8djsnb1268a51e9a8',
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
        };
        axios.request(receiveOptions).then(function (response) {
            console.log(response.data);
            output = {
                stdout: response.data.stdout,
                stderr: response.data.stderr,
                compile_output: response.data.compile_output,
                exit_code: response.data.exit_code,
                time: response.data.time,
                memory: response.data.memory
            }
            res.send(output);
        }).catch(function (error) {
            console.error(error);
        });
    }).catch(function (error) {
        console.error(error);
    });

})