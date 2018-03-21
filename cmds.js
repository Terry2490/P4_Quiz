const {models} = require('./model');
const {log, biglog, errorlog, colorize}= require("./out");
const Sequelize = require('sequelize');

/**
 *Muestra la ayuda.
 */
exports.helpCmd = (socket,rl) => {
    log(socket,"Comandos:");
    log(socket," h|help - Muestra esta ayuda.");
    log(socket," list - Listar los quizzes existentes.");
    log(socket," show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(socket," add - Añadir un nuevo quiz internamente.");
    log(socket," delete <id> - Borrar el quiz indicado.");
    log(socket," edit <id> - Editar el quiz indicado.");
    log(socket," test <id> - Probar el quiz indicado.");
    log(socket," p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket," credits - Créditos.");
    log(socket," q|quit - Salir del programa.");
    rl.prompt();
};
/**
 *Lista todos los quizzes existentes en el Modelo
 *
 */
exports.listCmd = (socket,rl) => {

    models.quiz.findAll()
        .each(quiz=>{
        log(socket,` [${colorize(quiz.id,'magenta')}]: ${quiz.question}`);

})
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
});
};

const validateId = id => {

    return new Sequelize.Promise((resolve,reject) =>{
        if(typeof id === "undefined"){
        reject(new Error(`Falta el parametro <id>.`));
    }else{
        id = parseInt(id);
        if(Number.isNaN(id)){
            reject(new Error(`El valor del parametro <id> no es un numero`));
        }else{
            resolve(id);
        }
    }
});
};
/**
 *Muestra el quiz indicado en el parámtro: la pregunta y la respuesta
 *
 */
exports.showCmd = (socket,rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if(!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(socket,`  [${colorize(id,'magenta')}]: ${quiz.question}  ${colorize('=>','magenta')}  ${quiz.answer}`);
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
});

};


const makeQuestion=(rl,text) =>{
    return new Sequelize.Promise((resolve,reject)=>{
        rl.question(colorize(text,'red'),answer=>{
        resolve(answer.trim());
});
});
};
/**
 *Añade un nuevo quiz al modelo.
 *Pregunta interactivamente por la pregunta y por la respuesta
 *
 */
exports.addCmd = (socket,rl) => {
    makeQuestion(rl,'Introduzca una pregunta: ')
        .then(q => {
        return makeQuestion(rl,'Introduzca la respuesta: ')
            .then(a =>{
            return{question: q,answer: a};
});
})
.then(quiz => {
        return models.quiz.create(quiz);
})
.then((quiz) =>{
        log(socket,`${colorize('Se ha añadido','magenta' )}: ${question}  ${colorize('=>','magenta')} ${answer}`);

})
.catch(Sequelize.ValidationError, error =>{
        errorlog(socket,'El quiz es erroneo:');
    error.errors.forEach(({message})=>errorlog(socket,message));
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
});

};
/**
 *Borra el quiz indicado del modelo.
 *
 */
exports.deleteCmd = (socket,rl,id) => {
    validateId(id)
        .then(id => models.quiz.destroy({where:{id}}))
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
});
};
/**
 *Edita el quiz indicado del modelo.
 *
 */
exports.editCmd = (socket,rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz =>{
        if(!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.question)},0);
    return makeQuestion(rl,'Introduzca la pregunta: ')
        .then(q =>{
        process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.answer)},0);
    return makeQuestion(rl,'Introduzca la respuesta: ')
        .then(a=>{
        quiz.question = q;
    quiz.answer=a;
    return quiz;
});
});
})
.then(quiz=>{
        return quiz.save();

})
.then(quiz=>{
        log(socket,`Se ha cambiado el quiz ${colorize(id,'magenta')} por: ${question} => ${answer}`);

})
.catch(Sequelize.ValidationError, error =>{
        errorlog(socket,'El quiz es erroneo:');
    error.errors.forEach(({message})=>errorlog(socket,message));
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
});
};

/**
 *Prueba el quiz indicado del sistema.
 *
 */
exports.testCmd = (socket,rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if(!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    return makeQuestion(rl,`${quiz.question}?`)
        .then(answer=>{
        if(quiz.answer.toLowerCase()===answer.toLowerCase().trim()){
        log(socket,"Su respuesta es correcta.");
        //   biglog('Correcta','green');
        rl.prompt();
    }else{
        log(socket,"Su respuesta es incorrecta.");
        //  biglog('Incorrecta','red');
        rl.prompt();
    }
});
})
.catch(Sequelize.ValidationError, error =>{
        errorlog(socket,'El quiz es erroneo:');
    error.errors.forEach(({message})=>errorlog(socket,message));
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
});

};
/**
 *Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 *Se gana si se contesta a todos satisfactoriamente.
 */
exports.playCmd = (socket,rl) => {
    let score = 0;
    let toBeResolved = [];


    const playOne = socket => {
        return new Sequelize.Promise((resolve,reject)=>{
            if(toBeResolved.length === 0){
            // console.log('No hay nada más que preguntar.');
            log(socket,`Fin del examen. Aciertos: ${score}`);
            //biglog(`${score}`, 'magenta');
            return;
        }
        let id =Math.round(Math.random()*(toBeResolved.length-1));
        let quiz = toBeResolved[id];
        toBeResolved.splice(id,1);

        makeQuestion(rl,`${quiz.question}?`)
            .then(answer =>{

            if(quiz.answer.toLowerCase()===answer.toLowerCase().trim()){
            score++;
            log(socket,`Correcto - Lleva' ,${score},'aciertos.`);
            return playOne(socket);
        }else{
            // console.log('INCORRECTO.');
            log(socket,`Incorrecto. Fin del examen. Aciertos: ${score}`);
            //biglog(`${score}`, 'magenta');
            rl.prompt();
        }

    })

    })
    }

    models.quiz.findAll({raw:true})
        .then(quizzes =>{
        toBeResolved=quizzes;
})
.then(()=>{
        return playOne(socket);
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(()=>{
        rl.prompt();
})

};
/**
 *Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = (socket,rl) => {
    log(socket,"Autor de la práctica:");
    log(socket,"Julia Maricalva y Miguel Terriza","green");
    rl.prompt();
};
/**
 *Termina el programa.

 */
exports.quitCmd = (socket,rl) => {
    rl.close();
    socket.end();
};