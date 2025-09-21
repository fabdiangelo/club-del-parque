import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

class GetActualUser {
  async execute(token) {
    try{
      return jwt.verify(token, JWT_SECRET);
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new GetActualUser();