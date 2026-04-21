const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyC9fX_QgVBAmJCRmc4BZph2Jh47aIU4HyY");

async function list() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("1.5-flash success");
  } catch (e) {
    console.error("1.5-flash failed:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent("test");
    console.log("2.0-flash-exp success");
  } catch (e) {
    console.error("2.0-flash-exp failed:", e.message);
  }
}
list();
