const {models} = require('./model');
const {log, biglog, errorlog, colorize}= require("./out");
const Sequelize = require('sequelize');

/**
*Muestra la ayuda.
*/
exports.helpCmd = rl => {
  log("Comandos:");
  log(" h|help - Muestra esta ayuda.");
  log(" list - Listar los quizzes existentes.");
  log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
  log(" add - Añadir un nuevo quiz internamente.");
  log(" delete <id> - Borrar el quiz indicado.");
  log(" edit <id> - Editar el quiz indicado.");
  log(" test <id> - Probar el quiz indicado.");
  log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
  log(" credits - Créditos.");
  log(" q|quit - Salir del programa.");
  rl.prompt();
};
/**
*Lista todos los quizzes existentes en el Modelo
*
*/
exports.listCmd = rl => {

  models.quiz.findAll()
  .each(quiz=>{
      log(` [${colorize(quiz.id,'magenta')}]: ${quiz.question}`);

    })
  .catch(error => {
        errorlog(error.message);
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
exports.showCmd = (rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(`  [${colorize(id,'magenta')}]: ${quiz.question}  ${colorize('=>','magenta')}  ${quiz.answer}`);
    })
.catch(error => {
        errorlog(error.message);
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
exports.addCmd = rl => {
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
        log(`${colorize('Se ha añadido','magenta' )}: ${question}  ${colorize('=>','magenta')} ${answer}`);

})
    .catch(Sequelize.ValidationError, error =>{
        errorlog('El quiz es erroneo:');
    error.errors.forEach(({message})=>errorlog(message));
    })
.catch(error => {
        errorlog(error.message);
})
.then(()=>{
        rl.prompt();
});

};
/**
*Borra el quiz indicado del modelo.
*
*/
exports.deleteCmd = (rl,id) => {
    validateId(id)
        .then(id => models.quiz.destroy({where:{id}}))
.catch(error => {
        errorlog(error.message);
})
.then(()=>{
        rl.prompt();
});
};
/**
*Edita el quiz indicado del modelo.
*
*/
exports.editCmd = (rl,id) => {
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
        log(`Se ha cambiado el quiz ${colorize(id,'magenta')} por: ${question} => ${answer}`);

})
.catch(Sequelize.ValidationError, error =>{
        errorlog('El quiz es erroneo:');
    error.errors.forEach(({message})=>errorlog(message));
})
.catch(error => {
        errorlog(error.message);
})
.then(()=>{
        rl.prompt();
});
};

/**
*Prueba el quiz indicado del sistema.
*
*/
exports.testCmd = (rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
        return makeQuestion(rl,`${quiz.question}?`)
            .then(answer=>{
                if(quiz.answer.toLowerCase()===answer.toLowerCase().trim()){
                    log("Su respuesta es correcta");
                    biglog('Correcta','green');
                    rl.prompt();
    }else{
        log("Su respuesta es incorrecta");
        biglog('Incorrecta','red');
        rl.prompt();
    }
            });
    })
.catch(Sequelize.ValidationError, error =>{
        errorlog('El quiz es erroneo:');
    error.errors.forEach(({message})=>errorlog(message));
})
.catch(error => {
        errorlog(error.message);
})
.then(()=>{
        rl.prompt();
});

};
/**
*Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
*Se gana si se contesta a todos satisfactoriamente.
*/
exports.playCmd = rl => {
    let score = 0;
    let toBeResolved = [];


    const playOne = () => {
return new Promise((resolve,reject)=>{
    if(toBeResolved.length === 0){
        log(`No hay nada mas que preguntar.n\ Fin del Juego. Aciertos : ${score}`);
            biglog(`${score} `,'green');
            resolve();
            return;
        }
        let id =Math.round(Math.random()*(toBeResolved.length-1));
        let quiz = toBeResolved[id];
        toBeResolved.splice(id,1);

        makeQuestion(rl,`${quiz.question}?`)
            .then(answer =>{
            if(quiz.answer.toLowerCase()===answer.toLowerCase().trim()){
            score++;
            log(`CORRECTO - Lleva ${score} ${colorize(' aciertos')}`);
            return playOne();
        }else{
            log('INCORRECTO.');
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(`${score}`, 'magenta');
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
        return playOne();
    })
.catch(error => {
        errorlog(error.message);
})
.then(()=>{
    log(score,'magenta');
    rl.prompt();
})

};
/**
*Muestra los nombres de los autores de la práctica.
*/
exports.creditsCmd = rl => {
    log("Autor de la práctica:");
    log("Julia Maricalva y Miguel Terriza","green");
    rl.prompt();
};
/**
*Termina el programa.

*/
exports.quitCmd = rl => {
    rl.close();
};
