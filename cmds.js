const model = require('./model');
const {log, biglog, errorlog, colorize}= require("./out");

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

  model.getAll().forEach((quiz,id) => {
    log(`[${colorize(id,'magenta')}]: ${quiz.question}`);
  });


  rl.prompt();
  };
/**
*Muestra el quiz indicado en el parámtro: la pregunta y la respuesta
*
*/
exports.showCmd = (rl,id) => {

  if(typeof id === "undefined"){
    errorlog("Falta el parámetro id.");
  }else{
    try{
      const quiz = model.getByIndex(id);
      log(`  [${colorize(id,'magenta')}]: ${quiz.question}  ${colorize('=>','magenta')}  ${quiz.answer}`);
    }catch(error){
      errorlog(error.message);
    }
  }
    rl.prompt();
};
/**
*Añade un nuevo quiz al modelo.
*Pregunta interactivamente por la pregunta y por la respuesta
*
*/
exports.addCmd = rl => {
      rl.question(colorize('Introduzca una pregunta: ','red'), question =>{
        rl.question(colorize('Introduzca una respuesta: ','red'), answer => {
            model.add(question,answer);
            log(`${colorize('Se ha añadido','magenta' )}: ${question}  ${colorize('=>','magenta')} ${answer}`);
            rl.prompt();
        });
      });

};
/**
*Borra el quiz indicado del modelo.
*
*/
exports.deleteCmd = (rl,id) => {
    if(typeof id === "undefined"){
      errorlog("Falta el parámetro id.");
    }else{
      try{
          model.deletetByIndex(id);
      }catch(error){
        errorlog(error.message);
      }
    }



      rl.prompt();
};
/**
*Edita el quiz indicado del modelo.
*
*/
exports.editCmd = (rl,id) => {
  if(typeof id === "undefined"){
    errorlog("Falta el parámetro id.");
    rl.prompt();
  }else{
    try{
      const quiz =model.getByIndex(id);
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

      rl.question(colorize('Introduzca una pregunta: ','red'), question =>{
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
        rl.question(colorize('Introduzca una respuesta: ','red'), answer => {
            model.update(id,question,answer);
            log(`Se ha cambiado el quiz ${colorize(id,'magenta')} por: ${question} => ${answer}`);
            rl.prompt();
        });
      });
    }catch(error){
      errorlog(error.message);
      rl.prompt();
    }
  }
};
/**
*Prueba el quiz indicado del sistema.
*
*/
exports.testCmd = (rl,id) => {
    if(typeof id === "undefined"){
      errorlog("Falta el parámetro id.");
      rl.prompt();
    }else{
      try{
        const quiz =model.getByIndex(id);
        rl.question(`${quiz.question} ? `,answer =>{
           if(answer.trim() === quiz.answer){
             log("La respuesta es correcta.",'green');
             biglog("¡CORRECTO!","green");
           }else{
             log("La respuesta es incorrecta.",'red');
             biglog("¡INCORRECTO!","red");
           }
           rl.prompt();
        });

      }catch(error){

        errorlog(error.message);
        rl.prompt();
      }

    }




};
/**
*Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
*Se gana si se contesta a todos satisfactoriamente.
*/
exports.playCmd = rl => {
    let score = 0;
    let toBeResolved = [];
    let numberQuestions=model.count();
    for( i =0; i< numberQuestions ; i++){
      toBeResolved[i]=i;
    }

    const playOne = () => {

          if(toBeResolved.length === 0){
            log("No hay preguntas.");
            log(`Fin del juego. Aciertos : ${score} `);
             biglog(`${score} `,'green')
            rl.prompt()
          }else{

            let id =Math.round(Math.random()*(toBeResolved.length)-1);

            if(id ===-1){
              id++;
            }

            ;


            const quiz =model.getByIndex(toBeResolved[id]);


            rl.question(`${quiz.question} ? `,answer =>{
               if(answer.trim() === quiz.answer){
                 score++;
                 log(` ¡CORRECTO! - Tiene ${score} aciertos.`);
                 toBeResolved.splice(id,1);
                 

                 playOne();
               }else{
                 log("¡INCORRECTO!");
                 log(`Fin del juego. Aciertos : ${score} `);
                 biglog(`${score} `,'red');
                 rl.prompt();
               }

          });
      }}
      playOne();
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
