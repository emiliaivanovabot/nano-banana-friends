const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = new formidable.IncomingForm();
    form.uploadDir = '/tmp';
    form.keepExtensions = true;
    
    const [fields, files] = await form.parse(req);
    
    const file = files.file;
    const remotePath = fields.path;
    const filename = fields.filename;
    
    if (!file || !remotePath || !filename) {
      return res.status(400).json({ 
        error: 'Missing required fields: file, path, or filename' 
      });
    }

    // FTP Upload to Boertlay
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    try {
      // FTP Connection - these will need to be provided by user
      await client.access({
        host: process.env.BOERTLAY_FTP_HOST,
        user: process.env.BOERTLAY_FTP_USER,
        password: process.env.BOERTLAY_FTP_PASSWORD,
        port: parseInt(process.env.BOERTLAY_FTP_PORT) || 21,
        secure: false
      });

      // Ensure remote directory exists
      await client.ensureDir(remotePath);
      
      // Upload file
      await client.uploadFrom(file.filepath, path.join(remotePath, filename));
      
      // Close connection
      client.close();
      
      // Clean up local temp file
      fs.unlinkSync(file.filepath);
      
      const publicUrl = `${process.env.BOERTLAY_BASE_URL}${remotePath}${filename}`;
      
      return res.status(200).json({
        success: true,
        url: publicUrl,
        message: 'File uploaded successfully'
      });
      
    } catch (ftpError) {
      console.error('FTP Error:', ftpError);
      client.close();
      
      // Clean up local temp file
      if (file.filepath && fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
      
      return res.status(500).json({
        error: 'FTP upload failed',
        details: ftpError.message
      });
    }
    
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};