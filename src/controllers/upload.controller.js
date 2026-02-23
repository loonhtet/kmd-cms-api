import { uploadToCloudflare } from "../utils/cloudflare.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    // 1. Define the folder prefix
    const folder = "blogs/";

    // 2. Pass the folder to your utility function 
    // (Assuming you update uploadToCloudflare to accept a prefix)
    const key = await uploadToCloudflare(req.file, folder);

    let assetType = "IMAGE";

    if (req.file.mimetype.startsWith("image")) assetType = "IMAGE";
    else if (req.file.mimetype.startsWith("video")) assetType = "VIDEO";

    res.status(200).json({
      success: true,
      key,           // ✅ send key
      assetType,     // ✅ send type
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// {
//     "success": true,
//     "url": "undefined/1771761055679-Image.jpg",
//     "assetType": "IMAGE"
// }

// {
//     "success": true,
//     "url": "undefined/1771761421764-notFound.png",
//     "assetType": "IMAGE"
// }