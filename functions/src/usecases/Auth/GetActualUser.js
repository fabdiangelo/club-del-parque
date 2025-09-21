import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

class GetActualUser {
  execute(token) {
    try{
      const decodedUser = jwt.verify(token, JWT_SECRET);
      return decodedUser;
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new GetActualUser();