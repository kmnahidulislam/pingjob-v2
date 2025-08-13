// Simple test script to verify logo upload functionality
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure multer for image uploads
const imageUpload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and GIF images are allowed'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for images
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use(express.static('.'));

// Test upload endpoint
app.post('/test-upload', imageUpload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const filename = `test-logo-${timestamp}${ext}`;
    const logoUrl = `/uploads/${filename}`;

    // Rename file to have proper extension
    const oldPath = req.file.path;
    const newPath = path.join('uploads', filename);
    
    fs.renameSync(oldPath, newPath);

    res.json({ 
      success: true, 
      logoUrl,
      message: "Logo uploaded successfully!",
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(500).json({ message: "Failed to upload logo" });
  }
});

// Simple test page
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Logo Upload Test</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .upload-area { border: 2px dashed #ccc; padding: 20px; text-align: center; margin: 20px 0; }
            .preview { margin: 20px 0; }
            .preview img { max-width: 200px; max-height: 200px; border: 1px solid #ddd; }
            button { background: #007cba; color: white; border: none; padding: 10px 20px; cursor: pointer; }
            button:hover { background: #005a87; }
            .result { margin: 20px 0; padding: 10px; background: #f0f0f0; }
        </style>
    </head>
    <body>
        <h1>Company Logo Upload Test</h1>
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-area">
                <input type="file" id="logoFile" name="logo" accept="image/*" required>
                <p>Select a company logo (JPG, PNG, GIF - max 2MB)</p>
            </div>
            <div class="preview" id="preview" style="display:none;">
                <h3>Preview:</h3>
                <img id="previewImg" alt="Preview">
            </div>
            <button type="submit">Test Upload</button>
        </form>
        <div id="result" class="result" style="display:none;"></div>

        <script>
            const form = document.getElementById('uploadForm');
            const fileInput = document.getElementById('logoFile');
            const preview = document.getElementById('preview');
            const previewImg = document.getElementById('previewImg');
            const result = document.getElementById('result');

            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImg.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });

            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData();
                formData.append('logo', fileInput.files[0]);

                try {
                    const response = await fetch('/test-upload', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        result.innerHTML = \`
                            <h3>✅ Upload Successful!</h3>
                            <p><strong>File:</strong> \${data.originalName}</p>
                            <p><strong>Size:</strong> \${(data.size / 1024).toFixed(1)} KB</p>
                            <p><strong>URL:</strong> <a href="\${data.logoUrl}" target="_blank">\${data.logoUrl}</a></p>
                            <p><strong>Message:</strong> \${data.message}</p>
                        \`;
                        result.style.background = '#d4edda';
                    } else {
                        result.innerHTML = \`<h3>❌ Upload Failed</h3><p>\${data.message}</p>\`;
                        result.style.background = '#f8d7da';
                    }
                    result.style.display = 'block';
                } catch (error) {
                    result.innerHTML = \`<h3>❌ Error</h3><p>\${error.message}</p>\`;
                    result.style.background = '#f8d7da';
                    result.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
  `);
});

console.log('Test server starting on port 3001...');
app.listen(3001, () => {
  console.log('Logo upload test available at: http://localhost:3001/test');
});