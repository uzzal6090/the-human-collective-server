import type { Response } from "express";
import { ObjectId } from "mongodb";
import { database } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/verifyToken.js";

// GET User Profile (PDF Optional Feature)
export async function getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user?.email && !user?.id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const userCollection = database.collection("user");
    const query = user.id && ObjectId.isValid(user.id)
      ? { _id: new ObjectId(user.id) }
      : { email: user.email };

    const dbUser = await userCollection.findOne(query);

    if (!dbUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        id: dbUser._id?.toString(),
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image || "",
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
}

// PUT Update User Profile (PDF Optional Feature)
export async function updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user?.email && !user?.id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { name, image } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long",
      });
      return;
    }

    const userCollection = database.collection("user");
    const query = user.id && ObjectId.isValid(user.id)
      ? { _id: new ObjectId(user.id) }
      : { email: user.email };

    const updateDoc: Record<string, any> = {
      name: name.trim(),
      updatedAt: new Date(),
    };

    if (image !== undefined) {
      updateDoc.image = typeof image === "string" ? image.trim() : "";
    }

    const result = await userCollection.findOneAndUpdate(
      query,
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: result ? {
        name: result.name,
        email: result.email,
        image: result.image,
      } : { name, image },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: "Failed to update user profile" });
  }
}
