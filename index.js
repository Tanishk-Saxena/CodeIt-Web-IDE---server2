const express = require("express");
const cors = require("cors");
const fs = require('fs');
const buffer = require('buffer');
const { exec } = require("child_process");
const { config } = require("dotenv");
config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5555;

function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const prepareOutputObject = (error, stdout, stderr) => {
    let output = {exit_code: 1, memory: null, time: null}
    if (error) {
        output = {...output, compile_output: Buffer.from(error, "utf-8").toString("base64"), exit_code: 1};
    } else {
        output = {...output, compile_output: null};
    }
    if (stderr) {
        output = {...output, stderr: Buffer.from(stderr, "utf-8").toString("base64"), exit_code: 1};
    } else {
        output = {...output, stderr: null};
    }
    if (stdout) {
        output = {...output, stdout: Buffer.from(stdout, "utf-8").toString("base64"), exit_code: 0};
    } else {
        output = {...output, stdout: null};
    }
    return output;
}

app.listen(port, ()=>{
    console.log(`Server up and running successfully at port ${port}.`);
})

app.post('/run', (req, res)=>{
    let output={};
    let data = req.body.jsonData;
    let dataObj = JSON.parse(data);
    const language = dataObj.language;
    let code = dataObj.source_code;
    if(code){
        let bufferObj1 = Buffer.from(code, 'base64');
        code = bufferObj1.toString('utf-8');
    }
    let inputs = dataObj.stdin;
    if(inputs){
        let bufferObj2 = Buffer.from(inputs, 'base64');
        inputs = bufferObj2.toString('utf-8');
    }
    let extension;
    switch (language) {
        case "c++":
            extension = 'cpp';
            break;
        case "java":
            extension = 'java';
            break;
        case "python":
            extension = 'py';
            break;
        case "javascript":
            extension = 'js';
            break;
        default:
            extension = 'txt';
            break;
    }
    const fileName = randomString(6);
    const filePath = `temp/${fileName}.${extension}`;
    fs.writeFile(filePath, code, function (err) {
        if (err) throw err;
    });

    switch (language) {
        case "c++":
            const outputExePath = `temp/${fileName}.exe`;
            exec(`g++ ${filePath} -o ${outputExePath} ; if($?) {.\\${outputExePath}}`, {'shell': 'powershell.exe'},  (error, stdout, stderr) => {
                output = prepareOutputObject(error, stdout, stderr);
                fs.unlink(filePath, function (err) {
                    if (err) throw err;
                });
                fs.unlink(outputExePath, function (err) {
                    if (err) throw err;
                });
                res.send(output);
            });
            break;
        case "python":
            exec(`python ${filePath}`, (error, stdout, stderr) => {
                output = prepareOutputObject(error, stdout, stderr);
                fs.unlink(filePath, function (err) {
                    if (err) throw err;
                });
                res.send(output);
            });
            break;
        case "java":
            const outputClassPath = `temp/${fileName}.class`;
            exec(`javac ${filePath} -o ${outputClassPath} ; if($?) {java ${outputClassPath}}`, {'shell': 'powershell.exe'}, (error, stdout, stderr) => {
                output = prepareOutputObject(error, stdout, stderr);
                fs.unlink(filePath, function (err) {
                    if (err) throw err;
                });
                fs.unlink(outputClassPath, function (err) {
                    if (err) throw err;
                });
                res.send(output);
            });
            break;
        case "javascript":
            exec(`node ${filePath}`, (error, stdout, stderr) => {
                output = prepareOutputObject(error, stdout, stderr);
                fs.unlink(filePath, function (err) {
                    if (err) throw err;
                });
                res.send(output);
            });
            break;
    }
})