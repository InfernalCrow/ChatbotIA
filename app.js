/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */

"use strict";

// acceso al token de nuestra app de Whatsapp

// token que se encuentra en el .env los tokens de whatsapp
const token = process.env.WHATSAPP_TOKEN;

// Imports de los modulos y del set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()); // creates express http server se convierte en un middleware

// configura el puerto del servidor  y los mensajes del logs  
app.listen(process.env.PORT || 1337, () => console.log("webhook está en línea"));

// POST para manejar solicitudes entrantes
app.post("/webhook", async (req, res) => {
  //  extrae la solicitud entrante
  let body = req.body;

  // imprime la solicitud entrante en el log
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      //Extracción de datos del mensaje de WhatsApp
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
//Definición del modelo de IA GPT a utilizar
      let openia_data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
  //Descripción del asistente, enfoque y restricciones          
            role: "system",
            content:
              "Soy Clara, soy amable y simpatica, con respuestas creativas, una ayudante de profesor de ciencias naturales y ayudar a responder cualquier duda respecto a Ciencias Sociales, Informática, Etiqueta, Biología, Química, Física, Matemáticas, Contabilidad, Astronomía, etc  a nivel educativo de premedia para estudiantes entre 12 a 16 años. si te pregunta por algo que esta relacionado con Contenido sexual o explícito, Actividades ilegales, Asuntos personales de entretenimiento como deportes, videojuegos, música, uso de medicamentos, etc. basicamente cosas que no tengan que ver con educación o la escuela, procedes a disculparte y que no puedes asistir con eso, uso excluso para cosas educativas",
          },
          {
            role: "user",
            content: msg_body,
          },
        ],
      });
//API de OpenIA
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer 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",
          Cookie:
            "__cf_bm=kHigvkX9SYNQSfXbXdzsbSQox3Of.HHFMwoZa5f2_Go-1706242707-1-ASNQgLpls8C9vl1bmaoQ8YCo3rEoCPQWE0AnCkcz1kFo/fJxzhFVIFShR3tAl6H7J12R6Mi77F+sVyy4bRr2cy0=; _cfuvid=HNjth77Izjy1ery0uztlWfzS720HFJCeXIR1dsLEo4o-1706242707983-0-604800000",
        },
        data: openia_data,
      };
//respuesta al telefono temporal de whatsapp
      await axios
        .request(config)
        .then((response) => {
          const response_data = response.data;
          console.log(JSON.stringify(response.data));

          axios({
            method: "POST", // Requerido,metodo HTTP , un string, e.g. POST, GET
            url:
              "https://graph.facebook.com/v12.0/" +
              phone_number_id +
              "/messages?access_token=" +
              token,
            data: {
              messaging_product: "whatsapp",
              to: from,
              text: { body: response_data.choices[0].message.content },
            },
            headers: { "Content-Type": "application/json" },
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
