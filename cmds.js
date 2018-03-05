

const model = require('./model');
const {log,biglog,errorlog,colorize} = require('./out');


/**
 * Muestra la ayuda.
 **/
exports.helpCmd = (rl) =>{
    log("Comandos :");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta al quiz indicado.");
    log(" add - Añadir un nuevo quiz interactivamente.");
    log(" delete <id> - Borrar el quiz indicado.");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(" credits - Creditos.");
    log(" q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Lista quizzes existentes.
 **/
exports.listCmd = (rl) =>{
model.getAll().forEach((quiz,id)=>{
    log(` [${colorize(id,'magenta')}] : ${quiz.question}`)
});
    rl.prompt();
};

/**
 * Muestra pregunta y respuesta quiz indicado.
 **/
exports.showCmd = (rl,id) =>{
    if(typeof id === "undefined"){
        errorlog(`Falta parametro id`);
    }else{
        try{
            const quiz = model.getByIndex(id);
            log(` [${colorize(id,'magenta')}] : ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)
        } catch(error){
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 * Anadir nuevo quiz.
 **/
exports.addCmd = (rl) =>{
    rl.question(colorize(' Introduzca una pregunta:','red'), question =>{
        rl.question(colorize(' Introduzca la respuesta', 'red'), answer =>{

            model.add(question,answer);
            log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta')} ${answer} `);
                rl.prompt();
        });
    });
};

/**
 * Borra quiz indicado.
 **/
exports.deleteCmd = (rl,id) =>{
    if(typeof id === "undefined"){
        errorlog(`Falta parametro id`);
    }else{
        try{
            model.deleteByIndex(id);

        } catch(error){
            errorlog(error.message);
        }
    }

    rl.prompt();

};

/**
 * edita quiz indicado.
 **/
exports.editCmd = (rl,id) =>{
    if(typeof id === "undefined"){
        errorlog(`Falta parametro id`);
    }else{
        try{
            quiz = model.getByIndex(id);
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            rl.question(colorize(' Introduzca una pregunta:','red'), question =>{
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                rl.question(colorize(' Introduzca la respuesta', 'red'), answer =>{
                    model.update(id,question,answer);
                    log(`Se ha cambiado el quiz ${colorize(id , 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer} `);
                    rl.prompt();
                });
            });

        } catch(error){
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 * Prueba quiz indicado.
 **/
exports.testCmd = (rl,id) =>{
    if(typeof id === "undefined"){
        errorlog(`Falta parametro id`);
        rl.prompt;
    }else{
        try{
            quiz = model.getByIndex(id);
            rl.question(`${colorize(quiz.question, 'yellow')} ${colorize(' => ', 'magenta')}` , answer =>{
              let respuesta = answer.toLowerCase().trim();
                if(respuesta === quiz.answer.toLowerCase().trim()){
                  biglog("Correcto!", 'green');
                    rl.prompt;
              }else{
                  biglog('Incorrecto!','red');
                    rl.prompt;
              }

            });

        } catch(error){
            errorlog(error.message);
            rl.prompt();
        }
    }

};

/**
 * Jugar.
 **/
exports.playCmd = rl =>{

    let score = 0;
    let toBeResolved = [];

    for(var i = 0; i < model.count();i++){
        toBeResolved[i]=i;
    }

    const playOne = () => {

        if (toBeResolved.length === 0) {
            log('No hay mas preguntas a responder', 'blue');
            log('RESULTADO', 'magenta');
            biglog(score, 'magenta');
            rl.prompt();
        } else {
            try {

                let id_random = Math.floor(Math.random() * (toBeResolved.length));
                let id = toBeResolved[id_random];
                let quiz = model.getByIndex(id);

                rl.question(`${colorize(quiz.question, 'yellow')} ${colorize(' => ', 'magenta')}`, answer => {

                    let respuesta = answer.toLowerCase().trim();

                    if (respuesta === quiz.answer.toLowerCase().trim()) {
                        biglog("Correcto!", 'green');
                        score++;
                        toBeResolved.splice(id_random, 1);
                        playOne();

                    } else {
                        biglog('Incorrecto!', 'red');
                        log('Fin del Juego', 'yellow');
                        log('RESULTADO','magenta');
                        biglog(score, 'magenta');
                        rl.prompt();

                    }

                });

            } catch (error) {
                errorlog(error.message);
                rl.prompt();
            }

        }
    }
    playOne();
};

/**
 * Muestra nombre autores practica.
 **/
exports.creditsCmd = rl =>{
    log('Autores de la Practica:');
    log('Julia Maricalva Moreno','green');
    log('Miguel Terriza Roberto','green');
    rl.prompt();
};

/**
 * Salir.
 **/
exports.quitCmd = rl =>{
    rl.close();
};