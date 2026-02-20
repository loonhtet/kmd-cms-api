import { uploadToCloudflare } from "../utils/cloudflare.js";

export const uploadFile = async (req, res) => { 
    try { if (!req.file) {
         return res.status(400).json({
             success: false, 
             message: "No file provided", 
            }); } 
            const uploaded = await uploadToCloudflare(req.file); // Auto-detect asset type 
            assetType = "DOCUMENT";
             if (req.file.mimetype.startsWith("image")) assetType = "IMAGE";
              else if (req.file.mimetype.startsWith("video")) assetType = "VIDEO";
               res.status(200).json({
                 success: true, 
                 url: uploaded.url, assetType, }); 
                } catch (error) { 
                    res.status(500).json({
                         success: false,
                          message: error.message,
                         }); 
                        }
                     };