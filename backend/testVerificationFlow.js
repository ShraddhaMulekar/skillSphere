import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserModel } from "./models/UserModel.js";
import { registerController } from "./controllers/authControllers/registerController.js";
import { verifyEmail } from "./controllers/authControllers/verifyEmail.js";

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to DB");

try {
  // 1. Clear existing test user
  const email = "test_verification_code@gmail.com";
  await UserModel.deleteMany({ email });
  console.log("Cleared old test user");

  // 2. Mock Register Request
  let registeredCode = "";
  const mockRegisterReq = {
    body: {
      name: "Test Code User",
      email,
      password: "password123",
      role: "client"
    }
  };

  const mockRegisterRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      console.log("Register Response Status:", this.statusCode);
      console.log("Register Response Data:", JSON.stringify(data, null, 2));
      registeredCode = data.verificationCode;
      return this;
    }
  };

  await registerController(mockRegisterReq, mockRegisterRes);

  if (!registeredCode) {
    throw new Error("Verification code was not generated or returned!");
  }
  console.log("Verification Code generated successfully:", registeredCode);

  // 3. Mock Verify Request with WRONG code
  const mockVerifyWrongReq = {
    method: "POST",
    body: {
      email,
      code: "000000"
    }
  };

  const mockVerifyWrongRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      console.log("Verify (Wrong Code) Response Status:", this.statusCode);
      console.log("Verify (Wrong Code) Response Data:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  await verifyEmail(mockVerifyWrongReq, mockVerifyWrongRes);
  if (mockVerifyWrongRes.statusCode !== 400) {
    throw new Error("Should have failed with wrong code!");
  }

  // 4. Mock Verify Request with CORRECT code
  const mockVerifyCorrectReq = {
    method: "POST",
    body: {
      email,
      code: registeredCode
    }
  };

  const mockVerifyCorrectRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      console.log("Verify (Correct Code) Response Status:", this.statusCode);
      console.log("Verify (Correct Code) Response Data:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  await verifyEmail(mockVerifyCorrectReq, mockVerifyCorrectRes);
  if (mockVerifyCorrectRes.statusCode !== 200) {
    throw new Error("Should have succeeded with correct code!");
  }

  // Check in DB
  const user = await UserModel.findOne({ email });
  console.log("User verified status in DB:", user.isVerified);
  if (!user.isVerified) {
    throw new Error("User was not marked as verified in DB!");
  }

  console.log("Verification flow test completed successfully! All checks passed.");
} catch (err) {
  console.error("Test failed:", err);
} finally {
  await mongoose.connection.close();
}
