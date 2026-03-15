const jwt = require("jsonwebtoken");
const staffModel = require("../models/staff.model");

const buildVerifyOptions = () => {
  const options = {};
  if (process.env.SUPABASE_JWT_ISSUER) {
    options.issuer = process.env.SUPABASE_JWT_ISSUER;
  }
  if (process.env.SUPABASE_JWT_AUD) {
    options.audience = process.env.SUPABASE_JWT_AUD;
  }
  return options;
};

const verifyToken = (token) => {
  const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
  const appSecret = process.env.JWT_SECRET;
  const options = buildVerifyOptions();

  if (supabaseSecret) {
    try {
      return jwt.verify(token, supabaseSecret, options);
    } catch (error) {
      if (!appSecret) {
        throw error;
      }
    }
  }

  return jwt.verify(token, appSecret);
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const staffId = decoded.staff_id || decoded.sub;
    const staffEmail = decoded.email;
    let staff = null;

    if (staffId) {
      staff = await staffModel.getStaffById(staffId);
    }

    if (!staff && staffEmail) {
      staff = await staffModel.getStaffByEmail(staffEmail);
    }

    if (!staff) {
      return res.status(401).json({ message: "Invalid token subject" });
    }

    req.user = {
      staff_id: staff.staff_id,
      email: staff.email,
      role: staff.role,
      department_id: staff.department_id,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", details: error.message });
  }
};

module.exports = authMiddleware;
