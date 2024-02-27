import userModel from "../model/model.js";
import otpGenerator from "otp-generator";
import { sendOtp } from "../utils/mailer.js";
import dotenv from "dotenv";
import Jwt from "jsonwebtoken";
import { uploadFileToS3 } from "../utils/s3Upload.js";


dotenv.config();


//generate otp 
export async function generateOtp(req, res, next) {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({
        error: true,
        message: "Phone number is required",
        data: null,
      });
    }
    const generatedOtp = await otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    req.app.locals.OTP = generatedOtp;
    console.log(generatedOtp);
    sendOtp(generatedOtp, number);

    res.status(201).json({error:'false',message:'otp generated successfully',data:{code: generatedOtp}});
  } catch (error) {
    res.status(500).json({
      error: "true",
      message: `something went wrong ${error}`,
      data: null,
    });
  }
}



//verify otp and register number 
export async function register(req, res, next) {
  try {
    const { number, otp } = req.body;
    const storedOTP = req.app.locals.OTP;
    if (storedOTP && parseInt(storedOTP) === parseInt(otp)) {
      const userExist = await userModel.findOne({ number });
      if (!userExist) {
        const user = new userModel({ number: number });
        await user.save();
        console.log("User saved successfully");
        req.app.locals.OTP = null;

        const token = Jwt.sign(
          {
            userid: user._id,
            number: user.number,
          },
          process.env.JWTS,
          { expiresIn: "30d" }
        );
        return res.status(201).json({
          error: false,
          message: "User registered successfully",
          data: number,
          token,
        });
      }else {
        const token = Jwt.sign(
          {
            userid: userExist._id,
            number: userExist.number,
          },
          process.env.JWTS,
          { expiresIn: "24h" }
        );
        return res.status(200).json({
          error: false,
          message: "Logged in",
          data: number,
          token,
        });
      }
    } else {
      return res.status(400).json({
        error: true,
        message: "Invalid OTP",
        data: null,
      });
    }
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({
      error: true,
      message: `Something went wrong ${error}`,
      data: null,
    });
  }
}




//update user info
export async function submitDetails(req, res) {
  try {
    const userId = req.user.userid;
    console.log(userId, "uid");

    const existingUser = await userModel.findOne({_id:userId});

    if (!existingUser) {
      console.log("user not found");
        res
        .status(404)
        .json({ message: "User not found", data: null, error: true });
    } else {
      const updatedUser = await userModel.findOneAndUpdate(
        { _id: userId },
        { ...req.body },
        { new: true }
      );
      console.log("Record updated:", updatedUser);
        res
        .status(200)
        .json({
          message: "Record updated",
          data: updatedUser,
          error: false,
        });
    }

  } catch (error) {
    console.error("Error during user update:", error);
    res
      .status(500)
      .send({ message: `Internal Server Error ${error}`, error: true });
  }
}



//get userdata
export async function getUser(req, res) {
  try {
    const userId = req.user.userid;


    const user = await userModel.findById(userId);


    const response = {
      userId: user._id,
      ...user._doc,
    };
    if (user) {
      res.status(200).json({
        error: false,
        message: "User details retrieved successfully",
        data: response,
      });
    } else {
      res.status(404).json({
        error: true,
        message: "User not found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      data: null,
    });
  }
}




//multiple
export async function submitDP(req, res) {
  try {
    const userId = req.user.userid;
    const uploadedFiles = req.files;
    const imageFolder =  req.user.userid;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const s3Location = await uploadFileToS3(uploadedFiles[0], imageFolder, 'image_0');

    const updatedUser = await userModel.findOneAndUpdate(
      { _id: userId },
      { $set: { [`photoUpload.0`]: s3Location } },
      { new: true }
    );

    return res.status(200).json({
      message: 'File uploaded successfullyy',
      data: { file: uploadedFiles[0], s3Location: s3Location }
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function submitPhotos(req, res) {
  try {
    const uploadedFiles = req.files;
    const imageFolder = req.user.userid;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.user.userid;

    const currentUser = await userModel.findById(userId);
    const newIndex = currentUser.photoUpload && currentUser.photoUpload.length > 0
      ? currentUser.photoUpload.length
      : 0;

    const s3Locations = await Promise.all(
      uploadedFiles.map(async (file, index) => {
        const key = `image_${newIndex + index}`;
        const s3Location = await uploadFileToS3(file, imageFolder, key);
        return s3Location;
      })
    );

    // Update the user with the new images
    const updatedUser = await userModel.findOneAndUpdate(
      { _id: userId },
      { $push: { photoUpload: { $each: s3Locations, $position: newIndex } } },
      { new: true }
    );

    return res.status(200).json({
      message: 'Files uploaded successfully',
      data: { files: uploadedFiles, s3Locations: s3Locations }
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


export async function getAllUsers(req, res) {
  try {
    // Get the user ID from the token
    const userId = req.user.userid;

    // Find all users excluding the current user
    const users = await userModel.find({ _id: { $ne: userId } });
    
    res.status(200).json({
      error: false,
      message: "User details retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      data: null,
    });
  }
}



export async function getUserById(req, res) {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
        data: null,
      });
    }

    res.status(200).json({
      error: false,
      message: "User details retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error('Error retrieving user by ID:', error);

    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      data: null,
    });
  }
}