const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyC9fX_QgVBAmJCRmc4BZph2Jh47aIU4HyY");

async function listModels() {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC9fX_QgVBAmJCRmc4BZph2Jh47aIU4HyY");
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
listModels();
