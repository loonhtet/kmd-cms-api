import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
     const payload = { id: userId };
     const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
     });

     res.cookie("jwtToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000,
     });

     return token;
};

export default generateToken;
